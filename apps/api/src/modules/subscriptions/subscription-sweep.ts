import {
  reconciledSubscriptionStatus,
  type SubscriptionSnapshot,
  type SubscriptionStatusValue,
} from './subscription-entitlement';
import { addTerm, type SubscriptionTerm } from './subscription-terms';
import { endOfDayInZone } from './subscription-timezone';

/**
 * Decides what the Stage 4C sweep should do with one subscription.
 *
 * Pure: no Prisma, no clock reads, no side effects. The worker executes
 * whatever this returns, which keeps the interesting decisions testable and the
 * database code trivial.
 */

export interface SweepCandidate extends SubscriptionSnapshot {
  id: string;
  term: SubscriptionTerm;
  currentSequence: number;
}

export type SweepAction =
  | { kind: 'NONE' }
  | { kind: 'STATUS'; status: SubscriptionStatusValue }
  | {
      kind: 'RENEW';
      sequence: number;
      periodStart: Date;
      periodEnd: Date;
    };

/**
 * Auto-renewal happens at the end of the paid period, not at the end of grace.
 * Grace exists to cover a late manual renewal; a subscription set to renew
 * itself should never enter it.
 */
export function planSweep(
  candidate: SweepCandidate,
  now: Date,
  timeZone: string,
): SweepAction {
  if (candidate.status === 'CANCELLED') {
    return { kind: 'NONE' };
  }

  const periodOver = now.getTime() >= candidate.currentPeriodEnd.getTime();

  if (
    periodOver &&
    candidate.autoRenew &&
    !candidate.cancelAtPeriodEnd &&
    candidate.term !== 'CUSTOM'
  ) {
    // The new period runs from the old end, so repeated renewals never drift
    // and no access gap opens even if the sweep runs late.
    const periodStart = candidate.currentPeriodEnd;
    const periodEnd = endOfDayInZone(
      addTerm(periodStart, candidate.term),
      timeZone,
    );

    return {
      kind: 'RENEW',
      sequence: candidate.currentSequence + 1,
      periodStart,
      periodEnd,
    };
  }

  const status = reconciledSubscriptionStatus(candidate, now);

  return status === null ? { kind: 'NONE' } : { kind: 'STATUS', status };
}

/**
 * A subscription that lapsed while the worker was down may be several periods
 * behind. Renewing one term at a time would leave it still expired, so the
 * plan is applied repeatedly until it catches up or stops renewing.
 *
 * Bounded so a misconfigured row cannot spin forever.
 */
export function planSweepToCurrent(
  candidate: SweepCandidate,
  now: Date,
  timeZone: string,
  maxRenewals = 24,
): SweepAction {
  let current = candidate;
  let renewals = 0;
  let last: SweepAction = { kind: 'NONE' };

  for (;;) {
    const action = planSweep(current, now, timeZone);

    if (action.kind !== 'RENEW') {
      return renewals > 0 ? last : action;
    }

    renewals += 1;
    last = action;

    if (renewals >= maxRenewals) {
      return action;
    }

    current = {
      ...current,
      status: 'ACTIVE',
      currentPeriodStart: action.periodStart,
      currentPeriodEnd: action.periodEnd,
      currentSequence: action.sequence,
    };
  }
}
