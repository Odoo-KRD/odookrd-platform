import type { ConfigService } from '@nestjs/config';

import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionReminderService } from './subscription-reminder.service';

const at = (iso: string): Date => new Date(iso);
const NOW = at('2026-03-15T12:00:00.000Z');

interface CandidateRow {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  gracePeriodDays: number;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  companyService: {
    companyId: string;
    displayName: string | null;
    service: { name: string };
  };
  reminders: Array<{ milestone: string; periodEnd: Date }>;
}

function candidate(overrides: Partial<CandidateRow> = {}): CandidateRow {
  return {
    id: 'subscription-id',
    status: 'ACTIVE',
    currentPeriodStart: at('2026-01-01T00:00:00.000Z'),
    // Seven days out, so the T_MINUS_7 milestone is due.
    currentPeriodEnd: at('2026-03-20T00:00:00.000Z'),
    gracePeriodDays: 0,
    autoRenew: false,
    cancelAtPeriodEnd: false,
    companyService: {
      companyId: 'company-id',
      displayName: 'Managed Hosting',
      service: { name: 'Hosting' },
    },
    reminders: [],
    ...overrides,
  };
}

function harness(
  options: { rows?: CandidateRow[]; recipients?: Array<{ id: string }> } = {},
) {
  const recorded: Array<Record<string, unknown>> = [];

  const prisma = {
    subscription: {
      findMany: jest.fn().mockResolvedValue(options.rows ?? []),
    },
    user: {
      findMany: jest
        .fn()
        .mockResolvedValue(options.recipients ?? [{ id: 'user-id' }]),
    },
    subscriptionReminder: {
      createMany: jest.fn((args: { data: Array<Record<string, unknown>> }) => {
        recorded.push(...args.data);
        return Promise.resolve({ count: args.data.length });
      }),
    },
  } as unknown as PrismaService;

  // Captured here rather than read back off mock.calls, which is typed as any.
  const published: Array<{ idempotencyKey: string }> = [];

  const publish = jest.fn((input: { idempotencyKey: string }) => {
    published.push(input);
    return Promise.resolve({ id: 'notification-id', created: true });
  });

  const notifications = { publish } as unknown as NotificationsService;

  const config = {
    get: jest.fn().mockReturnValue('Asia/Baghdad'),
  } as unknown as ConfigService;

  return {
    service: new SubscriptionReminderService(prisma, notifications, config),
    publish,
    recorded: (): Array<Record<string, unknown>> => recorded,
    published: (): Array<{ idempotencyKey: string }> => published,
  };
}

describe('SubscriptionReminderService', () => {
  it('sends the due milestone and records it', async () => {
    const { service, publish, recorded } = harness({
      rows: [candidate()],
    });

    const outcome = await service.run(NOW);

    expect(outcome.sent).toBe(1);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(recorded().some((row) => row.milestone === 'T_MINUS_7')).toBe(true);
  });

  it('records the wider countdowns as superseded', async () => {
    // Otherwise a subscription created inside the window would trickle out the
    // 30 and 14 day warnings after the 7 day one.
    const { service, recorded } = harness({ rows: [candidate()] });

    await service.run(NOW);

    const milestones = recorded().map((row) => row.milestone);

    expect(milestones).toContain('T_MINUS_30');
    expect(milestones).toContain('T_MINUS_14');
  });

  it('does not resend a milestone already recorded for this period', async () => {
    const { service, publish } = harness({
      rows: [
        candidate({
          reminders: [
            {
              milestone: 'T_MINUS_7',
              periodEnd: at('2026-03-20T00:00:00.000Z'),
            },
          ],
        }),
      ],
    });

    const outcome = await service.run(NOW);

    expect(outcome.sent).toBe(0);
    expect(publish).not.toHaveBeenCalled();
  });

  it('re-arms after a renewal, since the period end differs', async () => {
    const { service, publish } = harness({
      rows: [
        candidate({
          // Recorded against the previous period, so it must not suppress the
          // reminder for the current one.
          reminders: [
            {
              milestone: 'T_MINUS_7',
              periodEnd: at('2026-01-20T00:00:00.000Z'),
            },
          ],
        }),
      ],
    });

    await service.run(NOW);

    expect(publish).toHaveBeenCalledTimes(1);
  });

  it('stays silent for an auto-renewing subscription', async () => {
    const { service, publish } = harness({
      rows: [candidate({ autoRenew: true })],
    });

    const outcome = await service.run(NOW);

    expect(outcome.sent).toBe(0);
    expect(publish).not.toHaveBeenCalled();
  });

  it('still warns an auto-renewing subscription set to cancel at period end', async () => {
    const { service, publish } = harness({
      rows: [candidate({ autoRenew: true, cancelAtPeriodEnd: true })],
    });

    await service.run(NOW);

    expect(publish).toHaveBeenCalledTimes(1);
  });

  it('records the milestone even when nobody is eligible to receive it', async () => {
    // Otherwise the same fruitless lookup repeats on every sweep.
    const { service, publish, recorded } = harness({
      rows: [candidate()],
      recipients: [],
    });

    await service.run(NOW);

    expect(publish).not.toHaveBeenCalled();
    expect(recorded().some((row) => row.milestone === 'T_MINUS_7')).toBe(true);
  });

  it('keeps going when one reminder fails to send', async () => {
    const { service, publish } = harness({
      rows: [candidate({ id: 'bad' }), candidate({ id: 'good' })],
    });

    publish
      .mockRejectedValueOnce(new Error('smtp unavailable'))
      .mockResolvedValueOnce({ id: 'notification-id', created: true });

    const outcome = await service.run(NOW);

    expect(outcome.sent).toBe(1);
    expect(outcome.examined).toBe(2);
  });

  it('uses an idempotency key scoped to the subscription, milestone and period', async () => {
    const { service, published } = harness({ rows: [candidate()] });

    await service.run(NOW);

    expect(published()[0].idempotencyKey).toBe(
      'subscription:subscription-id:T_MINUS_7:2026-03-20T00:00:00.000Z',
    );
  });
});
