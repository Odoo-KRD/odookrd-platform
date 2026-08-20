import { UnauthorizedException } from '@nestjs/common';

import {
  AccountScope,
  CompanyStatus,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { CreatedSession, SessionService } from './session.service';

interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string | null;
  status: UserStatus;
  accountScope: AccountScope;
  companyId: string | null;
  company: {
    status: CompanyStatus;
  } | null;
}

interface UserFindUniqueArgs {
  where: {
    normalizedEmail: string;
  };
  select: {
    id: true;
    email: true;
    passwordHash: true;
    status: true;
    accountScope: true;
    companyId: true;
    company: {
      select: {
        status: true;
      };
    };
  };
}

describe('AuthService', () => {
  let service: AuthService;

  let findUniqueResult: AuthUserRecord | null;
  let capturedFindUniqueArgs: UserFindUniqueArgs | undefined;

  let passwordVerificationResult: boolean;
  let capturedPasswordHash: string | null | undefined;
  let capturedPassword: string | undefined;

  let capturedSessionUserId: string | undefined;
  let sessionCreateCount: number;

  const createdSession: CreatedSession = {
    token: 'raw-session-token',
    sessionId: 'session-id',
    idleExpiresAt: new Date('2026-08-20T12:30:00.000Z'),
    absoluteExpiresAt: new Date('2026-08-21T12:00:00.000Z'),
  };

  const prisma = {
    user: {
      findUnique(args: UserFindUniqueArgs): Promise<AuthUserRecord | null> {
        capturedFindUniqueArgs = args;

        return Promise.resolve(findUniqueResult);
      },
    },
  } as unknown as PrismaService;

  const passwordService = {
    verifyPasswordOrDummy(
      passwordHash: string | null,
      password: string,
    ): Promise<boolean> {
      capturedPasswordHash = passwordHash;
      capturedPassword = password;

      return Promise.resolve(passwordVerificationResult);
    },
  } as unknown as PasswordService;

  const sessionService = {
    createSession(userId: string): Promise<CreatedSession> {
      capturedSessionUserId = userId;
      sessionCreateCount += 1;

      return Promise.resolve(createdSession);
    },
  } as unknown as SessionService;

  beforeEach(() => {
    capturedFindUniqueArgs = undefined;
    capturedPasswordHash = undefined;
    capturedPassword = undefined;
    capturedSessionUserId = undefined;

    passwordVerificationResult = true;
    sessionCreateCount = 0;

    findUniqueResult = {
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'stored-password-hash',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.PLATFORM,
      companyId: null,
      company: null,
    };

    service = new AuthService(prisma, passwordService, sessionService);
  });

  it('normalizes the email before looking up the user', async () => {
    await service.authenticate('  User@Example.COM  ', 'correct-password');

    expect(capturedFindUniqueArgs).toBeDefined();

    if (!capturedFindUniqueArgs) {
      throw new Error('Expected user lookup arguments');
    }

    expect(capturedFindUniqueArgs.where.normalizedEmail).toBe(
      'user@example.com',
    );
  });

  it('authenticates an active platform user', async () => {
    const result = await service.authenticate(
      'user@example.com',
      'correct-password',
    );

    expect(capturedPasswordHash).toBe('stored-password-hash');
    expect(capturedPassword).toBe('correct-password');
    expect(capturedSessionUserId).toBe('user-id');
    expect(sessionCreateCount).toBe(1);

    expect(result).toEqual({
      token: createdSession.token,
      session: {
        id: createdSession.sessionId,
        idleExpiresAt: createdSession.idleExpiresAt,
        absoluteExpiresAt: createdSession.absoluteExpiresAt,
      },
      user: {
        id: 'user-id',
        email: 'user@example.com',
        accountScope: AccountScope.PLATFORM,
        companyId: null,
      },
    });
  });

  it('authenticates an active company user belonging to an active company', async () => {
    findUniqueResult = {
      id: 'company-user-id',
      email: 'company@example.com',
      passwordHash: 'company-password-hash',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.COMPANY,
      companyId: 'company-id',
      company: {
        status: CompanyStatus.ACTIVE,
      },
    };

    const result = await service.authenticate(
      'company@example.com',
      'correct-password',
    );

    expect(capturedPasswordHash).toBe('company-password-hash');
    expect(capturedSessionUserId).toBe('company-user-id');
    expect(sessionCreateCount).toBe(1);

    expect(result.user).toEqual({
      id: 'company-user-id',
      email: 'company@example.com',
      accountScope: AccountScope.COMPANY,
      companyId: 'company-id',
    });
  });

  it('rejects an unknown email while still performing dummy password verification', async () => {
    findUniqueResult = null;

    await expect(
      service.authenticate('unknown@example.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(capturedPasswordHash).toBeNull();
    expect(capturedPassword).toBe('password');
    expect(sessionCreateCount).toBe(0);
  });

  it('rejects an invited user', async () => {
    if (!findUniqueResult) {
      throw new Error('Expected default user fixture');
    }

    findUniqueResult.status = UserStatus.INVITED;

    await expect(
      service.authenticate('user@example.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(capturedPasswordHash).toBe('stored-password-hash');
    expect(sessionCreateCount).toBe(0);
  });

  it('rejects a suspended user', async () => {
    if (!findUniqueResult) {
      throw new Error('Expected default user fixture');
    }

    findUniqueResult.status = UserStatus.SUSPENDED;

    await expect(
      service.authenticate('user@example.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(capturedPasswordHash).toBe('stored-password-hash');
    expect(sessionCreateCount).toBe(0);
  });

  it('rejects a user without a password hash while still performing dummy verification', async () => {
    if (!findUniqueResult) {
      throw new Error('Expected default user fixture');
    }

    findUniqueResult.passwordHash = null;

    await expect(
      service.authenticate('user@example.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(capturedPasswordHash).toBeNull();
    expect(capturedPassword).toBe('password');
    expect(sessionCreateCount).toBe(0);
  });

  it('rejects an invalid password', async () => {
    passwordVerificationResult = false;

    await expect(
      service.authenticate('user@example.com', 'wrong-password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(capturedPasswordHash).toBe('stored-password-hash');
    expect(capturedPassword).toBe('wrong-password');
    expect(sessionCreateCount).toBe(0);
  });

  it('rejects a company user without a company id', async () => {
    findUniqueResult = {
      id: 'company-user-id',
      email: 'company@example.com',
      passwordHash: 'company-password-hash',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.COMPANY,
      companyId: null,
      company: null,
    };

    await expect(
      service.authenticate('company@example.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(capturedPasswordHash).toBe('company-password-hash');
    expect(sessionCreateCount).toBe(0);
  });

  it('rejects a company user without a company record', async () => {
    findUniqueResult = {
      id: 'company-user-id',
      email: 'company@example.com',
      passwordHash: 'company-password-hash',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.COMPANY,
      companyId: 'company-id',
      company: null,
    };

    await expect(
      service.authenticate('company@example.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(capturedPasswordHash).toBe('company-password-hash');
    expect(sessionCreateCount).toBe(0);
  });

  it('rejects a company user belonging to a suspended company', async () => {
    findUniqueResult = {
      id: 'company-user-id',
      email: 'company@example.com',
      passwordHash: 'company-password-hash',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.COMPANY,
      companyId: 'company-id',
      company: {
        status: CompanyStatus.SUSPENDED,
      },
    };

    await expect(
      service.authenticate('company@example.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(capturedPasswordHash).toBe('company-password-hash');
    expect(sessionCreateCount).toBe(0);
  });

  it('rejects a company user belonging to an archived company', async () => {
    findUniqueResult = {
      id: 'company-user-id',
      email: 'company@example.com',
      passwordHash: 'company-password-hash',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.COMPANY,
      companyId: 'company-id',
      company: {
        status: CompanyStatus.ARCHIVED,
      },
    };

    await expect(
      service.authenticate('company@example.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(capturedPasswordHash).toBe('company-password-hash');
    expect(sessionCreateCount).toBe(0);
  });

  it('rejects an invalid platform account carrying a company id', async () => {
    findUniqueResult = {
      id: 'platform-user-id',
      email: 'platform@example.com',
      passwordHash: 'platform-password-hash',
      status: UserStatus.ACTIVE,
      accountScope: AccountScope.PLATFORM,
      companyId: 'unexpected-company-id',
      company: {
        status: CompanyStatus.ACTIVE,
      },
    };

    await expect(
      service.authenticate('platform@example.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(capturedPasswordHash).toBe('platform-password-hash');
    expect(sessionCreateCount).toBe(0);
  });

  it('uses the same public authentication error for invalid credentials', async () => {
    passwordVerificationResult = false;

    await expect(
      service.authenticate('user@example.com', 'wrong-password'),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password.',
    });
  });
});
