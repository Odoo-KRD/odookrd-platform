import { Injectable, UnauthorizedException } from '@nestjs/common';

import {
  AccountScope,
  CompanyStatus,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from './interfaces/authenticated-principal.interface';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

export interface AuthenticationResult {
  token: string;
  session: {
    id: string;
    idleExpiresAt: Date;
    absoluteExpiresAt: Date;
  };
  user: {
    id: string;
    email: string;
    accountScope: AccountScope;
    companyId: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  async authenticate(
    email: string,
    password: string,
  ): Promise<AuthenticationResult> {
    const normalizedEmail = this.normalizeEmail(email);

    const user = await this.prisma.user.findUnique({
      where: {
        normalizedEmail,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        status: true,
        accountScope: true,
        companyId: true,
        company: {
          select: {
            status: true,
          },
        },
      },
    });

    /*
     * Always perform an Argon2 verification.
     *
     * If the account does not exist or does not have a password hash,
     * PasswordService uses a dummy Argon2 hash. This reduces the timing
     * difference between an unknown account and a known account with an
     * incorrect password.
     */
    const passwordValid = await this.passwordService.verifyPasswordOrDummy(
      user?.passwordHash ?? null,
      password,
    );

    const userActive = user?.status === UserStatus.ACTIVE;

    const accountContextValid = user
      ? this.hasValidAccountContext(user)
      : false;

    if (
      !user ||
      !userActive ||
      !user.passwordHash ||
      !accountContextValid ||
      !passwordValid
    ) {
      throw this.invalidCredentials();
    }

    const session = await this.sessionService.createSession(user.id);

    return {
      token: session.token,
      session: {
        id: session.sessionId,
        idleExpiresAt: session.idleExpiresAt,
        absoluteExpiresAt: session.absoluteExpiresAt,
      },
      user: {
        id: user.id,
        email: user.email,
        accountScope: user.accountScope,
        companyId: user.companyId,
      },
    };
  }

  async authenticateSession(token: string): Promise<AuthenticatedPrincipal> {
    const session = await this.sessionService.validateSession(token);

    if (!session) {
      throw this.authenticationRequired();
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: session.userId,
      },
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
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw this.authenticationRequired();
    }

    if (!this.hasValidAccountContext(user)) {
      throw this.authenticationRequired();
    }

    return {
      sessionId: session.id,
      userId: user.id,
      email: user.email,
      accountScope: user.accountScope,
      companyId: user.companyId,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.revokeSessionById(sessionId);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionService.revokeAllUserSessions(userId);
  }

  private hasValidAccountContext(user: {
    accountScope: AccountScope;
    companyId: string | null;
    company: {
      status: CompanyStatus;
    } | null;
  }): boolean {
    if (user.accountScope === AccountScope.PLATFORM) {
      return user.companyId === null;
    }

    if (user.accountScope === AccountScope.COMPANY) {
      return (
        user.companyId !== null &&
        user.company !== null &&
        user.company.status === CompanyStatus.ACTIVE
      );
    }

    return false;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException('Invalid email or password.');
  }

  private authenticationRequired(): UnauthorizedException {
    return new UnauthorizedException('Authentication required.');
  }
}
