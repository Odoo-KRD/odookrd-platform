import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';

import {
  AccountScope,
  RoleScope,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PasswordService } from './password.service';

const PLATFORM_ADMIN_ROLE_KEY = 'platform_admin';

export interface PlatformAdminBootstrapResult {
  id: string;
  email: string;
}

@Injectable()
export class PlatformAdminBootstrapService {
  private readonly passwordMinLength: number;
  private readonly passwordMaxLength: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    configService: ConfigService,
  ) {
    this.passwordMinLength = configService.getOrThrow<number>(
      'AUTH_PASSWORD_MIN_LENGTH',
    );

    this.passwordMaxLength = configService.getOrThrow<number>(
      'AUTH_PASSWORD_MAX_LENGTH',
    );
  }

  async createFirstPlatformAdmin(
    email: string,
    password: string,
  ): Promise<PlatformAdminBootstrapResult> {
    const normalizedInputEmail = email.trim();

    this.validateEmail(normalizedInputEmail);
    this.validatePassword(password);

    const normalizedEmail = normalizedInputEmail.toLowerCase();
    const passwordHash = await this.passwordService.hashPassword(password);

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: {
          key: PLATFORM_ADMIN_ROLE_KEY,
        },
        select: {
          id: true,
          scope: true,
        },
      });

      if (!role) {
        throw new Error(
          'The platform_admin role does not exist. Run the RBAC seed first.',
        );
      }

      if (role.scope !== RoleScope.PLATFORM) {
        throw new Error(
          'The platform_admin role is not configured with PLATFORM scope.',
        );
      }

      const existingPlatformAdmin = await tx.userRole.findFirst({
        where: {
          roleId: role.id,
          user: {
            accountScope: AccountScope.PLATFORM,
          },
        },
        select: {
          userId: true,
        },
      });

      if (existingPlatformAdmin) {
        throw new Error(
          'A platform administrator already exists. Bootstrap is only for the first platform administrator.',
        );
      }

      const existingUser = await tx.user.findUnique({
        where: {
          normalizedEmail,
        },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        throw new Error('A user with this email address already exists.');
      }

      const user = await tx.user.create({
        data: {
          accountScope: AccountScope.PLATFORM,
          companyId: null,
          email: normalizedInputEmail,
          normalizedEmail,
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
          userRoles: {
            create: {
              roleId: role.id,
            },
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      return {
        id: user.id,
        email: user.email,
      };
    });
  }

  private validateEmail(email: string): void {
    if (!email || email.length > 320 || !isEmail(email)) {
      throw new Error('A valid email address is required.');
    }
  }

  private validatePassword(password: string): void {
    if (password.length < this.passwordMinLength) {
      throw new Error(
        `Password must contain at least ${this.passwordMinLength} characters.`,
      );
    }

    if (password.length > this.passwordMaxLength) {
      throw new Error(
        `Password must contain no more than ${this.passwordMaxLength} characters.`,
      );
    }
  }
}
