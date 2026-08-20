import { ForbiddenException } from '@nestjs/common';

import { AccountScope, RoleScope } from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AuthorizationService } from './authorization.service';
import { PERMISSIONS } from './permissions';

interface RoleAssignment {
  role: {
    key: string;
    scope: RoleScope;
    rolePermissions: Array<{
      permission: {
        key: string;
      };
    }>;
  };
}

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let assignments: RoleAssignment[];
  let capturedUserId: string | undefined;

  const prisma = {
    userRole: {
      findMany(args: {
        where: {
          userId: string;
        };
      }): Promise<RoleAssignment[]> {
        capturedUserId = args.where.userId;

        return Promise.resolve(assignments);
      },
    },
  } as unknown as PrismaService;

  const platformPrincipal: AuthenticatedPrincipal = {
    sessionId: 'platform-session',
    userId: 'platform-user',
    email: 'platform@example.com',
    accountScope: AccountScope.PLATFORM,
    companyId: null,
  };

  const companyPrincipal: AuthenticatedPrincipal = {
    sessionId: 'company-session',
    userId: 'company-user',
    email: 'company@example.com',
    accountScope: AccountScope.COMPANY,
    companyId: 'company-a',
  };

  function role(
    key: string,
    scope: RoleScope,
    permissions: string[],
  ): RoleAssignment {
    return {
      role: {
        key,
        scope,
        rolePermissions: permissions.map((permissionKey) => ({
          permission: {
            key: permissionKey,
          },
        })),
      },
    };
  }

  beforeEach(() => {
    capturedUserId = undefined;

    assignments = [
      role('platform_admin', RoleScope.PLATFORM, [
        PERMISSIONS.COMPANIES_READ,
        PERMISSIONS.USERS_READ,
        PERMISSIONS.USERS_MANAGE,
      ]),
    ];

    service = new AuthorizationService(prisma);
  });

  it('resolves current roles and permissions for a platform user', async () => {
    const context = await service.resolveContext(platformPrincipal);

    expect(capturedUserId).toBe('platform-user');

    expect(context).toEqual({
      userId: 'platform-user',
      accountScope: AccountScope.PLATFORM,
      companyId: null,
      roleKeys: ['platform_admin'],
      permissions: [
        PERMISSIONS.COMPANIES_READ,
        PERMISSIONS.USERS_READ,
        PERMISSIONS.USERS_MANAGE,
      ],
    });
  });

  it('deduplicates permissions inherited from multiple roles', async () => {
    assignments = [
      role('platform_admin', RoleScope.PLATFORM, [
        PERMISSIONS.USERS_READ,
        PERMISSIONS.USERS_MANAGE,
      ]),
      role('platform_reader', RoleScope.PLATFORM, [PERMISSIONS.USERS_READ]),
    ];

    const context = await service.resolveContext(platformPrincipal);

    expect(context.permissions).toEqual([
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_MANAGE,
    ]);
  });

  it('allows access when every required permission exists', async () => {
    await expect(
      service.assertPermissions(platformPrincipal, [
        PERMISSIONS.USERS_READ,
        PERMISSIONS.USERS_MANAGE,
      ]),
    ).resolves.toMatchObject({
      userId: 'platform-user',
    });
  });

  it('rejects access when a required permission is missing', async () => {
    await expect(
      service.assertPermissions(platformPrincipal, [
        PERMISSIONS.USERS_READ,
        PERMISSIONS.ROLES_MANAGE,
      ]),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows a company user to use company-scoped roles', async () => {
    assignments = [
      role('company_admin', RoleScope.COMPANY, [
        PERMISSIONS.COMPANIES_READ,
        PERMISSIONS.USERS_READ,
      ]),
    ];

    const context = await service.resolveContext(companyPrincipal);

    expect(context.roleKeys).toEqual(['company_admin']);
    expect(context.companyId).toBe('company-a');
  });

  it('rejects a platform role assigned to a company user', async () => {
    assignments = [
      role('platform_admin', RoleScope.PLATFORM, [PERMISSIONS.USERS_MANAGE]),
    ];

    await expect(service.resolveContext(companyPrincipal)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects a company role assigned to a platform user', async () => {
    assignments = [
      role('company_admin', RoleScope.COMPANY, [PERMISSIONS.USERS_MANAGE]),
    ];

    await expect(service.resolveContext(platformPrincipal)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows a company user to access its own company scope', () => {
    expect(() =>
      service.assertCompanyAccess(companyPrincipal, 'company-a'),
    ).not.toThrow();
  });

  it('rejects a company user accessing another company scope', () => {
    expect(() =>
      service.assertCompanyAccess(companyPrincipal, 'company-b'),
    ).toThrow(ForbiddenException);
  });

  it('allows a platform user across company scope when permission exists', async () => {
    assignments = [
      role('platform_admin', RoleScope.PLATFORM, [PERMISSIONS.COMPANIES_READ]),
    ];

    await expect(
      service.authorizeCompany(platformPrincipal, 'company-b', [
        PERMISSIONS.COMPANIES_READ,
      ]),
    ).resolves.toMatchObject({
      userId: 'platform-user',
    });
  });

  it('does not let platform scope bypass missing permissions', async () => {
    assignments = [
      role('platform_admin', RoleScope.PLATFORM, [PERMISSIONS.COMPANIES_READ]),
    ];

    await expect(
      service.authorizeCompany(platformPrincipal, 'company-b', [
        PERMISSIONS.USERS_MANAGE,
      ]),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects an invalid company principal without a company id', async () => {
    const invalidPrincipal: AuthenticatedPrincipal = {
      ...companyPrincipal,
      companyId: null,
    };

    await expect(service.resolveContext(invalidPrincipal)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects an invalid platform principal containing a company id', async () => {
    const invalidPrincipal: AuthenticatedPrincipal = {
      ...platformPrincipal,
      companyId: 'company-a',
    };

    await expect(service.resolveContext(invalidPrincipal)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
