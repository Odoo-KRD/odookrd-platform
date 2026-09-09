/**
 * Subscription reporting: pure aggregation and CSV rendering.
 *
 * No Prisma and no clock reads, so the bucketing rules and the escaping can be
 * tested directly.
 */

export type PipelineBucket =
  'OVERDUE' | 'WITHIN_7' | 'WITHIN_30' | 'WITHIN_60' | 'WITHIN_90';

export const PIPELINE_BUCKETS: readonly PipelineBucket[] = [
  'OVERDUE',
  'WITHIN_7',
  'WITHIN_30',
  'WITHIN_60',
  'WITHIN_90',
];

const MS_PER_DAY = 86_400_000;

/**
 * Which pipeline bucket a period end falls into, or null when it is further out
 * than the reporting horizon.
 *
 * Buckets are exclusive: a subscription 20 days out appears only in WITHIN_30,
 * not also in WITHIN_60, so the counts sum to the total rather than nesting.
 */
export function pipelineBucket(
  periodEnd: Date,
  now: Date,
): PipelineBucket | null {
  const days = Math.ceil((periodEnd.getTime() - now.getTime()) / MS_PER_DAY);

  if (days <= 0) {
    return 'OVERDUE';
  }

  if (days <= 7) {
    return 'WITHIN_7';
  }

  if (days <= 30) {
    return 'WITHIN_30';
  }

  if (days <= 60) {
    return 'WITHIN_60';
  }

  return days <= 90 ? 'WITHIN_90' : null;
}

export interface PipelineRow {
  currentPeriodEnd: Date;
  autoRenew: boolean;
}

export interface PipelineSummary {
  counts: Record<PipelineBucket, number>;
  total: number;
  autoRenewing: number;
  needsAttention: number;
}

/**
 * Counts per bucket.
 *
 * `needsAttention` deliberately excludes auto-renewing subscriptions: those
 * extend themselves and are not work for an operator.
 */
export function summarisePipeline(
  rows: readonly PipelineRow[],
  now: Date,
): PipelineSummary {
  const counts: Record<PipelineBucket, number> = {
    OVERDUE: 0,
    WITHIN_7: 0,
    WITHIN_30: 0,
    WITHIN_60: 0,
    WITHIN_90: 0,
  };

  let total = 0;
  let autoRenewing = 0;
  let needsAttention = 0;

  for (const row of rows) {
    const bucket = pipelineBucket(row.currentPeriodEnd, now);

    if (!bucket) {
      continue;
    }

    counts[bucket] += 1;
    total += 1;

    if (row.autoRenew) {
      autoRenewing += 1;
    } else {
      needsAttention += 1;
    }
  }

  return { counts, total, autoRenewing, needsAttention };
}

/**
 * Prefixes a leading formula character so spreadsheet software treats the value
 * as text. Same protection the training reports apply.
 */
export function protectCsvCell(value: string): string {
  return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number | null): string {
  const normalized = value === null ? '' : protectCsvCell(String(value));
  return `"${normalized.replaceAll('"', '""')}"`;
}

function csv(rows: Array<Array<string | number | null>>): string {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export interface SubscriptionCsvRow {
  companyName: string;
  serviceName: string;
  term: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  daysRemaining: number;
  gracePeriodDays: number;
  autoRenew: boolean;
  externalBillingRef: string | null;
}

export function buildSubscriptionPipelineCsv(
  rows: readonly SubscriptionCsvRow[],
): string {
  return csv([
    [
      'Company',
      'Service',
      'Term',
      'Status',
      'Period start',
      'Period end',
      'Days remaining',
      'Grace days',
      'Auto renew',
      'Billing reference',
    ],
    ...rows.map((row) => [
      row.companyName,
      row.serviceName,
      row.term,
      row.status,
      row.periodStart,
      row.periodEnd,
      row.daysRemaining,
      row.gracePeriodDays,
      row.autoRenew ? 'Yes' : 'No',
      row.externalBillingRef,
    ]),
  ]);
}

export interface RenewalHistoryCsvRow {
  companyName: string;
  serviceName: string;
  sequence: number;
  term: string;
  startsAt: string;
  endsAt: string;
  source: string;
  actorEmail: string | null;
}

export function buildRenewalHistoryCsv(
  rows: readonly RenewalHistoryCsvRow[],
): string {
  return csv([
    [
      'Company',
      'Service',
      'Period',
      'Term',
      'Starts',
      'Ends',
      'Source',
      'Actor',
    ],
    ...rows.map((row) => [
      row.companyName,
      row.serviceName,
      row.sequence,
      row.term,
      row.startsAt,
      row.endsAt,
      row.source,
      row.actorEmail,
    ]),
  ]);
}
