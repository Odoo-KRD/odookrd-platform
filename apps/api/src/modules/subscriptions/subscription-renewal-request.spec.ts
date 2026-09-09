import { ConflictException, ForbiddenException } from '@nestjs/common';

import { AccountScope } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { AuthorizationService } from '../authorization/authorization.service';
import type { SubscriptionAdministrationService } from './subscription-administration.service';
import { SubscriptionRenewalRequestService } from './subscription-renewal-request.service';

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

interface FindManyArgs {
  where: unknown;
}

function serviceFor(overrides: { assignment?: unknown } = {}) {
  // Captured explicitly rather than read back off jest.fn().mock.calls, which
  // is typed as `any` and trips no-unsafe-member-access.
  let capturedWhere: unknown;
  let findManyCalls = 0;

  const findMany = jest.fn((args: FindManyArgs): Promise<unknown[]> => {
    capturedWhere = args.where;
    findManyCalls += 1;
    return Promise.resolve([]);
  });
  const count = jest.fn().mockResolvedValue(0);

  const prisma = {
    companyService: {
      findUnique: jest.fn().mockResolvedValue(
        'assignment' in overrides
          ? overrides.assignment
          : {
              id: 'assignment-id',
              companyId: COMPANY_ID,
              service: { billingModel: 'SUBSCRIPTION' },
              subscription: { id: 'subscription-id', status: 'ACTIVE' },
            },
      ),
    },
    subscriptionRenewalRequest: { findMany, count },
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

  const administration = {
    renew: jest.fn().mockResolvedValue({}),
  } as unknown as SubscriptionAdministrationService;

  return {
    service: new SubscriptionRenewalRequestService(
      prisma,
      authorization,
      administration,
    ),
    where: (): unknown => capturedWhere,
    calls: (): number => findManyCalls,
  };
}

describe('SubscriptionRenewalRequestService scoping', () => {
  it('confines a company account to its own requests', async () => {
    const { service, where, calls } = serviceFor();

    await service.list(companyPrincipal, { limit: 20, offset: 0 });

    expect(calls()).toBe(1);
    expect(where()).toEqual({
      subscription: { companyService: { companyId: COMPANY_ID } },
    });
  });

  it('ignores a foreign companyId supplied by a company account', async () => {
    const { service, where } = serviceFor();

    await service.list(companyPrincipal, {
      limit: 20,
      offset: 0,
      companyId: OTHER_COMPANY_ID,
    });

    expect(where()).toEqual({
      subscription: { companyService: { companyId: COMPANY_ID } },
    });
  });

  it('fails closed when a company principal has no company', async () => {
    const { service, calls } = serviceFor();

    await expect(
      service.list(
        { ...companyPrincipal, companyId: null },
        { limit: 20, offset: 0 },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(calls()).toBe(0);
  });

  it('lets a platform account filter by company', async () => {
    const { service, where } = serviceFor();

    await service.list(platformPrincipal, {
      limit: 20,
      offset: 0,
      companyId: OTHER_COMPANY_ID,
    });

    expect(where()).toEqual({
      subscription: { companyService: { companyId: OTHER_COMPANY_ID } },
    });
  });
});

describe('SubscriptionRenewalRequestService creation rules', () => {
  it('rejects a request against a perpetual service', async () => {
    const { service } = serviceFor({
      assignment: {
        id: 'assignment-id',
        companyId: COMPANY_ID,
        service: { billingModel: 'PERPETUAL' },
        subscription: null,
      },
    });

    await expect(
      service.create(companyPrincipal, 'assignment-id', {
        requestedTerm: 'ANNUAL',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a request against a cancelled subscription', async () => {
    const { service } = serviceFor({
      assignment: {
        id: 'assignment-id',
        companyId: COMPANY_ID,
        service: { billingModel: 'SUBSCRIPTION' },
        subscription: { id: 'subscription-id', status: 'CANCELLED' },
      },
    });

    await expect(
      service.create(companyPrincipal, 'assignment-id', {
        requestedTerm: 'ANNUAL',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a request against another company', async () => {
    const { service } = serviceFor({
      assignment: {
        id: 'assignment-id',
        companyId: OTHER_COMPANY_ID,
        service: { billingModel: 'SUBSCRIPTION' },
        subscription: { id: 'subscription-id', status: 'ACTIVE' },
      },
    });

    await expect(
      service.create(companyPrincipal, 'assignment-id', {
        requestedTerm: 'ANNUAL',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
