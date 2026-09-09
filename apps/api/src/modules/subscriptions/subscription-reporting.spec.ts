import {
  buildRenewalHistoryCsv,
  buildSubscriptionPipelineCsv,
  pipelineBucket,
  protectCsvCell,
  summarisePipeline,
} from './subscription-reporting';

const at = (iso: string): Date => new Date(iso);
const NOW = at('2026-03-15T12:00:00.000Z');

describe('pipelineBucket', () => {
  it.each([
    ['2026-03-01T00:00:00.000Z', 'OVERDUE'],
    ['2026-03-15T12:00:00.000Z', 'OVERDUE'],
    ['2026-03-20T00:00:00.000Z', 'WITHIN_7'],
    ['2026-04-05T00:00:00.000Z', 'WITHIN_30'],
    ['2026-05-05T00:00:00.000Z', 'WITHIN_60'],
    ['2026-06-05T00:00:00.000Z', 'WITHIN_90'],
  ])('places %s in %s', (periodEnd, expected) => {
    expect(pipelineBucket(at(periodEnd), NOW)).toBe(expected);
  });

  it('excludes anything beyond the reporting horizon', () => {
    expect(pipelineBucket(at('2026-12-01T00:00:00.000Z'), NOW)).toBeNull();
  });
});

describe('summarisePipeline', () => {
  const rows = [
    { currentPeriodEnd: at('2026-03-01T00:00:00.000Z'), autoRenew: false },
    { currentPeriodEnd: at('2026-03-20T00:00:00.000Z'), autoRenew: true },
    { currentPeriodEnd: at('2026-04-05T00:00:00.000Z'), autoRenew: false },
    { currentPeriodEnd: at('2026-12-01T00:00:00.000Z'), autoRenew: false },
  ];

  it('drops rows beyond the horizon', () => {
    expect(summarisePipeline(rows, NOW).total).toBe(3);
  });

  it('keeps buckets exclusive so the counts sum to the total', () => {
    const summary = summarisePipeline(rows, NOW);
    const summed = Object.values(summary.counts).reduce(
      (total, count) => total + count,
      0,
    );

    expect(summed).toBe(summary.total);
    expect(summary.counts.WITHIN_30).toBe(1);
    expect(summary.counts.WITHIN_60).toBe(0);
  });

  it('excludes auto-renewing subscriptions from the operator workload', () => {
    const summary = summarisePipeline(rows, NOW);

    expect(summary.autoRenewing).toBe(1);
    expect(summary.needsAttention).toBe(2);
  });

  it('handles an empty set', () => {
    const summary = summarisePipeline([], NOW);

    expect(summary.total).toBe(0);
    expect(summary.needsAttention).toBe(0);
  });
});

describe('CSV rendering', () => {
  it('neutralises spreadsheet formulas', () => {
    expect(protectCsvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(protectCsvCell('  -2+3')).toBe("'  -2+3");
    expect(protectCsvCell('@import')).toBe("'@import");
    expect(protectCsvCell('Acme Ltd')).toBe('Acme Ltd');
  });

  it('writes a BOM, doubles quotes and ends with CRLF', () => {
    const csv = buildSubscriptionPipelineCsv([
      {
        companyName: 'Say "Hi"',
        serviceName: 'Hosting',
        term: 'ANNUAL',
        status: 'ACTIVE',
        periodStart: '2026-01-01',
        periodEnd: '2026-04-01',
        daysRemaining: 17,
        gracePeriodDays: 0,
        autoRenew: true,
        externalBillingRef: null,
      },
    ]);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Say ""Hi"""');
    expect(csv).toContain('"Yes"');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('renders a header row even with no data', () => {
    expect(buildSubscriptionPipelineCsv([])).toContain('"Company"');
    expect(buildRenewalHistoryCsv([])).toContain('"Source"');
  });

  it('renders renewal history rows', () => {
    const csv = buildRenewalHistoryCsv([
      {
        companyName: 'Acme',
        serviceName: 'Hosting',
        sequence: 2,
        term: 'MONTHLY',
        startsAt: '2026-03-01',
        endsAt: '2026-04-01',
        source: 'AUTO_RENEWAL',
        actorEmail: null,
      },
    ]);

    expect(csv).toContain('"AUTO_RENEWAL"');
    // A null actor renders as an empty cell rather than the string "null".
    expect(csv).toContain('""');
  });
});
