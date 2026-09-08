import { planSweep, planSweepToCurrent } from './subscription-sweep';
import type { SweepCandidate } from './subscription-sweep';

const at = (iso: string): Date => new Date(iso);
const NOW = at('2026-03-15T12:00:00.000Z');
const TZ = 'Asia/Baghdad';

function candidate(overrides: Partial<SweepCandidate> = {}): SweepCandidate {
  return {
    id: 'subscription-id',
    term: 'MONTHLY',
    currentSequence: 1,
    status: 'ACTIVE',
    currentPeriodStart: at('2026-02-01T00:00:00.000Z'),
    currentPeriodEnd: at('2026-03-01T00:00:00.000Z'),
    gracePeriodDays: 0,
    autoRenew: false,
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

describe('planSweep', () => {
  it('leaves a subscription inside its period alone', () => {
    expect(
      planSweep(
        candidate({ currentPeriodEnd: at('2026-04-01T00:00:00.000Z') }),
        NOW,
        TZ,
      ),
    ).toEqual({ kind: 'NONE' });
  });

  it('expires a lapsed subscription with no grace', () => {
    expect(planSweep(candidate(), NOW, TZ)).toEqual({
      kind: 'STATUS',
      status: 'EXPIRED',
    });
  });

  it('moves a lapsed subscription into its grace window', () => {
    expect(planSweep(candidate({ gracePeriodDays: 30 }), NOW, TZ)).toEqual({
      kind: 'STATUS',
      status: 'GRACE',
    });
  });

  it('auto-renews at period end rather than waiting for grace to run out', () => {
    const action = planSweep(
      candidate({ autoRenew: true, gracePeriodDays: 30 }),
      NOW,
      TZ,
    );

    expect(action.kind).toBe('RENEW');
    if (action.kind !== 'RENEW') return;

    expect(action.sequence).toBe(2);
    // The new period starts where the old one ended, so renewals never drift
    // and no gap opens if the sweep runs late.
    expect(action.periodStart).toEqual(at('2026-03-01T00:00:00.000Z'));
    // Ends at local midnight in Baghdad, which is 20:59:59.999Z.
    expect(action.periodEnd).toEqual(at('2026-04-01T20:59:59.999Z'));
  });

  it('settles on a stable local end-of-day across renewals', () => {
    const action = planSweep(
      candidate({
        autoRenew: true,
        currentPeriodEnd: at('2026-04-01T20:59:59.999Z'),
      }),
      at('2026-05-15T00:00:00.000Z'),
      TZ,
    );

    expect(action.kind).toBe('RENEW');
    if (action.kind !== 'RENEW') return;
    expect(action.periodEnd).toEqual(at('2026-05-01T20:59:59.999Z'));
  });

  it('honours cancelAtPeriodEnd over autoRenew', () => {
    expect(
      planSweep(
        candidate({ autoRenew: true, cancelAtPeriodEnd: true }),
        NOW,
        TZ,
      ),
    ).toEqual({ kind: 'STATUS', status: 'EXPIRED' });
  });

  it('cannot auto-renew a custom term', () => {
    expect(
      planSweep(candidate({ autoRenew: true, term: 'CUSTOM' }), NOW, TZ),
    ).toEqual({ kind: 'STATUS', status: 'EXPIRED' });
  });

  it('never touches a cancelled subscription', () => {
    expect(planSweep(candidate({ status: 'CANCELLED' }), NOW, TZ)).toEqual({
      kind: 'NONE',
    });
  });
});

describe('planSweepToCurrent', () => {
  it('catches up a subscription that lapsed while the worker was down', () => {
    const action = planSweepToCurrent(
      candidate({ autoRenew: true }),
      at('2026-06-15T12:00:00.000Z'),
      TZ,
    );

    expect(action.kind).toBe('RENEW');
    if (action.kind !== 'RENEW') return;

    expect(action.sequence).toBe(5);
    expect(action.periodEnd.getTime()).toBeGreaterThan(
      at('2026-06-15T12:00:00.000Z').getTime(),
    );
  });

  it('bounds the catch-up so a bad row cannot spin forever', () => {
    const action = planSweepToCurrent(
      candidate({ autoRenew: true }),
      at('2099-01-01T00:00:00.000Z'),
      TZ,
      3,
    );

    expect(action.kind).toBe('RENEW');
    if (action.kind !== 'RENEW') return;
    expect(action.sequence).toBe(4);
  });

  it('falls through to a status change when renewal is off', () => {
    expect(
      planSweepToCurrent(candidate(), at('2026-06-15T12:00:00.000Z'), TZ),
    ).toEqual({ kind: 'STATUS', status: 'EXPIRED' });
  });
});
