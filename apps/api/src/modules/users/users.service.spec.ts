import { BadRequestException, ForbiddenException } from '@nestjs/common';

import {
  AccountScope,
  CompanyStatus,
  RoleScope,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AuditService } from '../audit/audit.service';
import { UserInvitationService } from './user-invitation.service';
import { UsersService } from './users.service';

describe('UsersService security', () => {
  let service: UsersService;

  let capturedRootUserWhere: unknown;
  let transactionUserResult: unknown;
  let transactionRoles: Array<{
    id: string;
    key: string;
    scope: RoleScope;
  }>;
  let otherActiveAdminCount: number;
  let updateCalls: number;

  const companyPrincipal: AuthenticatedPrincipal = {
    sessionId: 'company-session',
    userId: 'company-admin-2',
    email: 'admin2@company-a.test',
    accountScope: AccountScope.COMPANY,
    companyId: 'company-a',
  };

  const rootUser = {
    findFirst(args: { where: unknown }): Promise<null> {
      capturedRootUserWhere = args.where;
      return Promise.resolve(null);
    },
  };

  const transactionClient = {
    user: {
      findFirst(): Promise<unknown> {
        return Promise.resolve(transactionUserResult);
      },

      count(): Promise<number> {
        return Promise.resolve(otherActiveAdminCount);
      },

      update(): Promise<never> {
        updateCalls += 1;
        return Promise.reject(
          new Error('Unexpected user update in security test.'),
        );
      },

      findUniqueOrThrow(): Promise<never> {
        return Promise.reject(
          new Error('Unexpected user lookup in security test.'),
        );
      },
    },

    role: {
      findMany(): Promise<
        Array<{
          id: string;
          key: string;
          scope: RoleScope;
        }>
      > {
        return Promise.resolve(transactionRoles);
      },
    },

    userRole: {
      deleteMany(): Promise<{ count: number }> {
        return Promise.resolve({
          count: 0,
        });
      },

      createMany(): Promise<{ count: number }> {
        return Promise.resolve({
          count: 0,
        });
      },
    },

    session: {
      updateMany(): Promise<{ count: number }> {
        return Promise.resolve({
          count: 0,
        });
      },
    },
  };

  const prisma = {
    user: rootUser,

    $transaction<T>(
      callback: (tx: typeof transactionClient) => Promise<T>,
    ): Promise<T> {
      return callback(transactionClient);
    },
  } as unknown as PrismaService;

  const auditService = {} as AuditService;

  const invitationService = {
    createToken() {
      return {
        token: 'token',
        tokenHash: 'hash',
        expiresAt: new Date(),
      };
    },
  } as unknown as UserInvitationService;

  beforeEach(() => {
    capturedRootUserWhere = undefined;
    transactionUserResult = null;
    transactionRoles = [];
    otherActiveAdminCount = 1;
    updateCalls = 0;

    service = new UsersService(prisma, auditService, invitationService);
  });

  it('adds company scope directly to company-user lookups', async () => {
    await expect(
      service.getById(companyPrincipal, 'foreign-user'),
    ).rejects.toMatchObject({
      status: 404,
    });

    expect(capturedRootUserWhere).toEqual({
      id: 'foreign-user',
      companyId: 'company-a',
    });
  });

  it('prevents company administrators from inviting platform accounts', async () => {
    await expect(
      service.invite(companyPrincipal, {
        email: 'platform@example.test',
        accountScope: AccountScope.PLATFORM,
        roleKeys: ['platform_admin'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects assigning a platform role to a company user', async () => {
    transactionUserResult = {
      id: 'company-user',
      email: 'user@company-a.test',
      accountScope: AccountScope.COMPANY,
      companyId: 'company-a',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userRoles: [
        {
          role: {
            key: 'company_user',
          },
        },
      ],
    };

    transactionRoles = [
      {
        id: 'platform-role',
        key: 'platform_admin',
        scope: RoleScope.PLATFORM,
      },
    ];

    await expect(
      service.replaceRoles(companyPrincipal, 'company-user', {
        roleKeys: ['platform_admin'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('prevents an administrator from suspending their own account', async () => {
    transactionUserResult = {
      id: companyPrincipal.userId,
      email: companyPrincipal.email,
      accountScope: AccountScope.COMPANY,
      companyId: 'company-a',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      company: {
        status: CompanyStatus.ACTIVE,
      },
      userRoles: [
        {
          role: {
            key: 'company_admin',
          },
        },
      ],
    };

    await expect(
      service.updateStatus(companyPrincipal, companyPrincipal.userId, {
        status: UserStatus.SUSPENDED,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(updateCalls).toBe(0);
  });

  it('prevents suspending the final active company administrator', async () => {
    transactionUserResult = {
      id: 'company-admin-1',
      email: 'admin1@company-a.test',
      accountScope: AccountScope.COMPANY,
      companyId: 'company-a',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      company: {
        status: CompanyStatus.ACTIVE,
      },
      userRoles: [
        {
          role: {
            key: 'company_admin',
          },
        },
      ],
    };

    otherActiveAdminCount = 0;

    await expect(
      service.updateStatus(companyPrincipal, 'company-admin-1', {
        status: UserStatus.SUSPENDED,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(updateCalls).toBe(0);
  });

  it('prevents removing the final active administrator role', async () => {
    transactionUserResult = {
      id: 'company-admin-1',
      email: 'admin1@company-a.test',
      accountScope: AccountScope.COMPANY,
      companyId: 'company-a',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userRoles: [
        {
          role: {
            key: 'company_admin',
          },
        },
      ],
    };

    transactionRoles = [
      {
        id: 'company-user-role',
        key: 'company_user',
        scope: RoleScope.COMPANY,
      },
    ];

    otherActiveAdminCount = 0;

    await expect(
      service.replaceRoles(companyPrincipal, 'company-admin-1', {
        roleKeys: ['company_user'],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
