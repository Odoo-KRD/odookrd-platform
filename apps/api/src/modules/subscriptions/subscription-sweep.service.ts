import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SubscriptionReminderService } from './subscription-reminder.service';
import { planSweepToCurrent, type SweepCandidate } from './subscription-sweep';
import {
  DEFAULT_PLATFORM_TIMEZONE,
  assertSupportedTimeZone,
} from './subscription-timezone';

export interface SweepOutcome {
  skipped: boolean;
  examined: number;
  renewed: number;
  statusChanged: number;
  remindersSent: number;
}

/** Namespaced constant so the lock cannot collide with another advisory lock. */
const SWEEP_LOCK_KEY = 8_472_301_996_001n;

@Injectable()
export class SubscriptionSweepService {
  private readonly logger = new Logger(SubscriptionSweepService.name);
  private readonly timeZone: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reminders: SubscriptionReminderService,
    configService: ConfigService,
  ) {
    this.timeZone =
      configService.get<string>('PLATFORM_TIMEZONE') ??
      DEFAULT_PLATFORM_TIMEZONE;

    assertSupportedTimeZone(this.timeZone);
  }

  /**
   * Advances every lapsed subscription to its correct state.
   *
   * Enforcement does not depend on this running: the entitlement resolver
   * derives access from period dates, so a missed sweep leaves stale labels
   * rather than free access. The sweep exists to keep reporting honest and to
   * apply auto-renewals.
   */
  async sweep(now: Date = new Date()): Promise<SweepOutcome> {
    const locked = await this.acquireLock();

    if (!locked) {
      // Another API instance is already sweeping. Skipping is correct.
      return {
        skipped: true,
        examined: 0,
        renewed: 0,
        statusChanged: 0,
        remindersSent: 0,
      };
    }

    try {
      return await this.runSweep(now);
    } finally {
      await this.releaseLock();
    }
  }

  private async runSweep(now: Date): Promise<SweepOutcome> {
    const due = await this.prisma.subscription.findMany({
      where: {
        status: { in: ['TRIAL', 'ACTIVE', 'GRACE'] },
        currentPeriodEnd: { lte: now },
      },
      select: {
        id: true,
        term: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        gracePeriodDays: true,
        autoRenew: true,
        cancelAtPeriodEnd: true,
        periods: {
          select: { sequence: true },
          orderBy: { sequence: 'desc' },
          take: 1,
        },
      },
      take: 500,
    });

    let renewed = 0;
    let statusChanged = 0;

    for (const row of due) {
      const candidate: SweepCandidate = {
        id: row.id,
        term: row.term,
        status: row.status,
        currentPeriodStart: row.currentPeriodStart,
        currentPeriodEnd: row.currentPeriodEnd,
        gracePeriodDays: row.gracePeriodDays,
        autoRenew: row.autoRenew,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        currentSequence: row.periods[0]?.sequence ?? 0,
      };

      const action = planSweepToCurrent(candidate, now, this.timeZone);

      if (action.kind === 'NONE') {
        continue;
      }

      try {
        if (action.kind === 'RENEW') {
          await this.prisma.$transaction([
            this.prisma.subscription.update({
              where: { id: row.id },
              data: {
                status: 'ACTIVE',
                currentPeriodStart: action.periodStart,
                currentPeriodEnd: action.periodEnd,
              },
            }),
            this.prisma.subscriptionPeriod.create({
              data: {
                subscriptionId: row.id,
                sequence: action.sequence,
                term: row.term,
                startsAt: action.periodStart,
                endsAt: action.periodEnd,
                source: 'AUTO_RENEWAL',
              },
            }),
          ]);
          renewed += 1;
        } else {
          await this.prisma.subscription.update({
            where: { id: row.id },
            data: { status: action.status },
          });
          statusChanged += 1;
        }
      } catch {
        // One bad row must not abort the sweep for everyone else.
        this.logger.error(`Subscription sweep failed for ${row.id}.`);
      }
    }

    // Reminders run after renewals so an auto-renewed subscription is already
    // on its new period and does not warn anyone about the old one.
    let remindersSent = 0;

    try {
      const outcome = await this.reminders.run(now);
      remindersSent = outcome.sent;
    } catch {
      this.logger.error('Subscription reminder pass failed.');
    }

    return {
      skipped: false,
      examined: due.length,
      renewed,
      statusChanged,
      remindersSent,
    };
  }

  private async acquireLock(): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<
      Array<{ locked: boolean }>
    >`SELECT pg_try_advisory_lock(${SWEEP_LOCK_KEY}::bigint) AS "locked"`;

    return rows[0]?.locked === true;
  }

  private async releaseLock(): Promise<void> {
    try {
      await this.prisma
        .$queryRaw`SELECT pg_advisory_unlock(${SWEEP_LOCK_KEY}::bigint)`;
    } catch {
      // The lock is session-scoped and clears on disconnect, so a failed
      // unlock is not worth failing the sweep over.
      this.logger.warn('Failed to release the subscription sweep lock.');
    }
  }
}
