import {
  reconciledSubscriptionStatus,
  resolveEntitlement,
  type SubscriptionSnapshot,
} from './subscription-entitlement';

const at = (iso: string): Date => new Date(iso);
const NOW = at('2026-03-15T12:00:00.000Z');

function subscription(
  overrides: Partial<SubscriptionSnapshot> = {},
): SubscriptionSnapshot {
  return {
    status: 'ACTIVE',
    currentPeriodStart: at('2026-01-01T00:00:00.000Z'),
    currentPeriodEnd: at('2026-04-01T00:00:00.000Z'),
    gracePeriodDays: 0,
    autoRenew: false,
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

describe('resolveEntitlement', () => {
  it('leaves perpetual services entirely ungated', () => {
    const result = resolveEntitlement(
      {
        billingModel: 'PERPETUAL',
        assignmentStatus: 'ACTIVE',
        subscription: null,
      },
      NOW,
    );

    expect(result.state).toBe('PERPETUAL');
    expect(result.available).toBe(true);
    expect(result.periodEnd).toBeNull();
    expect(result.daysRemaining).toBeNull();
  });

  it('grants access inside a current period', () => {
    const result = resolveEntitlement(
      {
        billingModel: 'SUBSCRIPTION',
        assignmentStatus: 'ACTIVE',
        subscription: subscription(),
      },
      NOW,
    );

    expect(result.state).toBe('ACTIVE');
    expect(result.available).toBe(true);
    expect(result.daysRemaining).toBe(17);
  });

  it('honours an operator suspension over a paid subscription', () => {
    const result = resolveEntitlement(
      {
        billingModel: 'SUBSCRIPTION',
        assignmentStatus: 'SUSPENDED',
        subscription: subscription(),
      },
      NOW,
    );

    expect(result.state).toBe('ASSIGNMENT_INACTIVE');
    expect(result.available).toBe(false);
  });

  it('keeps access during the grace window and flags it', () => {
    const result = resolveEntitlement(
      {
        billingModel: 'SUBSCRIPTION',
        assignmentStatus: 'ACTIVE',
        subscription: subscription({
          currentPeriodEnd: at('2026-03-14T00:00:00.000Z'),
          gracePeriodDays: 7,
        }),
      },
      NOW,
    );

    expect(result.state).toBe('GRACE');
    expect(result.available).toBe(true);
    expect(result.inGrace).toBe(true);
  });

  it('withdraws access once the grace window closes', () => {
    const result = resolveEntitlement(
      {
        billingModel: 'SUBSCRIPTION',
        assignmentStatus: 'ACTIVE',
        subscription: subscription({
          currentPeriodEnd: at('2026-03-01T00:00:00.000Z'),
          gracePeriodDays: 7,
        }),
      },
      NOW,
    );

    expect(result.state).toBe('EXPIRED');
    expect(result.available).toBe(false);
  });

  it('does not trust a stale cached status', () => {
    // The 4C worker has not swept yet, so the row still says ACTIVE while its
    // period ended a fortnight ago. Enforcement must not depend on the sweep.
    const result = resolveEntitlement(
      {
        billingModel: 'SUBSCRIPTION',
        assignmentStatus: 'ACTIVE',
        subscription: subscription({
          status: 'ACTIVE',
          currentPeriodEnd: at('2026-03-01T00:00:00.000Z'),
        }),
      },
      NOW,
    );

    expect(result.state).toBe('EXPIRED');
    expect(result.available).toBe(false);
  });

  it('denies a subscription-billed service that has no subscription', () => {
    const result = resolveEntitlement(
      {
        billingModel: 'SUBSCRIPTION',
        assignmentStatus: 'ACTIVE',
        subscription: null,
      },
      NOW,
    );

    expect(result.state).toBe('SUBSCRIPTION_MISSING');
    expect(result.available).toBe(false);
  });

  it('denies a cancelled subscription even inside its period', () => {
    const result = resolveEntitlement(
      {
        billingModel: 'SUBSCRIPTION',
        assignmentStatus: 'ACTIVE',
        subscription: subscription({ status: 'CANCELLED' }),
      },
      NOW,
    );

    expect(result.state).toBe('CANCELLED');
    expect(result.available).toBe(false);
  });

  it('reports a trial distinctly while still granting access', () => {
    const result = resolveEntitlement(
      {
        billingModel: 'SUBSCRIPTION',
        assignmentStatus: 'ACTIVE',
        subscription: subscription({ status: 'TRIAL' }),
      },
      NOW,
    );

    expect(result.state).toBe('TRIAL');
    expect(result.available).toBe(true);
  });

  it('reports progress through the period for the remaining-period dial', () => {
    const result = resolveEntitlement(
      {
        billingModel: 'SUBSCRIPTION',
        assignmentStatus: 'ACTIVE',
        subscription: subscription({
          currentPeriodStart: at('2026-03-15T00:00:00.000Z'),
          currentPeriodEnd: at('2026-03-16T00:00:00.000Z'),
        }),
      },
      NOW,
    );

    expect(result.elapsedRatio).toBe(0.5);
  });

  it.each(['PROVISIONING', 'EXPIRED', 'CANCELLED'] as const)(
    'treats a %s assignment as inactive',
    (assignmentStatus) => {
      const result = resolveEntitlement(
        {
          billingModel: 'SUBSCRIPTION',
          assignmentStatus,
          subscription: subscription(),
        },
        NOW,
      );

      expect(result.available).toBe(false);
      expect(result.state).toBe('ASSIGNMENT_INACTIVE');
    },
  );
});

describe('reconciledSubscriptionStatus', () => {
  it('returns null when the cached status is already correct', () => {
    expect(reconciledSubscriptionStatus(subscription(), NOW)).toBeNull();
  });

  it('moves a lapsed subscription to EXPIRED', () => {
    expect(
      reconciledSubscriptionStatus(
        subscription({ currentPeriodEnd: at('2026-03-01T00:00:00.000Z') }),
        NOW,
      ),
    ).toBe('EXPIRED');
  });

  it('moves a subscription inside its grace window to GRACE', () => {
    expect(
      reconciledSubscriptionStatus(
        subscription({
          currentPeriodEnd: at('2026-03-14T00:00:00.000Z'),
          gracePeriodDays: 7,
        }),
        NOW,
      ),
    ).toBe('GRACE');
  });

  it('never reopens a cancelled subscription', () => {
    expect(
      reconciledSubscriptionStatus(subscription({ status: 'CANCELLED' }), NOW),
    ).toBeNull();
  });

  it('agrees with the resolver about when access ends', () => {
    const lapsed = subscription({
      currentPeriodEnd: at('2026-03-01T00:00:00.000Z'),
      gracePeriodDays: 7,
    });

    expect(reconciledSubscriptionStatus(lapsed, NOW)).toBe('EXPIRED');
    expect(
      resolveEntitlement(
        {
          billingModel: 'SUBSCRIPTION',
          assignmentStatus: 'ACTIVE',
          subscription: lapsed,
        },
        NOW,
      ).state,
    ).toBe('EXPIRED');
  });
});
