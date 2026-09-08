import { ForbiddenException } from '@nestjs/common';

import { AccountScope } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { ServiceCatalogService } from './service-catalog.service';

const COMPANY_ID = '7f28dd10-86d3-4286-81ff-f2f58bb8bd21';

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

/**
 * Both cases below are rejected by the platform-administrator guard before any
 * query runs, so the client is stubbed only to prove no query is attempted.
 */
function serviceFor(): {
  service: ServiceCatalogService;
  findMany: jest.Mock;
} {
  const findMany = jest.fn().mockResolvedValue([]);

  const prisma = {
    service: {
      findMany,
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn((operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    ),
  } as unknown as PrismaService;

  return { service: new ServiceCatalogService(prisma), findMany };
}

describe('ServiceCatalogService company security', () => {
  it('prevents company accounts from enumerating the platform catalog', async () => {
    const { service, findMany } = serviceFor();

    await expect(
      service.listServices(companyPrincipal, { limit: 20, offset: 0 }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(findMany).not.toHaveBeenCalled();
  });

  it('rejects malformed platform authorization contexts', async () => {
    const { service, findMany } = serviceFor();

    await expect(
      service.listServices(
        { ...platformPrincipal, companyId: COMPANY_ID },
        { limit: 20, offset: 0 },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(findMany).not.toHaveBeenCalled();
  });
});
