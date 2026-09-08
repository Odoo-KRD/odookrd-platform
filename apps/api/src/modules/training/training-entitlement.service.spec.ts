import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { SettingsService } from '../settings/settings.service';
import { TrainingEntitlementService } from './training-entitlement.service';

const at = (iso: string): Date => new Date(iso);
const NOW = at('2026-03-15T12:00:00.000Z');

const COMPANY_ID = '7f28dd10-86d3-4286-81ff-f2f58bb8bd21';
const SUBSCRIBED_SERVICE = 'aaaaaaaa-0000-4000-8000-000000000001';
const PERPETUAL_SERVICE = 'bbbbbbbb-0000-4000-8000-000000000002';

interface AssignmentRow {
  serviceId: string;
  status: string;
  service: { billingModel: string };
  subscription: {
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    gracePeriodDays: number;
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
  } | null;
}

function serviceFor(rows: AssignmentRow[]): TrainingEntitlementService {
  const prisma = {
    companyService: {
      findMany: jest.fn().mockResolvedValue(rows),
    },
  } as unknown as PrismaService;

  const settings = {
    resolveValue: jest.fn().mockResolvedValue(true),
  } as unknown as SettingsService;

  return new TrainingEntitlementService(prisma, settings);
}

function subscribedAssignment(
  overrides: Partial<AssignmentRow['subscription']> = {},
): AssignmentRow {
  return {
    serviceId: SUBSCRIBED_SERVICE,
    status: 'ACTIVE',
    service: { billingModel: 'SUBSCRIPTION' },
    subscription: {
      status: 'ACTIVE',
      currentPeriodStart: at('2026-01-01T00:00:00.000Z'),
      currentPeriodEnd: at('2026-04-01T00:00:00.000Z'),
      gracePeriodDays: 0,
      autoRenew: false,
      cancelAtPeriodEnd: false,
      ...overrides,
    },
  };
}

describe('TrainingEntitlementService subscription gating', () => {
  it('grants training from a current subscription', async () => {
    const service = serviceFor([subscribedAssignment()]);

    await expect(
      service.resolveActiveTrainingServiceIds(COMPANY_ID, NOW),
    ).resolves.toEqual([SUBSCRIBED_SERVICE]);
  });

  it('closes training once the subscription has lapsed', async () => {
    const service = serviceFor([
      subscribedAssignment({
        currentPeriodEnd: at('2026-03-01T00:00:00.000Z'),
      }),
    ]);

    await expect(
      service.resolveActiveTrainingServiceIds(COMPANY_ID, NOW),
    ).resolves.toEqual([]);
  });

  it('keeps training open during the grace window', async () => {
    const service = serviceFor([
      subscribedAssignment({
        currentPeriodEnd: at('2026-03-14T00:00:00.000Z'),
        gracePeriodDays: 7,
      }),
    ]);

    await expect(
      service.resolveActiveTrainingServiceIds(COMPANY_ID, NOW),
    ).resolves.toEqual([SUBSCRIBED_SERVICE]);
  });

  it('ignores a stale ACTIVE status on a lapsed subscription', async () => {
    const service = serviceFor([
      subscribedAssignment({
        status: 'ACTIVE',
        currentPeriodEnd: at('2026-02-01T00:00:00.000Z'),
      }),
    ]);

    await expect(
      service.resolveActiveTrainingServiceIds(COMPANY_ID, NOW),
    ).resolves.toEqual([]);
  });

  it('leaves perpetual training services untouched', async () => {
    const service = serviceFor([
      {
        serviceId: PERPETUAL_SERVICE,
        status: 'ACTIVE',
        service: { billingModel: 'PERPETUAL' },
        subscription: null,
      },
    ]);

    await expect(
      service.resolveActiveTrainingServiceIds(COMPANY_ID, NOW),
    ).resolves.toEqual([PERPETUAL_SERVICE]);
  });

  it('denies a subscription-billed service with no subscription row', async () => {
    const service = serviceFor([
      {
        serviceId: SUBSCRIBED_SERVICE,
        status: 'ACTIVE',
        service: { billingModel: 'SUBSCRIPTION' },
        subscription: null,
      },
    ]);

    await expect(
      service.resolveActiveTrainingServiceIds(COMPANY_ID, NOW),
    ).resolves.toEqual([]);
  });

  it('returns only the entitled services from a mixed set', async () => {
    const service = serviceFor([
      subscribedAssignment(),
      {
        serviceId: PERPETUAL_SERVICE,
        status: 'ACTIVE',
        service: { billingModel: 'PERPETUAL' },
        subscription: null,
      },
      {
        serviceId: 'cccccccc-0000-4000-8000-000000000003',
        status: 'ACTIVE',
        service: { billingModel: 'SUBSCRIPTION' },
        subscription: {
          status: 'ACTIVE',
          currentPeriodStart: at('2025-01-01T00:00:00.000Z'),
          currentPeriodEnd: at('2026-01-01T00:00:00.000Z'),
          gracePeriodDays: 0,
          autoRenew: false,
          cancelAtPeriodEnd: false,
        },
      },
    ]);

    const result = await service.resolveActiveTrainingServiceIds(
      COMPANY_ID,
      NOW,
    );

    expect(result.sort()).toEqual(
      [PERPETUAL_SERVICE, SUBSCRIBED_SERVICE].sort(),
    );
  });

  it('deduplicates repeated services', async () => {
    const service = serviceFor([
      subscribedAssignment(),
      subscribedAssignment(),
    ]);

    await expect(
      service.resolveActiveTrainingServiceIds(COMPANY_ID, NOW),
    ).resolves.toEqual([SUBSCRIBED_SERVICE]);
  });
});
