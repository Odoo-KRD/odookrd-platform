import {
  buildTrainingReportDateRange,
  latestTrainingReportDate,
  trainingReportAverage,
  trainingReportPercentage,
} from './training-reporting.rules';

describe('training reporting rules', () => {
  it('builds an inclusive UTC date window with an exclusive upper bound', () => {
    const range = buildTrainingReportDateRange('2026-09-01', '2026-09-03');

    expect(range.from?.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(range.toExclusive?.toISOString()).toBe('2026-09-04T00:00:00.000Z');
  });

  it('rejects invalid and inverted calendar ranges', () => {
    expect(() => buildTrainingReportDateRange('2026-02-31')).toThrow(
      RangeError,
    );
    expect(() =>
      buildTrainingReportDateRange('2026-09-04', '2026-09-03'),
    ).toThrow(RangeError);
  });

  it('calculates stable whole-number percentages and averages', () => {
    expect(trainingReportPercentage(7, 10)).toBe(70);
    expect(trainingReportPercentage(0, 0)).toBeNull();
    expect(trainingReportAverage(84.6)).toBe(85);
    expect(trainingReportAverage(null)).toBeNull();
  });

  it('returns the latest available activity timestamp', () => {
    expect(
      latestTrainingReportDate(
        new Date('2026-09-01T10:00:00.000Z'),
        null,
        new Date('2026-09-03T08:00:00.000Z'),
      ),
    ).toBe('2026-09-03T08:00:00.000Z');
    expect(latestTrainingReportDate(null, undefined)).toBeNull();
  });
});
