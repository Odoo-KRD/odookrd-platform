import type { ConfigService } from '@nestjs/config';

import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { SubscriptionReminderService } from './subscription-reminder.service';
import { SubscriptionSweepService } from './subscription-sweep.service';

const at = (iso: string): Date => new Date(iso);
const NOW = at('2026-03-15T12:00:00.000Z');

interface DueRow {
  id: string;
  term: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  gracePeriodDays: number;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  periods: Array<{ sequence: number }>;
}

function dueRow(overrides: Partial<DueRow> = {}): DueRow {
  return {
    id: 'subscription-id',
    term: 'MONTHLY',
    status: 'ACTIVE',
    currentPeriodStart: at('2026-02-01T00:00:00.000Z'),
    currentPeriodEnd: at('2026-03-01T00:00:00.000Z'),
    gracePeriodDays: 0,
    autoRenew: false,
    cancelAtPeriodEnd: false,
    periods: [{ sequence: 1 }],
    ...overrides,
  };
}

function harness(options: { rows?: DueRow[]; locked?: boolean } = {}) {
  const rawCalls: string[] = [];
  const updates: Array<Record<string, unknown>> = [];
  const createdPeriods: Array<Record<string, unknown>> = [];
  let transactions = 0;

  const update = jest.fn((args: { data: Record<string, unknown> }) => {
    updates.push(args.data);
    return Promise.resolve({});
  });

  const create = jest.fn((args: { data: Record<string, unknown> }) => {
    createdPeriods.push(args.data);
    return Promise.resolve({});
  });

  const findMany = jest.fn().mockResolvedValue(options.rows ?? []);
  const remindersRun = jest.fn().mockResolvedValue({ examined: 0, sent: 0 });

  const prisma = {
    $queryRaw: jest.fn((strings: unknown) => {
      const text = Array.isArray(strings) ? strings.join('?') : String(strings);
      rawCalls.push(text);

      return Promise.resolve(
        text.includes('pg_try_advisory_lock')
          ? [{ locked: options.locked ?? true }]
          : [{}],
      );
    }),
    $transaction: jest.fn((operations: Array<Promise<unknown>>) => {
      transactions += 1;
      return Promise.all(operations);
    }),
    subscription: { findMany, update },
    subscriptionPeriod: { create },
  } as unknown as PrismaService;

  const reminders = {
    run: remindersRun,
  } as unknown as SubscriptionReminderService;

  const config = {
    get: jest.fn().mockReturnValue('Asia/Baghdad'),
  } as unknown as ConfigService;

  return {
    service: new SubscriptionSweepService(prisma, reminders, config),
    findMany,
    update,
    remindersRun,
    rawCalls: (): string[] => rawCalls,
    updates: (): Array<Record<string, unknown>> => updates,
    createdPeriods: (): Array<Record<string, unknown>> => createdPeriods,
    transactions: (): number => transactions,
  };
}

describe('SubscriptionSweepService locking', () => {
  it('skips entirely when another instance holds the lock', async () => {
    const { service, findMany } = harness({ locked: false, rows: [dueRow()] });

    const outcome = await service.sweep(NOW);

    expect(outcome.skipped).toBe(true);
    expect(outcome.examined).toBe(0);
    // The candidate query must not run when the lock was refused.
    expect(findMany).not.toHaveBeenCalled();
  });

  it('takes and releases the advisory lock around the sweep', async () => {
    const { service, rawCalls } = harness();

    await service.sweep(NOW);

    expect(
      rawCalls().some((call) => call.includes('pg_try_advisory_lock')),
    ).toBe(true);
    expect(rawCalls().some((call) => call.includes('pg_advisory_unlock'))).toBe(
      true,
    );
  });

  it('releases the lock even when the sweep throws', async () => {
    const { service, findMany, rawCalls } = harness();

    findMany.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(service.sweep(NOW)).rejects.toThrow('database unavailable');

    expect(rawCalls().some((call) => call.includes('pg_advisory_unlock'))).toBe(
      true,
    );
  });
});

describe('SubscriptionSweepService reconciliation', () => {
  it('expires a lapsed subscription', async () => {
    const { service, updates } = harness({ rows: [dueRow()] });

    const outcome = await service.sweep(NOW);

    expect(outcome.statusChanged).toBe(1);
    expect(outcome.renewed).toBe(0);
    expect(updates()).toEqual([{ status: 'EXPIRED' }]);
  });

  it('moves a subscription with grace remaining into GRACE', async () => {
    const { service, updates } = harness({
      rows: [
        dueRow({
          currentPeriodEnd: at('2026-03-14T00:00:00.000Z'),
          gracePeriodDays: 7,
        }),
      ],
    });

    await service.sweep(NOW);

    expect(updates()).toEqual([{ status: 'GRACE' }]);
  });

  it('renews an auto-renewing subscription and records the new period', async () => {
    const { service, createdPeriods, transactions } = harness({
      rows: [dueRow({ autoRenew: true })],
    });

    const outcome = await service.sweep(NOW);

    expect(outcome.renewed).toBe(1);
    expect(transactions()).toBe(1);
    expect(createdPeriods()).toHaveLength(1);
    expect(createdPeriods()[0]).toMatchObject({
      subscriptionId: 'subscription-id',
      sequence: 2,
      source: 'AUTO_RENEWAL',
    });
  });

  it('leaves a subscription that is still current alone', async () => {
    const { service, updates } = harness({
      rows: [dueRow({ currentPeriodEnd: at('2026-04-01T00:00:00.000Z') })],
    });

    const outcome = await service.sweep(NOW);

    expect(outcome.statusChanged).toBe(0);
    expect(updates()).toEqual([]);
  });

  it('keeps going when one subscription fails', async () => {
    const { service, update } = harness({
      rows: [dueRow({ id: 'bad' }), dueRow({ id: 'good' })],
    });

    update
      .mockRejectedValueOnce(new Error('constraint violation'))
      .mockResolvedValueOnce({});

    const outcome = await service.sweep(NOW);

    // The first row failed, the second still went through.
    expect(outcome.statusChanged).toBe(1);
    expect(outcome.examined).toBe(2);
  });
});

describe('SubscriptionSweepService reminders', () => {
  it('runs the reminder pass and reports what it sent', async () => {
    const { service, remindersRun } = harness();

    remindersRun.mockResolvedValue({ examined: 3, sent: 2 });

    const outcome = await service.sweep(NOW);

    expect(outcome.remindersSent).toBe(2);
  });

  it('completes the sweep even when the reminder pass fails', async () => {
    const { service, remindersRun } = harness({ rows: [dueRow()] });

    remindersRun.mockRejectedValue(new Error('smtp unavailable'));

    const outcome = await service.sweep(NOW);

    expect(outcome.skipped).toBe(false);
    expect(outcome.statusChanged).toBe(1);
    expect(outcome.remindersSent).toBe(0);
  });
});
