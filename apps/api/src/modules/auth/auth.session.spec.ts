import { UnauthorizedException } from '@nestjs/common';

import {
  AccountScope,
  CompanyStatus,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService, ValidatedSession } from './session.service';

interface SessionUserRecord {
  id: string;
  email: string;
  status: UserStatus;
  accountScope: AccountScope;
  companyId: string | null;
  company: {
    status: CompanyStatus;
  } | null;
}

interface UserFindUniqueArgs {
  where: {
    id: string;
  };
}

describe('AuthService session authentication', () => {
  let service: AuthService;

  let sessionResult: ValidatedSession | null;
  let userResult: SessionUserRecord | null;

  let capturedToken: string | undefined;
  let capturedUserId: string | undefined;
  let capturedRevokedSessionId: string | undefined;
  let capturedRevokedUserId: string | undefined;

  const prisma = {
    user: {
      findUnique(args: UserFindUniqueArgs): Promise<SessionUserRecord | null> {
        capturedUserId = args.where.id;

        return Promise.resolve(userResult);
      },
    },
  } as unknown as PrismaService;

  const passwordService = {} as PasswordService;

  const sessionService = {
    validateSession(token: string): Promise<ValidatedSession | null> {
      capturedToken = token;

      return Promise.resolve(sessionResult);
    },

    revokeSessionById(sessionId: string): Promise<boolean> {
      capturedRevokedSessionId = sessionId;

      return Promise.resolve(true);
    },

    revokeAllUserSessions(userId: string): Promise<number> {
      capturedRevokedUserId = userId;

      return Promise.resolve(2);
    },
  } as unknown as SessionService;

  beforeEach(() => {
    capturedToken = undefined;
    capturedUserId = undefined;
    capturedRevokedSessionId = undefined;
    capturedRevokedUserId = undefined;

    sessionResult = {
      id: 'session-id',
      userId: 'user-id',
      lastSeenAt: new Date(),
      idleExpiresAt: new Date(Date.now() + 60_000),
      absoluteExpiresAt: new Date(Date.now() + 3_600_000),
    };

    userResult = {
      id: 'user-id',
      email: 'user@example.com',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.PLATFORM,
      companyId: null,
      company: null,
    };

    service = new AuthService(prisma, passwordService, sessionService);
  });

  it('authenticates a valid platform session', async () => {
    const result = await service.authenticateSession('session-token');

    expect(capturedToken).toBe('session-token');
    expect(capturedUserId).toBe('user-id');

    expect(result).toEqual({
      sessionId: 'session-id',
      userId: 'user-id',
      email: 'user@example.com',
      accountScope: AccountScope.PLATFORM,
      companyId: null,
    });
  });

  it('authenticates a valid company session', async () => {
    userResult = {
      id: 'company-user-id',
      email: 'company@example.com',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.COMPANY,
      companyId: 'company-id',
      company: {
        status: CompanyStatus.ACTIVE,
      },
    };

    if (!sessionResult) {
      throw new Error('Expected session fixture');
    }

    sessionResult.userId = 'company-user-id';

    const result = await service.authenticateSession('session-token');

    expect(result.companyId).toBe('company-id');
    expect(result.accountScope).toBe(AccountScope.COMPANY);
  });

  it('rejects an invalid or expired session', async () => {
    sessionResult = null;

    await expect(service.authenticateSession('invalid-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a session whose user no longer exists', async () => {
    userResult = null;

    await expect(service.authenticateSession('session-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a suspended user after session creation', async () => {
    if (!userResult) {
      throw new Error('Expected user fixture');
    }

    userResult.status = UserStatus.SUSPENDED;

    await expect(service.authenticateSession('session-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a company session when the company is suspended', async () => {
    userResult = {
      id: 'company-user-id',
      email: 'company@example.com',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.COMPANY,
      companyId: 'company-id',
      company: {
        status: CompanyStatus.SUSPENDED,
      },
    };

    await expect(service.authenticateSession('session-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a company session when the company is archived', async () => {
    userResult = {
      id: 'company-user-id',
      email: 'company@example.com',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.COMPANY,
      companyId: 'company-id',
      company: {
        status: CompanyStatus.ARCHIVED,
      },
    };

    await expect(service.authenticateSession('session-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('revokes the current session on logout', async () => {
    await service.logout('session-id');

    expect(capturedRevokedSessionId).toBe('session-id');
  });

  it('revokes every user session on logout-all', async () => {
    await service.logoutAll('user-id');

    expect(capturedRevokedUserId).toBe('user-id');
  });

  it('uses a generic authentication-required error', async () => {
    sessionResult = null;

    await expect(
      service.authenticateSession('invalid-token'),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Authentication required.',
    });
  });
});
