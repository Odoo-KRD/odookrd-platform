/**
 * Entitlement resolution.
 *
 * Whether a customer may use a service is *derived* here, never stored. Expiry
 * mutates nothing: feature rows, progress and uploaded files stay exactly as an
 * operator configured them, and renewal restores access instantly because
 * nothing was destroyed. Data remains, tagged expired.
 *
 * The subscription's own `status` column is a cache maintained by the Stage 4C
 * worker. This module treats the period dates as the truth, so a subscription
 * whose period ended two minutes ago resolves as expired even though the sweep
 * has not run yet. A worker outage degrades reporting, never enforcement.
 *
 * Pure by design: no Prisma, no Nest, no clock reads. Every decision is a
 * function of its inputs.
 */

export type EntitlementState =
  | 'PERPETUAL'
  | 'TRIAL'
  | 'ACTIVE'
  | 'GRACE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'ASSIGNMENT_INACTIVE'
  | 'SUBSCRIPTION_MISSING';

export type BillingModel = 'PERPETUAL' | 'SUBSCRIPTION';

export type AssignmentStatus =
  'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';

export type SubscriptionStatusValue =
  'TRIAL' | 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'CANCELLED';

export interface SubscriptionSnapshot {
  status: SubscriptionStatusValue;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  gracePeriodDays: number;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
}

export interface EntitlementInput {
  billingModel: BillingModel;
  assignmentStatus: AssignmentStatus;
  subscription: SubscriptionSnapshot | null;
}

export interface Entitlement {
  state: EntitlementState;
  /** May the customer use this service and its features right now? */
  available: boolean;
  /** True while access continues only because of the grace window. */
  inGrace: boolean;
  periodStart: Date | null;
  periodEnd: Date | null;
  /** Instant access is actually withdrawn: period end plus any grace. */
  accessEndsAt: Date | null;
  /** Whole days until accessEndsAt. Negative once passed. Null if perpetual. */
  daysRemaining: number | null;
  /** 0..1 progress through the current period, for the remaining-period dial. */
  elapsedRatio: number | null;
  autoRenew: boolean;
}

const MS_PER_DAY = 86_400_000;

function unavailable(
  state: EntitlementState,
  subscription: SubscriptionSnapshot | null,
  now: Date,
): Entitlement {
  return {
    state,
    available: false,
    inGrace: false,
    periodStart: subscription?.currentPeriodStart ?? null,
    periodEnd: subscription?.currentPeriodEnd ?? null,
    accessEndsAt: subscription ? accessEnd(subscription) : null,
    daysRemaining: subscription
      ? daysUntil(accessEnd(subscription), now)
      : null,
    elapsedRatio: subscription ? elapsed(subscription, now) : null,
    autoRenew: subscription?.autoRenew ?? false,
  };
}

function accessEnd(subscription: SubscriptionSnapshot): Date {
  return new Date(
    subscription.currentPeriodEnd.getTime() +
      Math.max(0, subscription.gracePeriodDays) * MS_PER_DAY,
  );
}

function daysUntil(instant: Date, now: Date): number {
  return Math.ceil((instant.getTime() - now.getTime()) / MS_PER_DAY);
}

function elapsed(subscription: SubscriptionSnapshot, now: Date): number {
  const total =
    subscription.currentPeriodEnd.getTime() -
    subscription.currentPeriodStart.getTime();

  if (total <= 0) {
    return 1;
  }

  const done = now.getTime() - subscription.currentPeriodStart.getTime();

  return Math.min(1, Math.max(0, done / total));
}

/**
 * Resolves what a customer may do with one service assignment.
 *
 * Order matters. The assignment's own lifecycle is checked first: an operator
 * who suspends a service must have that honoured even if the subscription is
 * paid and current.
 */
export function resolveEntitlement(
  input: EntitlementInput,
  now: Date,
): Entitlement {
  const { billingModel, assignmentStatus, subscription } = input;

  if (
    assignmentStatus === 'SUSPENDED' ||
    assignmentStatus === 'CANCELLED' ||
    assignmentStatus === 'EXPIRED' ||
    assignmentStatus === 'PROVISIONING'
  ) {
    return unavailable('ASSIGNMENT_INACTIVE', subscription, now);
  }

  if (billingModel === 'PERPETUAL') {
    return {
      state: 'PERPETUAL',
      available: true,
      inGrace: false,
      periodStart: null,
      periodEnd: null,
      accessEndsAt: null,
      daysRemaining: null,
      elapsedRatio: null,
      autoRenew: false,
    };
  }

  // A subscription-billed service with no subscription row is a configuration
  // error. Denying is the safe reading: it cannot be paid for if it does not
  // exist.
  if (!subscription) {
    return unavailable('SUBSCRIPTION_MISSING', null, now);
  }

  if (subscription.status === 'CANCELLED') {
    return unavailable('CANCELLED', subscription, now);
  }

  const periodOver = now.getTime() >= subscription.currentPeriodEnd.getTime();
  const accessOver = now.getTime() >= accessEnd(subscription).getTime();

  if (accessOver) {
    return unavailable('EXPIRED', subscription, now);
  }

  const base = {
    available: true,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    accessEndsAt: accessEnd(subscription),
    daysRemaining: daysUntil(accessEnd(subscription), now),
    elapsedRatio: elapsed(subscription, now),
    autoRenew: subscription.autoRenew,
  };

  if (periodOver) {
    return { ...base, state: 'GRACE', inGrace: true };
  }

  return {
    ...base,
    state: subscription.status === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
    inGrace: false,
  };
}

/**
 * Status the Stage 4C worker should persist for a subscription, or null when
 * the cached value is already correct. Keeps the sweep and the resolver from
 * disagreeing by deriving both from the same rules.
 */
export function reconciledSubscriptionStatus(
  subscription: SubscriptionSnapshot,
  now: Date,
): SubscriptionStatusValue | null {
  if (subscription.status === 'CANCELLED') {
    return null;
  }

  const periodOver = now.getTime() >= subscription.currentPeriodEnd.getTime();
  const accessOver = now.getTime() >= accessEnd(subscription).getTime();

  const expected: SubscriptionStatusValue = accessOver
    ? 'EXPIRED'
    : periodOver
      ? 'GRACE'
      : subscription.status === 'TRIAL'
        ? 'TRIAL'
        : 'ACTIVE';

  return expected === subscription.status ? null : expected;
}
