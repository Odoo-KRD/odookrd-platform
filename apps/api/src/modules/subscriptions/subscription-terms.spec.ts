import {
  addTerm,
  daysRemaining,
  periodElapsedRatio,
  termMonths,
} from './subscription-terms';

const utc = (iso: string): Date => new Date(iso);

describe('subscription term arithmetic', () => {
  it('maps each fixed term to its month count', () => {
    expect(termMonths('MONTHLY')).toBe(1);
    expect(termMonths('QUARTERLY')).toBe(3);
    expect(termMonths('SEMI_ANNUAL')).toBe(6);
    expect(termMonths('ANNUAL')).toBe(12);
    expect(termMonths('TRIENNIAL')).toBe(36);
  });

  it('treats BIENNIAL as two years, not twice a year', () => {
    expect(termMonths('BIENNIAL')).toBe(24);
    expect(addTerm(utc('2026-03-01T00:00:00.000Z'), 'BIENNIAL')).toEqual(
      utc('2028-03-01T00:00:00.000Z'),
    );
  });

  it('has no fixed length for a custom term', () => {
    expect(termMonths('CUSTOM')).toBeNull();
    expect(() => addTerm(utc('2026-03-01T00:00:00.000Z'), 'CUSTOM')).toThrow();
  });

  it('advances a whole month without drifting', () => {
    expect(addTerm(utc('2026-01-15T09:30:00.000Z'), 'MONTHLY')).toEqual(
      utc('2026-02-15T09:30:00.000Z'),
    );
  });

  it('clamps a month end rather than rolling into the next month', () => {
    // 31 January + 1 month must not become 3 March.
    expect(addTerm(utc('2026-01-31T00:00:00.000Z'), 'MONTHLY')).toEqual(
      utc('2026-02-28T00:00:00.000Z'),
    );
  });

  it('clamps to 29 February in a leap year', () => {
    expect(addTerm(utc('2028-01-31T00:00:00.000Z'), 'MONTHLY')).toEqual(
      utc('2028-02-29T00:00:00.000Z'),
    );
  });

  it('keeps 29 February annual renewals on a real date', () => {
    expect(addTerm(utc('2028-02-29T00:00:00.000Z'), 'ANNUAL')).toEqual(
      utc('2029-02-28T00:00:00.000Z'),
    );
  });

  it('reports the elapsed fraction of a period', () => {
    const start = utc('2026-01-01T00:00:00.000Z');
    const end = utc('2026-01-11T00:00:00.000Z');

    expect(periodElapsedRatio(start, end, start)).toBe(0);
    expect(
      periodElapsedRatio(start, end, utc('2026-01-06T00:00:00.000Z')),
    ).toBeCloseTo(0.5);
    expect(periodElapsedRatio(start, end, end)).toBe(1);
  });

  it('clamps the elapsed fraction outside the period', () => {
    const start = utc('2026-01-01T00:00:00.000Z');
    const end = utc('2026-01-11T00:00:00.000Z');

    expect(
      periodElapsedRatio(start, end, utc('2025-12-01T00:00:00.000Z')),
    ).toBe(0);
    expect(
      periodElapsedRatio(start, end, utc('2026-06-01T00:00:00.000Z')),
    ).toBe(1);
  });

  it('treats a zero-length period as fully elapsed', () => {
    const instant = utc('2026-01-01T00:00:00.000Z');

    expect(periodElapsedRatio(instant, instant, instant)).toBe(1);
  });

  it('counts whole days remaining and goes negative once passed', () => {
    const end = utc('2026-01-11T00:00:00.000Z');

    expect(daysRemaining(end, utc('2026-01-01T00:00:00.000Z'))).toBe(10);
    expect(daysRemaining(end, utc('2026-01-10T12:00:00.000Z'))).toBe(1);
    expect(daysRemaining(end, utc('2026-01-13T00:00:00.000Z'))).toBe(-2);
  });
});
