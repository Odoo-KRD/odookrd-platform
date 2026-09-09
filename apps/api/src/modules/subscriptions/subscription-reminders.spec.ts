import type { SubscriptionSnapshot } from './subscription-entitlement';
import {
  dueReminders,
  supersededMilestones,
  type ReminderMilestone,
} from './subscription-reminders';

const at = (iso: string): Date => new Date(iso);

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

const none: ReminderMilestone[] = [];

describe('dueReminders', () => {
  it('sends nothing while expiry is far away', () => {
    expect(
      dueReminders(subscription(), none, at('2026-01-15T00:00:00.000Z')),
    ).toEqual([]);
  });

  it('fires the 30 day reminder once the threshold is crossed', () => {
    expect(
      dueReminders(subscription(), none, at('2026-03-05T00:00:00.000Z')),
    ).toEqual(['T_MINUS_30']);
  });

  it('does not repeat a reminder already sent', () => {
    expect(
      dueReminders(
        subscription(),
        ['T_MINUS_30'],
        at('2026-03-05T00:00:00.000Z'),
      ),
    ).toEqual([]);
  });

  it('moves on to the next threshold', () => {
    expect(
      dueReminders(
        subscription(),
        ['T_MINUS_30'],
        at('2026-03-20T00:00:00.000Z'),
      ),
    ).toEqual(['T_MINUS_14']);
  });

  it('sends only the nearest reminder when several thresholds are already past', () => {
    // A subscription created five days before expiry must not receive the 30,
    // 14 and 7 day warnings all at once.
    expect(
      dueReminders(subscription(), none, at('2026-03-27T00:00:00.000Z')),
    ).toEqual(['T_MINUS_7']);
  });

  it('never falls back to a wider countdown after a narrower one', () => {
    // With T_MINUS_7 recorded and five days left, the search must not skip past
    // it to T_MINUS_14. A customer told "7 days" cannot then be told "14 days".
    expect(
      dueReminders(
        subscription({ currentPeriodEnd: at('2026-03-20T00:00:00.000Z') }),
        ['T_MINUS_7'],
        at('2026-03-15T12:00:00.000Z'),
      ),
    ).toEqual([]);
  });

  it('still fires the final reminder after a narrower one was sent', () => {
    expect(
      dueReminders(
        subscription({ currentPeriodEnd: at('2026-03-20T00:00:00.000Z') }),
        ['T_MINUS_7'],
        at('2026-03-19T12:00:00.000Z'),
      ),
    ).toEqual(['T_MINUS_1']);
  });

  it('reports expiry once the period ends', () => {
    expect(
      dueReminders(subscription(), none, at('2026-04-02T00:00:00.000Z')),
    ).toEqual(['EXPIRED']);
  });

  it('reports expiry during the grace window but not grace end', () => {
    expect(
      dueReminders(
        subscription({ gracePeriodDays: 7 }),
        none,
        at('2026-04-02T00:00:00.000Z'),
      ),
    ).toEqual(['EXPIRED']);
  });

  it('reports grace end once access actually stops', () => {
    expect(
      dueReminders(
        subscription({ gracePeriodDays: 7 }),
        ['EXPIRED'],
        at('2026-04-09T00:00:00.000Z'),
      ),
    ).toEqual(['GRACE_ENDED']);
  });

  it('does not announce a grace end for a subscription with no grace', () => {
    expect(
      dueReminders(subscription(), ['EXPIRED'], at('2026-04-09T00:00:00.000Z')),
    ).toEqual([]);
  });

  it('stays silent for a cancelled subscription', () => {
    expect(
      dueReminders(
        subscription({ status: 'CANCELLED' }),
        none,
        at('2026-03-05T00:00:00.000Z'),
      ),
    ).toEqual([]);
  });
});

describe('supersededMilestones', () => {
  it('marks the wider countdowns as passed', () => {
    expect(supersededMilestones('T_MINUS_7')).toEqual([
      'T_MINUS_30',
      'T_MINUS_14',
    ]);
  });

  it('supersedes nothing for the widest countdown', () => {
    expect(supersededMilestones('T_MINUS_30')).toEqual([]);
  });

  it('supersedes nothing for a non-countdown milestone', () => {
    expect(supersededMilestones('EXPIRED')).toEqual([]);
  });
});
