import { ForbiddenException } from '@nestjs/common';

import { AccountScope, RoleScope } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RolesService } from './roles.service';

describe('RolesService administration safeguards', () => {
  const transaction = {
    role: {
      findUnique: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn(
      async (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  };

  const auditService = {
    write: jest.fn(),
  };

  const service = new RolesService(
    prisma as unknown as PrismaService,
    auditService as unknown as AuditService,
  );

  const platformPrincipal: AuthenticatedPrincipal = {
    sessionId: '00000000-0000-4000-8000-000000000001',
    userId: '00000000-0000-4000-8000-000000000002',
    email: 'admin@example.com',
    accountScope: AccountScope.PLATFORM,
    companyId: null,
  };

  const companyPrincipal: AuthenticatedPrincipal = {
    ...platformPrincipal,
    accountScope: AccountScope.COMPANY,
    companyId: '00000000-0000-4000-8000-000000000003',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects company principals from creating role definitions', async () => {
    await expect(
      service.create(companyPrincipal, {
        key: 'support_user',
        name: 'Support User',
        description: null,
        scope: RoleScope.COMPANY,
        permissionKeys: ['users.read'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('protects built-in system roles from editing', async () => {
    transaction.role.findUnique.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000004',
      key: 'company_admin',
      name: 'Company Admin',
      description: 'Administrator',
      scope: RoleScope.COMPANY,
      isSystem: true,
      rolePermissions: [],
      _count: { userRoles: 1 },
    });

    await expect(
      service.update(
        platformPrincipal,
        '00000000-0000-4000-8000-000000000004',
        {
          name: 'Changed',
          description: null,
          permissionKeys: ['users.read'],
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
