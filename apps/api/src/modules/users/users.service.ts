import {
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  AuthTokenType,
  CompanyStatus,
  RoleScope,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { PaginatedResult } from '../../common/pagination/paginated-result.interface';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import type { InviteUserDto } from './dto/invite-user.dto';
import type { ListUsersQueryDto } from './dto/list-users-query.dto';
import type { ReplaceUserRolesDto } from './dto/replace-user-roles.dto';
import type { UpdateUserStatusDto } from './dto/update-user-status.dto';
import type {
  UserInvitationResult,
  UserResponse,
} from './interfaces/user-response.interface';
import { UserInvitationService } from './user-invitation.service';
import { SETTINGS_BY_KEY } from '../settings/settings.registry';

const USER_SELECT = {
  id: true,
  email: true,
  accountScope: true,
  companyId: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    select: {
      role: {
        select: {
          key: true,
        },
      },
    },
  },
} as const;

interface UserRecord {
  id: string;
  email: string;
  accountScope: AccountScope;
  companyId: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userRoles: Array<{
    role: {
      key: string;
    };
  }>;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly invitationService: UserInvitationService,
  ) {}

  async list(
    principal: AuthenticatedPrincipal,
    query: ListUsersQueryDto,
  ): Promise<PaginatedResult<UserResponse>> {
    const where: Prisma.UserWhereInput =
      principal.accountScope === AccountScope.COMPANY
        ? {
            companyId: this.requireCompanyId(principal),
            ...(query.status
              ? {
                  status: query.status,
                }
              : {}),
          }
        : {
            ...(query.companyId
              ? {
                  companyId: query.companyId,
                }
              : {}),
            ...(query.status
              ? {
                  status: query.status,
                }
              : {}),
          };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({
        where,
      }),
      this.prisma.user.findMany({
        where,
        orderBy: {
          email: 'asc',
        },
        skip: query.offset,
        take: query.limit,
        select: USER_SELECT,
      }),
    ]);

    return {
      items: users.map((user) => this.toResponse(user)),
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total,
      },
    };
  }

  async getById(
    principal: AuthenticatedPrincipal,
    userId: string,
  ): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: this.scopedUserWhere(principal, userId),
      select: USER_SELECT,
    });

    if (!user) {
      throw this.notFound();
    }

    return this.toResponse(user);
  }

  async invite(
    principal: AuthenticatedPrincipal,
    dto: InviteUserDto,
  ): Promise<UserInvitationResult> {
    const target = this.resolveInvitationTarget(principal, dto);

    if (target.companyId) {
      await this.assertCompanyUserCapacity(target.companyId);
    }

    const email = dto.email.trim();
    const normalizedEmail = email.toLowerCase();

    const invitation = this.invitationService.createToken();

    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: {
          normalizedEmail,
        },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        throw new ConflictException(
          'A user with this email address already exists.',
        );
      }

      if (target.accountScope === AccountScope.COMPANY) {
        const companyId = target.companyId;

        if (!companyId) {
          throw new BadRequestException('Company users require a company id.');
        }

        const company = await tx.company.findUnique({
          where: {
            id: companyId,
          },
          select: {
            status: true,
          },
        });

        if (!company) {
          throw new BadRequestException('The selected company does not exist.');
        }

        if (company.status !== CompanyStatus.ACTIVE) {
          throw new BadRequestException(
            'Users can only be invited to an active company.',
          );
        }
      }

      const roles = await this.resolveRoles(
        tx,
        dto.roleKeys,
        target.accountScope,
      );

      const user = await tx.user.create({
        data: {
          email,
          normalizedEmail,
          accountScope: target.accountScope,
          companyId: target.companyId,
          status: UserStatus.INVITED,
          userRoles: {
            create: roles.map((role) => ({
              roleId: role.id,
            })),
          },
        },
        select: USER_SELECT,
      });

      await tx.authToken.create({
        data: {
          userId: user.id,
          type: AuthTokenType.INVITATION,
          tokenHash: invitation.tokenHash,
          expiresAt: invitation.expiresAt,
        },
      });

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: target.companyId,
          action: AUDIT_ACTIONS.USER_INVITED,
          targetType: 'user',
          targetId: user.id,
          metadata: {
            accountScope: target.accountScope,
            roleKeys: roles.map((role) => role.key).sort(),
          },
        },
        tx,
      );

      return {
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        user: this.toResponse(user),
      };
    });
  }

  async updateStatus(
    principal: AuthenticatedPrincipal,
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<UserResponse> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: this.scopedUserWhere(principal, userId),
        select: {
          ...USER_SELECT,
          company: {
            select: {
              status: true,
            },
          },
        },
      });

      if (!existing) {
        throw this.notFound();
      }

      if (existing.status === UserStatus.INVITED) {
        throw new BadRequestException(
          'Invited users must activate their account through the invitation flow.',
        );
      }

      if (
        dto.status === UserStatus.SUSPENDED &&
        existing.id === principal.userId
      ) {
        throw new ForbiddenException('You cannot suspend your own account.');
      }

      if (
        dto.status === UserStatus.ACTIVE &&
        existing.accountScope === AccountScope.COMPANY &&
        existing.company?.status !== CompanyStatus.ACTIVE
      ) {
        throw new BadRequestException(
          'A user cannot be activated while its company is not active.',
        );
      }

      if (existing.status === dto.status) {
        return this.toResponse(existing);
      }

      if (dto.status === UserStatus.SUSPENDED) {
        await this.assertNotLastActiveAdmin(tx, existing);
      }

      const user = await tx.user.update({
        where: {
          id: existing.id,
        },
        data: {
          status: dto.status,
        },
        select: USER_SELECT,
      });

      if (dto.status === UserStatus.SUSPENDED) {
        await tx.session.updateMany({
          where: {
            userId: existing.id,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      }

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: existing.companyId,
          action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
          targetType: 'user',
          targetId: existing.id,
          metadata: {
            previousStatus: existing.status,
            status: dto.status,
          },
        },
        tx,
      );

      return this.toResponse(user);
    });
  }

  async replaceRoles(
    principal: AuthenticatedPrincipal,
    userId: string,
    dto: ReplaceUserRolesDto,
  ): Promise<UserResponse> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: this.scopedUserWhere(principal, userId),
        select: USER_SELECT,
      });

      if (!existing) {
        throw this.notFound();
      }

      const roles = await this.resolveRoles(
        tx,
        dto.roleKeys,
        existing.accountScope,
      );

      const currentRoleKeys = existing.userRoles
        .map(({ role }) => role.key)
        .sort();

      const newRoleKeys = roles.map((role) => role.key).sort();

      const adminRoleKey = this.adminRoleKey(existing.accountScope);

      if (
        existing.id === principal.userId &&
        currentRoleKeys.includes(adminRoleKey) &&
        !newRoleKeys.includes(adminRoleKey)
      ) {
        throw new ForbiddenException(
          'You cannot remove your own administrative role.',
        );
      }

      if (
        currentRoleKeys.includes(adminRoleKey) &&
        !newRoleKeys.includes(adminRoleKey)
      ) {
        await this.assertNotLastActiveAdmin(tx, existing);
      }

      if (
        currentRoleKeys.length === newRoleKeys.length &&
        currentRoleKeys.every(
          (roleKey, index) => roleKey === newRoleKeys[index],
        )
      ) {
        return this.toResponse(existing);
      }

      await tx.userRole.deleteMany({
        where: {
          userId: existing.id,
        },
      });

      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId: existing.id,
          roleId: role.id,
        })),
      });

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: existing.companyId,
          action: AUDIT_ACTIONS.USER_ROLES_CHANGED,
          targetType: 'user',
          targetId: existing.id,
          metadata: {
            previousRoleKeys: currentRoleKeys,
            roleKeys: newRoleKeys,
          },
        },
        tx,
      );

      const user = await tx.user.findUniqueOrThrow({
        where: {
          id: existing.id,
        },
        select: USER_SELECT,
      });

      return this.toResponse(user);
    });
  }
  private async assertCompanyUserCapacity(companyId: string): Promise<void> {
    const key = 'companies.max_users_per_company';
    const companyScopeKey = 'company:' + companyId;
    const [records, currentUsers] = await Promise.all([
      this.prisma.setting.findMany({
        where: {
          key,
          scopeKey: { in: [companyScopeKey, 'platform'] },
        },
        select: { scopeKey: true, value: true },
      }),
      this.prisma.user.count({ where: { companyId } }),
    ]);
    const companySetting = records.find(
      (record) => record.scopeKey === companyScopeKey,
    );
    const platformSetting = records.find(
      (record) => record.scopeKey === 'platform',
    );
    const definition = SETTINGS_BY_KEY.get(key);
    const maximumUsers =
      companySetting?.value ??
      platformSetting?.value ??
      definition?.defaultValue;

    if (
      typeof maximumUsers !== 'number' ||
      !Number.isSafeInteger(maximumUsers) ||
      maximumUsers < 1
    ) {
      throw new InternalServerErrorException(
        'The company user limit is configured incorrectly.',
      );
    }

    if (currentUsers >= maximumUsers) {
      throw new ConflictException(
        'This company has reached its maximum number of users.',
      );
    }
  }

  private resolveInvitationTarget(
    principal: AuthenticatedPrincipal,
    dto: InviteUserDto,
  ): {
    accountScope: AccountScope;
    companyId: string | null;
  } {
    if (principal.accountScope === AccountScope.COMPANY) {
      const companyId = this.requireCompanyId(principal);

      if (dto.accountScope !== AccountScope.COMPANY) {
        throw new ForbiddenException(
          'Company administrators cannot create platform accounts.',
        );
      }

      if (dto.companyId !== undefined && dto.companyId !== companyId) {
        throw new ForbiddenException(
          'Users can only be invited within your company.',
        );
      }

      return {
        accountScope: AccountScope.COMPANY,
        companyId,
      };
    }

    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException('Authorization context is invalid.');
    }

    if (dto.accountScope === AccountScope.PLATFORM) {
      if (dto.companyId !== undefined) {
        throw new BadRequestException(
          'Platform users cannot belong to a company.',
        );
      }

      return {
        accountScope: AccountScope.PLATFORM,
        companyId: null,
      };
    }

    if (dto.accountScope === AccountScope.COMPANY) {
      if (!dto.companyId) {
        throw new BadRequestException('Company users require a company id.');
      }

      return {
        accountScope: AccountScope.COMPANY,
        companyId: dto.companyId,
      };
    }

    throw new BadRequestException('Invalid account scope.');
  }

  private async resolveRoles(
    tx: Prisma.TransactionClient,
    roleKeys: string[],
    accountScope: AccountScope,
  ): Promise<
    Array<{
      id: string;
      key: string;
      scope: RoleScope;
    }>
  > {
    const uniqueKeys = [...new Set(roleKeys)];

    if (uniqueKeys.length === 0 || uniqueKeys.length !== roleKeys.length) {
      throw new BadRequestException('At least one unique role is required.');
    }

    const roles = await tx.role.findMany({
      where: {
        key: {
          in: uniqueKeys,
        },
      },
      select: {
        id: true,
        key: true,
        scope: true,
      },
    });

    if (roles.length !== uniqueKeys.length) {
      throw new BadRequestException('One or more selected roles do not exist.');
    }

    const expectedScope =
      accountScope === AccountScope.PLATFORM
        ? RoleScope.PLATFORM
        : RoleScope.COMPANY;

    if (roles.some((role) => role.scope !== expectedScope)) {
      throw new ForbiddenException(
        'One or more selected roles are outside the permitted account scope.',
      );
    }

    return roles;
  }

  private async assertNotLastActiveAdmin(
    tx: Prisma.TransactionClient,
    user: UserRecord,
  ): Promise<void> {
    if (user.status !== UserStatus.ACTIVE) {
      return;
    }

    const adminRoleKey = this.adminRoleKey(user.accountScope);

    const hasAdminRole = user.userRoles.some(
      ({ role }) => role.key === adminRoleKey,
    );

    if (!hasAdminRole) {
      return;
    }

    let scopeWhere: Prisma.UserWhereInput;

    if (user.accountScope === AccountScope.PLATFORM) {
      if (user.companyId !== null) {
        throw new ForbiddenException('Authorization context is invalid.');
      }

      scopeWhere = {
        accountScope: AccountScope.PLATFORM,
        companyId: null,
      };
    } else {
      if (!user.companyId) {
        throw new ForbiddenException('Authorization context is invalid.');
      }

      scopeWhere = {
        accountScope: AccountScope.COMPANY,
        companyId: user.companyId,
      };
    }

    const otherActiveAdmins = await tx.user.count({
      where: {
        ...scopeWhere,
        id: {
          not: user.id,
        },
        status: UserStatus.ACTIVE,
        userRoles: {
          some: {
            role: {
              key: adminRoleKey,
            },
          },
        },
      },
    });

    if (otherActiveAdmins === 0) {
      throw new BadRequestException(
        'The final active administrator cannot be suspended or have its administrative role removed.',
      );
    }
  }

  private scopedUserWhere(
    principal: AuthenticatedPrincipal,
    userId: string,
  ): Prisma.UserWhereInput {
    if (
      principal.accountScope === AccountScope.PLATFORM &&
      principal.companyId === null
    ) {
      return {
        id: userId,
      };
    }

    if (principal.accountScope === AccountScope.COMPANY) {
      return {
        id: userId,
        companyId: this.requireCompanyId(principal),
      };
    }

    throw new ForbiddenException('Authorization context is invalid.');
  }

  private requireCompanyId(principal: AuthenticatedPrincipal): string {
    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException('Valid company scope is required.');
    }

    return principal.companyId;
  }

  private adminRoleKey(accountScope: AccountScope): string {
    return accountScope === AccountScope.PLATFORM
      ? 'platform_admin'
      : 'company_admin';
  }

  private toResponse(user: UserRecord): UserResponse {
    return {
      id: user.id,
      email: user.email,
      accountScope: user.accountScope,
      companyId: user.companyId,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map(({ role }) => role.key).sort(),
    };
  }

  private notFound(): NotFoundException {
    return new NotFoundException('User not found.');
  }
}
