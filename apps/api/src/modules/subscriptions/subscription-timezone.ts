/**
 * Timezone handling for subscription period boundaries.
 *
 * A subscription that "expires on 15 March" must stay usable for the whole of
 * the 15th in the operator's timezone. Storing a plain UTC midnight would cut
 * access off at 03:00 local in Asia/Baghdad, so period ends are resolved to the
 * last millisecond of the local day and persisted as the equivalent UTC
 * instant. Everything in the database stays UTC; only the boundary is local.
 */

export const DEFAULT_PLATFORM_TIMEZONE = 'Asia/Baghdad';

interface ZonedParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Offset in milliseconds between the given zone and UTC at a specific instant.
 * Derived from Intl rather than hardcoded, so zones observing DST stay correct.
 */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(new Date(instant));
  const read = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  // Intl renders midnight as hour 24 in some engines; normalise it to 0.
  const hour = read('hour') % 24;

  const asUtc = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    hour,
    read('minute'),
    read('second'),
  );

  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Calendar date an instant falls on, as seen in the given zone. */
export function zonedDateParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const [year, month, day] = formatter.format(date).split('-').map(Number);

  return { year, month, day };
}

/**
 * Last millisecond of the local day the instant falls on, as a UTC instant.
 *
 * Resolved in two passes because the offset itself depends on the instant being
 * computed; the second pass settles any zone whose offset changes during the
 * day.
 */
export function endOfDayInZone(date: Date, timeZone: string): Date {
  const { year, month, day } = zonedDateParts(date, timeZone);
  const wallClock = Date.UTC(year, month - 1, day, 23, 59, 59, 999);

  let instant = wallClock - zoneOffsetMs(wallClock, timeZone);
  instant = wallClock - zoneOffsetMs(instant, timeZone);

  return new Date(instant);
}

/** First millisecond of the local day the instant falls on, as a UTC instant. */
export function startOfDayInZone(date: Date, timeZone: string): Date {
  const { year, month, day } = zonedDateParts(date, timeZone);
  const wallClock = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  let instant = wallClock - zoneOffsetMs(wallClock, timeZone);
  instant = wallClock - zoneOffsetMs(instant, timeZone);

  return new Date(instant);
}

/** Throws if the configured timezone is not one the runtime recognises. */
export function assertSupportedTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
  } catch {
    throw new Error(`Unsupported platform timezone: ${timeZone}`);
  }
}
