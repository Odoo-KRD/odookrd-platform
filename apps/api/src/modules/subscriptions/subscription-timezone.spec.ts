import {
  DEFAULT_PLATFORM_TIMEZONE,
  assertSupportedTimeZone,
  endOfDayInZone,
  startOfDayInZone,
  zonedDateParts,
} from './subscription-timezone';

const at = (iso: string): Date => new Date(iso);

describe('subscription period boundaries', () => {
  it('defaults to the operator timezone', () => {
    expect(DEFAULT_PLATFORM_TIMEZONE).toBe('Asia/Baghdad');
  });

  it('ends a period at local midnight, not UTC midnight', () => {
    // Baghdad is UTC+3, so the last moment of 15 March locally is 20:59:59.999Z.
    expect(
      endOfDayInZone(at('2026-03-15T10:00:00.000Z'), 'Asia/Baghdad'),
    ).toEqual(at('2026-03-15T20:59:59.999Z'));
  });

  it('starts a period at local midnight', () => {
    expect(
      startOfDayInZone(at('2026-03-15T10:00:00.000Z'), 'Asia/Baghdad'),
    ).toEqual(at('2026-03-14T21:00:00.000Z'));
  });

  it('resolves against the local calendar date, not the UTC one', () => {
    // 22:00Z on the 15th is already 01:00 on the 16th in Baghdad.
    expect(
      endOfDayInZone(at('2026-03-15T22:00:00.000Z'), 'Asia/Baghdad'),
    ).toEqual(at('2026-03-16T20:59:59.999Z'));
  });

  it('reads the local calendar date', () => {
    expect(
      zonedDateParts(at('2026-03-15T22:00:00.000Z'), 'Asia/Baghdad'),
    ).toEqual({ year: 2026, month: 3, day: 16 });
    expect(zonedDateParts(at('2026-03-15T22:00:00.000Z'), 'UTC')).toEqual({
      year: 2026,
      month: 3,
      day: 15,
    });
  });

  it('handles a zone with no offset', () => {
    expect(endOfDayInZone(at('2026-03-15T10:00:00.000Z'), 'UTC')).toEqual(
      at('2026-03-15T23:59:59.999Z'),
    );
  });

  it('follows daylight saving in zones that observe it', () => {
    // London: BST (+1) in July, GMT (+0) in January.
    expect(
      endOfDayInZone(at('2026-07-15T10:00:00.000Z'), 'Europe/London'),
    ).toEqual(at('2026-07-15T22:59:59.999Z'));
    expect(
      endOfDayInZone(at('2026-01-15T10:00:00.000Z'), 'Europe/London'),
    ).toEqual(at('2026-01-15T23:59:59.999Z'));
  });

  it('rejects a timezone the runtime does not know', () => {
    expect(() => assertSupportedTimeZone('Not/AZone')).toThrow();
    expect(() =>
      assertSupportedTimeZone(DEFAULT_PLATFORM_TIMEZONE),
    ).not.toThrow();
  });
});
