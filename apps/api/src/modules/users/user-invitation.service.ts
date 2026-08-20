import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';

import {
  AccountScope,
  AuthTokenType,
  CompanyStatus,
  RoleScope,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PasswordService } from '../auth/password.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import type { AcceptInvitationDto } from './dto/accept-invitation.dto';

export interface CreatedInvitationToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class UserInvitationService {
  private readonly invitationTtlSeconds: number;
  private readonly passwordMinLength: number;
  private readonly passwordMaxLength: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService,
    configService: ConfigService,
  ) {
    this.invitationTtlSeconds = configService.getOrThrow<number>(
      'AUTH_INVITATION_TTL_SECONDS',
    );

    this.passwordMinLength = configService.getOrThrow<number>(
      'AUTH_PASSWORD_MIN_LENGTH',
    );

    this.passwordMaxLength = configService.getOrThrow<number>(
      'AUTH_PASSWORD_MAX_LENGTH',
    );
  }

  createToken(): CreatedInvitationToken {
    const token = randomBytes(32).toString('base64url');

    return {
      token,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + this.invitationTtlSeconds * 1000),
    };
  }

  async accept(dto: AcceptInvitationDto): Promise<{
    user: {
      id: string;
      email: string;
      status: UserStatus;
      emailVerifiedAt: Date | null;
    };
  }> {
    this.validatePassword(dto.password);

    const tokenHash = this.hashToken(dto.token);
    const now = new Date();

    const invitation = await this.prisma.authToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        type: true,
        expiresAt: true,
        usedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            accountScope: true,
            companyId: true,
            company: {
              select: {
                status: true,
              },
            },
            userRoles: {
              select: {
                role: {
                  select: {
                    scope: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!this.isValidInvitation(invitation, now)) {
      throw this.invalidInvitation();
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const consumeResult = await tx.authToken.updateMany({
        where: {
          id: invitation.id,
          type: AuthTokenType.INVITATION,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      if (consumeResult.count !== 1) {
        throw this.invalidInvitation();
      }

      const activateResult = await tx.user.updateMany({
        where: {
          id: invitation.user.id,
          status: UserStatus.INVITED,
        },
        data: {
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: now,
        },
      });

      if (activateResult.count !== 1) {
        throw this.invalidInvitation();
      }

      /*
       * Invalidate any other outstanding invitation tokens for this user.
       * This prevents an older invitation from being reused after activation.
       */
      await tx.authToken.updateMany({
        where: {
          userId: invitation.user.id,
          type: AuthTokenType.INVITATION,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });

      await this.auditService.write(
        {
          actorUserId: invitation.user.id,
          companyId: invitation.user.companyId,
          action: AUDIT_ACTIONS.AUTH_INVITATION_ACCEPTED,
          targetType: 'user',
          targetId: invitation.user.id,
        },
        tx,
      );

      const user = await tx.user.findUniqueOrThrow({
        where: {
          id: invitation.user.id,
        },
        select: {
          id: true,
          email: true,
          status: true,
          emailVerifiedAt: true,
        },
      });

      return {
        user,
      };
    });
  }

  private isValidInvitation(
    invitation: {
      id: string;
      type: AuthTokenType;
      expiresAt: Date;
      usedAt: Date | null;
      user: {
        id: string;
        email: string;
        status: UserStatus;
        accountScope: AccountScope;
        companyId: string | null;
        company: {
          status: CompanyStatus;
        } | null;
        userRoles: Array<{
          role: {
            scope: RoleScope;
          };
        }>;
      };
    } | null,
    now: Date,
  ): invitation is NonNullable<typeof invitation> {
    if (
      !invitation ||
      invitation.type !== AuthTokenType.INVITATION ||
      invitation.usedAt !== null ||
      invitation.expiresAt.getTime() <= now.getTime() ||
      invitation.user.status !== UserStatus.INVITED ||
      invitation.user.userRoles.length === 0
    ) {
      return false;
    }

    if (invitation.user.accountScope === AccountScope.PLATFORM) {
      return (
        invitation.user.companyId === null &&
        invitation.user.userRoles.every(
          ({ role }) => role.scope === RoleScope.PLATFORM,
        )
      );
    }

    if (invitation.user.accountScope === AccountScope.COMPANY) {
      return (
        invitation.user.companyId !== null &&
        invitation.user.company?.status === CompanyStatus.ACTIVE &&
        invitation.user.userRoles.every(
          ({ role }) => role.scope === RoleScope.COMPANY,
        )
      );
    }

    return false;
  }

  private validatePassword(password: string): void {
    if (password.length < this.passwordMinLength) {
      throw new BadRequestException(
        `Password must contain at least ${this.passwordMinLength} characters.`,
      );
    }

    if (password.length > this.passwordMaxLength) {
      throw new BadRequestException(
        `Password must contain no more than ${this.passwordMaxLength} characters.`,
      );
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private invalidInvitation(): BadRequestException {
    return new BadRequestException('Invitation is invalid or has expired.');
  }
}
