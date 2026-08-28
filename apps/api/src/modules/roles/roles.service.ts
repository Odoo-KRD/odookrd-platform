import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AccountScope, Prisma, RoleScope } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';
import type { PermissionResponse } from './interfaces/permission-response.interface';
import type { RoleResponse } from './interfaces/role-response.interface';

const COMPANY_ROLE_PERMISSION_KEYS = new Set([
  'companies.read',
  'companies.manage',
  'users.read',
  'users.manage',
  'roles.read',
  'services.read',
  'notifications.read',
  'notifications.manage',
  'settings.read',
  'settings.manage',
  'training.read',
  'training.assign',
  'training.progress.read',
]);

const ROLE_SELECT = {
  id: true,
  key: true,
  name: true,
  description: true,
  scope: true,
  isSystem: true,
  archivedAt: true,
  rolePermissions: {
    select: {
      permission: {
        select: {
          key: true,
        },
      },
    },
  },
  _count: {
    select: {
      userRoles: true,
    },
  },
} satisfies Prisma.RoleSelect;

type RoleRecord = Prisma.RoleGetPayload<{ select: typeof ROLE_SELECT }>;

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(principal: AuthenticatedPrincipal): Promise<RoleResponse[]> {
    const roles = await this.prisma.role.findMany({
      where:
        principal.accountScope === AccountScope.COMPANY
          ? {
              scope: RoleScope.COMPANY,
              archivedAt: null,
            }
          : undefined,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      select: ROLE_SELECT,
    });

    return roles.map((role) => this.toResponse(role));
  }

  async listPermissions(
    principal: AuthenticatedPrincipal,
  ): Promise<PermissionResponse[]> {
    this.assertPlatformPrincipal(principal);

    const permissions = await this.prisma.permission.findMany({
      orderBy: {
        key: 'asc',
      },
      select: {
        key: true,
        name: true,
        description: true,
      },
    });

    return permissions.map((permission) => ({
      ...permission,
      allowedForCompany: COMPANY_ROLE_PERMISSION_KEYS.has(permission.key),
    }));
  }

  async get(
    principal: AuthenticatedPrincipal,
    roleId: string,
  ): Promise<RoleResponse> {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        ...(principal.accountScope === AccountScope.COMPANY
          ? {
              scope: RoleScope.COMPANY,
            }
          : {}),
      },
      select: ROLE_SELECT,
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    return this.toResponse(role);
  }

  async create(
    principal: AuthenticatedPrincipal,
    dto: CreateRoleDto,
  ): Promise<RoleResponse> {
    this.assertPlatformPrincipal(principal);

    const name = dto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('Role name is too short.');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.role.findUnique({
        where: {
          key: dto.key,
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        throw new ConflictException('A role with this key already exists.');
      }

      const permissions = await this.resolvePermissions(
        tx,
        dto.permissionKeys,
        dto.scope,
      );

      const createdRole = await tx.role.create({
        data: {
          key: dto.key,
          name,
          description: dto.description?.trim() || null,
          scope: dto.scope,
          isSystem: false,
        },
        select: {
          id: true,
        },
      });

      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: createdRole.id,
          permissionId: permission.id,
        })),
      });

      const role = await tx.role.findUniqueOrThrow({
        where: {
          id: createdRole.id,
        },
        select: ROLE_SELECT,
      });

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: null,
          action: AUDIT_ACTIONS.ROLE_CREATED,
          targetType: 'role',
          targetId: role.id,
          metadata: {
            key: role.key,
            scope: role.scope,
            permissionKeys: permissions.map((permission) => permission.key),
          },
        },
        tx,
      );

      return this.toResponse(role);
    });
  }

  async update(
    principal: AuthenticatedPrincipal,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<RoleResponse> {
    this.assertPlatformPrincipal(principal);

    const name = dto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('Role name is too short.');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.role.findUnique({
        where: {
          id: roleId,
        },
        select: ROLE_SELECT,
      });

      if (!existing) {
        throw new NotFoundException('Role not found.');
      }

      if (existing.isSystem) {
        throw new ForbiddenException('System roles cannot be edited.');
      }

      if (existing.archivedAt) {
        throw new ConflictException(
          'Restore the archived role before editing it.',
        );
      }

      const permissions = await this.resolvePermissions(
        tx,
        dto.permissionKeys,
        existing.scope,
      );

      await tx.role.update({
        where: {
          id: existing.id,
        },
        data: {
          name,
          description: dto.description?.trim() || null,
        },
      });

      await tx.rolePermission.deleteMany({
        where: {
          roleId: existing.id,
        },
      });

      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: existing.id,
          permissionId: permission.id,
        })),
      });

      const updated = await tx.role.findUniqueOrThrow({
        where: {
          id: existing.id,
        },
        select: ROLE_SELECT,
      });

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: null,
          action: AUDIT_ACTIONS.ROLE_UPDATED,
          targetType: 'role',
          targetId: existing.id,
          metadata: {
            key: existing.key,
            scope: existing.scope,
            previousPermissionKeys: existing.rolePermissions
              .map(({ permission }) => permission.key)
              .sort(),
            permissionKeys: permissions
              .map((permission) => permission.key)
              .sort(),
          },
        },
        tx,
      );

      return this.toResponse(updated);
    });
  }

  async archive(
    principal: AuthenticatedPrincipal,
    roleId: string,
  ): Promise<RoleResponse> {
    this.assertPlatformPrincipal(principal);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.role.findUnique({
        where: { id: roleId },
        select: ROLE_SELECT,
      });

      if (!existing) {
        throw new NotFoundException('Role not found.');
      }

      if (existing.isSystem) {
        throw new ForbiddenException('System roles cannot be archived.');
      }

      if (existing._count.userRoles > 0) {
        throw new ConflictException(
          'This role is assigned to users and cannot be archived.',
        );
      }

      if (existing.archivedAt) {
        return this.toResponse(existing);
      }

      const updated = await tx.role.update({
        where: { id: roleId },
        data: { archivedAt: new Date() },
        select: ROLE_SELECT,
      });

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: null,
          action: AUDIT_ACTIONS.ROLE_ARCHIVED,
          targetType: 'role',
          targetId: updated.id,
          metadata: { key: updated.key, scope: updated.scope },
        },
        tx,
      );

      return this.toResponse(updated);
    });
  }

  async restore(
    principal: AuthenticatedPrincipal,
    roleId: string,
  ): Promise<RoleResponse> {
    this.assertPlatformPrincipal(principal);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.role.findUnique({
        where: { id: roleId },
        select: ROLE_SELECT,
      });

      if (!existing) {
        throw new NotFoundException('Role not found.');
      }

      if (existing.isSystem) {
        throw new ForbiddenException(
          'System roles do not have an archive lifecycle.',
        );
      }

      if (!existing.archivedAt) {
        return this.toResponse(existing);
      }

      const updated = await tx.role.update({
        where: { id: roleId },
        data: { archivedAt: null },
        select: ROLE_SELECT,
      });

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: null,
          action: AUDIT_ACTIONS.ROLE_RESTORED,
          targetType: 'role',
          targetId: updated.id,
          metadata: { key: updated.key, scope: updated.scope },
        },
        tx,
      );

      return this.toResponse(updated);
    });
  }

  async remove(
    principal: AuthenticatedPrincipal,
    roleId: string,
  ): Promise<{ success: true }> {
    this.assertPlatformPrincipal(principal);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.role.findUnique({
        where: {
          id: roleId,
        },
        select: ROLE_SELECT,
      });

      if (!existing) {
        throw new NotFoundException('Role not found.');
      }

      if (existing.isSystem) {
        throw new ForbiddenException('System roles cannot be deleted.');
      }

      if (existing._count.userRoles > 0) {
        throw new ConflictException(
          'This role is assigned to users and cannot be deleted.',
        );
      }

      if (!existing.archivedAt) {
        throw new ConflictException('Archive the role before deleting it.');
      }

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: null,
          action: AUDIT_ACTIONS.ROLE_DELETED,
          targetType: 'role',
          targetId: existing.id,
          metadata: {
            key: existing.key,
            scope: existing.scope,
          },
        },
        tx,
      );

      await tx.role.delete({
        where: {
          id: existing.id,
        },
      });
    });

    return { success: true };
  }

  private async resolvePermissions(
    tx: Prisma.TransactionClient,
    permissionKeys: string[],
    scope: RoleScope,
  ): Promise<Array<{ id: string; key: string }>> {
    const uniqueKeys = [...new Set(permissionKeys)];

    if (
      uniqueKeys.length === 0 ||
      uniqueKeys.length !== permissionKeys.length
    ) {
      throw new BadRequestException(
        'At least one unique permission is required.',
      );
    }

    const permissions = await tx.permission.findMany({
      where: {
        key: {
          in: uniqueKeys,
        },
      },
      select: {
        id: true,
        key: true,
      },
    });

    if (permissions.length !== uniqueKeys.length) {
      throw new BadRequestException(
        'One or more selected permissions do not exist.',
      );
    }

    if (
      scope === RoleScope.COMPANY &&
      permissions.some(
        (permission) => !COMPANY_ROLE_PERMISSION_KEYS.has(permission.key),
      )
    ) {
      throw new ForbiddenException(
        'One or more permissions are not available to company roles.',
      );
    }

    return permissions.sort((left, right) => left.key.localeCompare(right.key));
  }

  private assertPlatformPrincipal(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException(
        'Only platform administrators can manage role definitions.',
      );
    }
  }

  private toResponse(role: RoleRecord): RoleResponse {
    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      scope: role.scope,
      isSystem: role.isSystem,
      archivedAt: role.archivedAt,
      assignmentCount: role._count.userRoles,
      permissions: role.rolePermissions
        .map(({ permission }) => permission.key)
        .sort(),
    };
  }
}
