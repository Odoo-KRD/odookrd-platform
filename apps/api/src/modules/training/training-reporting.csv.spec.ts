import {
  buildTrainingCourseReportCsv,
  protectTrainingReportCsvCell,
} from './training-reporting.csv';

describe('training reporting CSV', () => {
  it('protects spreadsheet-formula prefixes', () => {
    expect(protectTrainingReportCsvCell('=2+2')).toBe("'=2+2");
    expect(protectTrainingReportCsvCell('  @cmd')).toBe("'  @cmd");
    expect(protectTrainingReportCsvCell('Normal')).toBe('Normal');
  });

  it('emits UTF-8 BOM, localized headers, escaped quotes and localized titles', () => {
    const value = buildTrainingCourseReportCsv('ar', [
      {
        title: 'Fallback',
        titleTranslations: { ar: 'دورة "المحاسبة"' },
        category: {
          name: 'Fallback category',
          nameTranslations: { ar: 'المالية' },
        },
        status: 'PUBLISHED',
        engagedLearners: 4,
        completions: 2,
        quizAttempts: 3,
        quizPasses: 2,
        quizPassRate: 67,
        quizAverageScore: 81,
        certificatesIssued: 2,
        latestActivityAt: '2026-09-03T12:00:00.000Z',
      },
    ]);

    expect(value.startsWith('\uFEFF')).toBe(true);
    expect(value).toContain('الدورة');
    expect(value).toContain('دورة ""المحاسبة""');
    expect(value).toContain('المالية');
  });
});

it('protects spreadsheet formula prefixes even after leading whitespace', () => {
  for (const value of [
    '+SUM(A1:A2)',
    '-1+2',
    '@SUM(A1:A2)',
    '\t=cmd',
    '\r+cmd',
    '   -cmd',
  ]) {
    expect(protectTrainingReportCsvCell(value)).toBe(`'${value}`);
  }
});
