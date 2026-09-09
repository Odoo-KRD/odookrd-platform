import type { SubscriptionSnapshot } from './subscription-entitlement';

/**
 * Which expiry reminders are due for a subscription.
 *
 * Pure: no Prisma, no clock, no sending. The sweep asks what should go out and
 * records what it sent, which keeps the milestone rules testable in isolation.
 */

export const REMINDER_MILESTONES = [
  'T_MINUS_30',
  'T_MINUS_14',
  'T_MINUS_7',
  'T_MINUS_1',
  'EXPIRED',
  'GRACE_ENDED',
] as const;

export type ReminderMilestone = (typeof REMINDER_MILESTONES)[number];

/** Days before period end at which each countdown reminder fires. */
const COUNTDOWN_DAYS: Record<string, number> = {
  T_MINUS_30: 30,
  T_MINUS_14: 14,
  T_MINUS_7: 7,
  T_MINUS_1: 1,
};

const MS_PER_DAY = 86_400_000;

function accessEnd(subscription: SubscriptionSnapshot): number {
  return (
    subscription.currentPeriodEnd.getTime() +
    Math.max(0, subscription.gracePeriodDays) * MS_PER_DAY
  );
}

/**
 * Milestones that should be sent now and have not been sent for this period.
 *
 * Countdown reminders fire once the threshold is crossed rather than only on
 * the exact day, so a subscription created inside the window — or a sweep that
 * missed a day — still warns the customer instead of skipping silently.
 *
 * Only the nearest unsent countdown is returned. A subscription created five
 * days before expiry should get one "expires soon" message, not four.
 */
export function dueReminders(
  subscription: SubscriptionSnapshot,
  alreadySent: readonly ReminderMilestone[],
  now: Date,
): ReminderMilestone[] {
  if (subscription.status === 'CANCELLED') {
    return [];
  }

  const sent = new Set(alreadySent);
  const due: ReminderMilestone[] = [];
  const millisToEnd = subscription.currentPeriodEnd.getTime() - now.getTime();
  const millisToAccessEnd = accessEnd(subscription) - now.getTime();

  if (millisToAccessEnd <= 0) {
    if (!sent.has('GRACE_ENDED') && subscription.gracePeriodDays > 0) {
      due.push('GRACE_ENDED');
    }

    if (!sent.has('EXPIRED')) {
      due.push('EXPIRED');
    }

    return due;
  }

  if (millisToEnd <= 0) {
    // Inside the grace window: the period has ended but access continues.
    if (!sent.has('EXPIRED')) {
      due.push('EXPIRED');
    }

    return due;
  }

  // The narrowest countdown already sent. Nothing wider may follow it: a
  // customer told "7 days" must never then be told "14 days", even if the
  // superseded rows were never written.
  const narrowestSent = (
    ['T_MINUS_30', 'T_MINUS_14', 'T_MINUS_7', 'T_MINUS_1'] as const
  ).reduce<number | null>(
    (smallest, milestone) =>
      sent.has(milestone) &&
      (smallest === null || COUNTDOWN_DAYS[milestone] < smallest)
        ? COUNTDOWN_DAYS[milestone]
        : smallest,
    null,
  );

  // Nearest threshold already crossed, if it has not been sent yet.
  const countdown = (
    ['T_MINUS_1', 'T_MINUS_7', 'T_MINUS_14', 'T_MINUS_30'] as const
  ).find(
    (milestone) =>
      millisToEnd <= COUNTDOWN_DAYS[milestone] * MS_PER_DAY &&
      !sent.has(milestone) &&
      (narrowestSent === null || COUNTDOWN_DAYS[milestone] < narrowestSent),
  );

  if (countdown) {
    due.push(countdown);
  }

  return due;
}

/**
 * Milestones a countdown implies have passed.
 *
 * Recording these alongside the one actually sent stops a subscription created
 * inside the window from trickling out the wider reminders afterwards.
 */
export function supersededMilestones(
  milestone: ReminderMilestone,
): ReminderMilestone[] {
  const threshold = COUNTDOWN_DAYS[milestone];

  if (threshold === undefined) {
    return [];
  }

  return (
    ['T_MINUS_30', 'T_MINUS_14', 'T_MINUS_7', 'T_MINUS_1'] as const
  ).filter((candidate) => COUNTDOWN_DAYS[candidate] > threshold);
}
