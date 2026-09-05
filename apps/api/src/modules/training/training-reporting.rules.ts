export interface TrainingReportDateRange {
  from: Date | null;
  toExclusive: Date | null;
}

function parseIsoCalendarDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new RangeError('Training report dates must use YYYY-MM-DD.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError('Training report date is invalid.');
  }

  return date;
}

export function buildTrainingReportDateRange(
  dateFrom?: string,
  dateTo?: string,
): TrainingReportDateRange {
  const from = dateFrom ? parseIsoCalendarDate(dateFrom) : null;
  const to = dateTo ? parseIsoCalendarDate(dateTo) : null;

  if (from && to && from > to) {
    throw new RangeError(
      'Training report start date cannot be after end date.',
    );
  }

  const toExclusive = to
    ? new Date(
        Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1),
      )
    : null;

  return { from, toExclusive };
}

export function trainingReportPercentage(
  numerator: number,
  denominator: number,
): number | null {
  if (denominator <= 0) return null;

  return Math.round((numerator / denominator) * 100);
}

export function trainingReportAverage(
  value: number | null | undefined,
): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value)
    : null;
}

export function latestTrainingReportDate(
  ...values: Array<Date | null | undefined>
): string | null {
  let latest: Date | null = null;

  for (const value of values) {
    if (value && (!latest || value > latest)) {
      latest = value;
    }
  }

  return latest?.toISOString() ?? null;
}
