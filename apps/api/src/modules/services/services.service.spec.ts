import { ForbiddenException } from '@nestjs/common';

import {
  AccountScope,
  CompanyServiceStatus,
  CompanyStatus,
  ServiceCatalogStatus,
  ServiceCategory,
} from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { AuthorizationService } from '../authorization/authorization.service';
import { ServicesService } from './services.service';

const COMPANY_ID = '7f28dd10-86d3-4286-81ff-f2f58bb8bd21';
const OTHER_COMPANY_ID = '8a7ea523-ea89-487d-84b3-98fe6bde9a62';

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
  companyId: COMPANY_ID,
};

function serviceFor(companyId: string = COMPANY_ID): ServicesService {
  const now = new Date('2026-08-22T00:00:00.000Z');
  const assignment = {
    id: 'b950dcd0-88f8-47ac-baf6-aaf95be93731',
    companyId,
    serviceId: 'ac316a93-4bde-4838-911f-ec7a8908ddbc',
    displayName: 'Managed Odoo',
    status: CompanyServiceStatus.ACTIVE,
    serviceUrl: 'https://customer.odoo.krd',
    startsAt: now,
    expiresAt: null,
    notes: 'Visible customer note',
    internalNotes: 'Private platform-only operator note',
    createdAt: now,
    updatedAt: now,
    company: {
      id: companyId,
      name: 'Customer company',
      status: CompanyStatus.ACTIVE,
    },
    service: {
      id: 'ac316a93-4bde-4838-911f-ec7a8908ddbc',
      key: 'managed-odoo',
      name: 'Managed Odoo',
      category: ServiceCategory.ODOO,
      status: ServiceCatalogStatus.ACTIVE,
    },
  };

  const prisma = {
    companyService: {
      findUnique: jest.fn().mockResolvedValue(assignment),
      findMany: jest.fn().mockResolvedValue([assignment]),
      count: jest.fn().mockResolvedValue(1),
    },
    $transaction: jest.fn((operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    ),
  } as unknown as PrismaService;

  const authorization = {
    assertCompanyAccess: jest.fn(
      (principal: AuthenticatedPrincipal, targetCompanyId: string): void => {
        if (
          principal.accountScope === AccountScope.COMPANY &&
          principal.companyId !== targetCompanyId
        ) {
          throw new ForbiddenException(
            'Access outside company scope is forbidden.',
          );
        }
      },
    ),
  } as unknown as AuthorizationService;

  return new ServicesService(prisma, authorization);
}

describe('ServicesService company security', () => {
  it('removes private operator notes from company service responses', async () => {
    const service = serviceFor();

    const result = await service.getAssignment(
      companyPrincipal,
      'assignment-id',
    );

    expect(result.notes).toBe('Visible customer note');
    expect(result).not.toHaveProperty('internalNotes');
  });

  it('preserves private operator notes for platform administrators', async () => {
    const service = serviceFor();

    const result = await service.getAssignment(
      platformPrincipal,
      'assignment-id',
    );

    expect(result.internalNotes).toBe('Private platform-only operator note');
  });

  it('returns company assignment lists without private operator notes', async () => {
    const service = serviceFor();

    const result = await service.listAssignments(companyPrincipal, {
      limit: 20,
      offset: 0,
    });

    expect(result.pagination.total).toBe(1);
    expect(result.items[0]?.companyId).toBe(COMPANY_ID);
    expect(result.items[0]).not.toHaveProperty('internalNotes');
  });

  it('rejects direct access to another company service assignment', async () => {
    const service = serviceFor(OTHER_COMPANY_ID);

    await expect(
      service.getAssignment(companyPrincipal, 'assignment-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects an explicit foreign-company assignment filter', async () => {
    const service = serviceFor();

    await expect(
      service.listAssignments(companyPrincipal, {
        limit: 20,
        offset: 0,
        companyId: OTHER_COMPANY_ID,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents company accounts from enumerating the platform catalog', async () => {
    const service = serviceFor();

    await expect(
      service.listServices(companyPrincipal, { limit: 20, offset: 0 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects malformed platform authorization contexts', async () => {
    const service = serviceFor();

    await expect(
      service.listServices(
        { ...platformPrincipal, companyId: COMPANY_ID },
        { limit: 20, offset: 0 },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
