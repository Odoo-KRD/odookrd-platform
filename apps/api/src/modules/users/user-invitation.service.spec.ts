import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AccountScope,
  AuthTokenType,
  CompanyStatus,
  RoleScope,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PasswordService } from '../auth/password.service';
import { AuditService } from '../audit/audit.service';
import { UserInvitationService } from './user-invitation.service';

describe('UserInvitationService security', () => {
  let service: UserInvitationService;

  let invitationResult: unknown;
  let passwordHashCalls: number;
  let tokenConsumeCount: number;
  let userActivationCalls: number;
  let authTokenUpdateCalls: number;

  const passwordService = {
    hashPassword(): Promise<string> {
      passwordHashCalls += 1;
      return Promise.resolve('argon2-password-hash');
    },
  } as unknown as PasswordService;

  const auditService = {
    write(): Promise<void> {
      return Promise.resolve();
    },
  } as unknown as AuditService;

  const configValues: Record<string, number> = {
    AUTH_INVITATION_TTL_SECONDS: 86400,
    AUTH_PASSWORD_MIN_LENGTH: 12,
    AUTH_PASSWORD_MAX_LENGTH: 128,
  };

  const configService = {
    getOrThrow(key: string): number {
      const value = configValues[key];

      if (value === undefined) {
        throw new Error(`Unexpected config key: ${key}`);
      }

      return value;
    },
  } as unknown as ConfigService;

  const transactionClient = {
    authToken: {
      updateMany(): Promise<{ count: number }> {
        authTokenUpdateCalls += 1;

        return Promise.resolve({
          count: authTokenUpdateCalls === 1 ? tokenConsumeCount : 1,
        });
      },
    },

    user: {
      updateMany(): Promise<{ count: number }> {
        userActivationCalls += 1;

        return Promise.resolve({
          count: 1,
        });
      },

      findUniqueOrThrow(): Promise<{
        id: string;
        email: string;
        status: UserStatus;
        emailVerifiedAt: Date;
      }> {
        return Promise.resolve({
          id: 'invited-user',
          email: 'invited@example.test',
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        });
      },
    },
  };

  const prisma = {
    authToken: {
      findUnique(): Promise<unknown> {
        return Promise.resolve(invitationResult);
      },
    },

    $transaction<T>(
      callback: (tx: typeof transactionClient) => Promise<T>,
    ): Promise<T> {
      return callback(transactionClient);
    },
  } as unknown as PrismaService;

  function validInvitation() {
    return {
      id: 'invitation-id',
      type: AuthTokenType.INVITATION,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      user: {
        id: 'invited-user',
        email: 'invited@example.test',
        status: UserStatus.INVITED,
        accountScope: AccountScope.COMPANY,
        companyId: 'company-a',
        company: {
          status: CompanyStatus.ACTIVE,
        },
        userRoles: [
          {
            role: {
              scope: RoleScope.COMPANY,
            },
          },
        ],
      },
    };
  }

  beforeEach(() => {
    invitationResult = validInvitation();
    passwordHashCalls = 0;
    tokenConsumeCount = 1;
    userActivationCalls = 0;
    authTokenUpdateCalls = 0;

    service = new UserInvitationService(
      prisma,
      passwordService,
      auditService,
      configService,
    );
  });

  it('rejects an expired invitation', async () => {
    invitationResult = {
      ...validInvitation(),
      expiresAt: new Date(Date.now() - 60_000),
    };

    await expect(
      service.accept({
        displayName: 'Customer User',
        token: 'expired-invitation-token',
        password: 'StrongPassword123!',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(passwordHashCalls).toBe(0);
  });

  it('rejects an already-used invitation', async () => {
    invitationResult = {
      ...validInvitation(),
      usedAt: new Date(),
    };

    await expect(
      service.accept({
        displayName: 'Customer User',
        token: 'already-used-invitation-token',
        password: 'StrongPassword123!',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(passwordHashCalls).toBe(0);
  });

  it('rejects an invitation for a suspended company', async () => {
    const invitation = validInvitation();

    invitationResult = {
      ...invitation,
      user: {
        ...invitation.user,
        company: {
          status: CompanyStatus.SUSPENDED,
        },
      },
    };

    await expect(
      service.accept({
        displayName: 'Customer User',
        token: 'suspended-company-token',
        password: 'StrongPassword123!',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(passwordHashCalls).toBe(0);
  });

  it('fails closed when another request consumes the token first', async () => {
    tokenConsumeCount = 0;

    await expect(
      service.accept({
        displayName: 'Customer User',
        token: 'race-safe-invitation-token',
        password: 'StrongPassword123!',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(passwordHashCalls).toBe(1);
    expect(userActivationCalls).toBe(0);
  });

  it('activates a valid invitation exactly once', async () => {
    const result = await service.accept({
      displayName: 'Customer User',
      token: 'valid-invitation-token',
      password: 'StrongPassword123!',
    });

    expect(passwordHashCalls).toBe(1);
    expect(userActivationCalls).toBe(1);
    expect(authTokenUpdateCalls).toBe(2);

    expect(result.user).toMatchObject({
      id: 'invited-user',
      status: UserStatus.ACTIVE,
    });
  });
  it('invitation activation persists the personal name in the same transaction', async () => {
    let activationInput: unknown = null;
    const updateSpy = jest
      .spyOn(transactionClient.user, 'updateMany')
      .mockImplementation((...args: unknown[]) => {
        activationInput = args[0];
        userActivationCalls += 1;
        return Promise.resolve({ count: 1 });
      });

    try {
      await service.accept({
        token: 'valid-invitation-token',
        password: 'StrongPassword123!',
        displayName: '  Customer   User  ',
      });

      expect(activationInput).toMatchObject({
        data: { displayName: 'Customer User' },
      });
      expect(userActivationCalls).toBe(1);
      expect(authTokenUpdateCalls).toBe(2);
    } finally {
      updateSpy.mockRestore();
    }
  });

  it('rejects an invalid personal name before hashing or consuming a token', async () => {
    for (const displayName of [
      '',
      '   ',
      'A',
      'A'.repeat(161),
      'Name\nOther',
    ]) {
      await expect(
        service.accept({
          token: 'valid-invitation-token',
          password: 'StrongPassword123!',
          displayName,
        }),
      ).rejects.toThrow(BadRequestException);
    }
    expect(passwordHashCalls).toBe(0);
    expect(authTokenUpdateCalls).toBe(0);
  });
});
