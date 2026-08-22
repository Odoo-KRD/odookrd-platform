import { ForbiddenException, NotFoundException } from '@nestjs/common';

import {
  AccountScope,
  CompanyServiceStatus,
  CompanyStatus,
  ServiceCategory,
  UserStatus,
} from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import {
  CUSTOMER_ACTIVITY_ACTIONS,
  WorkspaceService,
} from './workspace.service';

const COMPANY_ID = '7f28dd10-86d3-4286-81ff-f2f58bb8bd21';
const USER_ID = '3b68c4f4-a83b-40d9-b434-b95000463013';
const now = new Date('2026-08-22T08:00:00.000Z');

const principal: AuthenticatedPrincipal = {
  sessionId: 'company-session',
  userId: USER_ID,
  email: 'customer@example.com',
  accountScope: AccountScope.COMPANY,
  companyId: COMPANY_ID,
};

function createWorkspace() {
  const company = {
    id: COMPANY_ID,
    name: 'Customer company',
    nameTranslations: { ku: 'کۆمپانیای کڕیار', en: 'Customer company' },
    status: CompanyStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
  };

  const database = {
    company: {
      findUnique: jest.fn().mockResolvedValue(company),
    },
    companyService: {
      groupBy: jest.fn().mockResolvedValue([
        { status: CompanyServiceStatus.ACTIVE, _count: { _all: 3 } },
        { status: CompanyServiceStatus.PROVISIONING, _count: { _all: 1 } },
        { status: CompanyServiceStatus.SUSPENDED, _count: { _all: 1 } },
      ]),
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'company-service',
          companyId: COMPANY_ID,
          displayName: 'Managed Odoo',
          displayNameTranslations: { ku: 'ئۆدۆی بەڕێوەبراو' },
          status: CompanyServiceStatus.ACTIVE,
          expiresAt: null,
          serviceUrl: 'https://customer.odoo.krd',
          service: {
            id: 'service',
            name: 'Managed Odoo',
            nameTranslations: { ku: 'ئۆدۆی بەڕێوەبراو' },
            category: ServiceCategory.ODOO,
          },
        },
      ]),
    },
    auditLog: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'activity',
          action: 'service.assignment.created',
          targetType: 'company_service',
          createdAt: now,
        },
      ]),
    },
    user: {
      count: jest.fn().mockResolvedValue(4),
      findFirst: jest.fn().mockResolvedValue({
        id: USER_ID,
        email: 'customer@example.com',
        companyId: COMPANY_ID,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
        company,
        userRoles: [{ role: { key: 'company_user' } }],
      }),
    },
    session: {
      findFirst: jest.fn().mockResolvedValue({ lastSeenAt: now }),
    },
  };

  return {
    database,
    workspace: new WorkspaceService(database as unknown as PrismaService),
  };
}

describe('WorkspaceService customer isolation', () => {
  it('rejects platform accounts without querying company data', async () => {
    const { database, workspace } = createWorkspace();

    await expect(
      workspace.overview({
        ...principal,
        accountScope: AccountScope.PLATFORM,
        companyId: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(database.company.findUnique).not.toHaveBeenCalled();
  });

  it('requires a company identifier for every customer account', async () => {
    const { workspace } = createWorkspace();

    await expect(
      workspace.profile({ ...principal, companyId: null }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('scopes service counts, team members, and activity to the session company', async () => {
    const { database, workspace } = createWorkspace();
    const result = await workspace.overview(principal);

    expect(database.company.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: COMPANY_ID } }),
    );
    expect(database.companyService.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: COMPANY_ID } }),
    );
    expect(database.companyService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: COMPANY_ID }, take: 5 }),
    );
    expect(database.user.count).toHaveBeenCalledWith({
      where: { companyId: COMPANY_ID, status: UserStatus.ACTIVE },
    });
    expect(result.teamMembers).toBe(4);
    expect(result.company.id).toBe(COMPANY_ID);
  });

  it('calculates accurate service totals and upcoming expirations', async () => {
    const { database, workspace } = createWorkspace();
    const result = await workspace.overview(principal);

    expect(result.summary).toEqual({
      total: 5,
      active: 3,
      provisioning: 1,
      suspended: 1,
      expired: 0,
      cancelled: 0,
      expiringSoon: 2,
    });
    expect(database.companyService.count).toHaveBeenCalledTimes(1);
  });

  it('selects only allowlisted company activity without raw metadata', async () => {
    const { database, workspace } = createWorkspace();
    const result = await workspace.overview(principal);

    expect(database.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: COMPANY_ID,
          action: { in: [...CUSTOMER_ACTIVITY_ACTIONS] },
        },
        select: {
          id: true,
          action: true,
          targetType: true,
          createdAt: true,
        },
        take: 8,
      }),
    );
    expect(result.recentActivity[0]).not.toHaveProperty('metadata');
    expect(result.recentServices[0]).not.toHaveProperty('internalNotes');
  });

  it('returns only the current user and the current authenticated session', async () => {
    const { database, workspace } = createWorkspace();
    const result = await workspace.profile(principal);

    expect(database.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_ID, companyId: COMPANY_ID },
      }),
    );
    expect(database.session.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: principal.sessionId,
          userId: USER_ID,
          revokedAt: null,
        },
      }),
    );
    expect(result.roles).toEqual(['company_user']);
    expect(result.lastSeenAt).toEqual(now);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('does not create a workspace for a missing company', async () => {
    const { database, workspace } = createWorkspace();
    database.company.findUnique.mockResolvedValueOnce(null);

    await expect(workspace.overview(principal)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
