/**
 * Subscription term arithmetic.
 *
 * Kept free of Prisma and Nest so the date maths can be unit-tested directly.
 * Every function takes an explicit instant rather than reading the clock, so
 * expiry behaviour is reproducible in tests.
 */

export const SUBSCRIPTION_TERMS = [
  'MONTHLY',
  'QUARTERLY',
  'SEMI_ANNUAL',
  'ANNUAL',
  'BIENNIAL',
  'TRIENNIAL',
  'CUSTOM',
] as const;

export type SubscriptionTerm = (typeof SUBSCRIPTION_TERMS)[number];

/** Whole months advanced by one cycle of each term. CUSTOM has no fixed length. */
const TERM_MONTHS: Record<Exclude<SubscriptionTerm, 'CUSTOM'>, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  SEMI_ANNUAL: 6,
  ANNUAL: 12,
  BIENNIAL: 24,
  TRIENNIAL: 36,
};

export function termMonths(term: SubscriptionTerm): number | null {
  return term === 'CUSTOM' ? null : TERM_MONTHS[term];
}

/**
 * Advances an instant by one term.
 *
 * Clamps to the last day of the target month so that a subscription starting
 * on the 31st does not silently roll into the following month. A monthly term
 * starting 31 January ends 28 February (29 in a leap year), not 3 March.
 */
export function addTerm(from: Date, term: SubscriptionTerm): Date {
  const months = termMonths(term);

  if (months === null) {
    throw new Error('A custom term requires an explicit end date.');
  }

  const day = from.getUTCDate();
  const target = new Date(from.getTime());

  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();

  target.setUTCDate(Math.min(day, lastDayOfTargetMonth));

  return target;
}

/**
 * Fraction of the current period already elapsed, clamped to 0..1.
 * Drives the remaining-period indicator on the customer service card.
 */
export function periodElapsedRatio(
  periodStart: Date,
  periodEnd: Date,
  now: Date,
): number {
  const total = periodEnd.getTime() - periodStart.getTime();

  if (total <= 0) {
    return 1;
  }

  const elapsed = now.getTime() - periodStart.getTime();

  return Math.min(1, Math.max(0, elapsed / total));
}

/** Whole days remaining before the given instant. Negative once passed. */
export function daysRemaining(periodEnd: Date, now: Date): number {
  return Math.ceil((periodEnd.getTime() - now.getTime()) / 86_400_000);
}
