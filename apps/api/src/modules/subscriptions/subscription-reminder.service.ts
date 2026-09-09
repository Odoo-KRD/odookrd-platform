import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AccountScope, UserStatus } from '../../generated/prisma/enums';
import { NotificationsService } from '../notifications/notifications.service';
import {
  dueReminders,
  supersededMilestones,
  type ReminderMilestone,
} from './subscription-reminders';
import {
  DEFAULT_PLATFORM_TIMEZONE,
  assertSupportedTimeZone,
} from './subscription-timezone';

export interface ReminderOutcome {
  examined: number;
  sent: number;
}

/** How far ahead to look. Matches the widest countdown milestone. */
const LOOKAHEAD_DAYS = 31;
const MS_PER_DAY = 86_400_000;

@Injectable()
export class SubscriptionReminderService {
  private readonly logger = new Logger(SubscriptionReminderService.name);
  private readonly timeZone: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    configService: ConfigService,
  ) {
    this.timeZone =
      configService.get<string>('PLATFORM_TIMEZONE') ??
      DEFAULT_PLATFORM_TIMEZONE;

    assertSupportedTimeZone(this.timeZone);
  }

  /**
   * Sends any reminders that have become due.
   *
   * Called from the sweep, which already holds the advisory lock, so this does
   * not take one of its own. Every send is guarded twice: by the reminder rows
   * recorded here, and by the notification idempotency key, so a crash between
   * publishing and recording cannot produce a duplicate email.
   */
  async run(now: Date = new Date()): Promise<ReminderOutcome> {
    const horizon = new Date(now.getTime() + LOOKAHEAD_DAYS * MS_PER_DAY);

    const candidates = await this.prisma.subscription.findMany({
      where: {
        status: { in: ['TRIAL', 'ACTIVE', 'GRACE', 'EXPIRED'] },
        currentPeriodEnd: { lte: horizon },
      },
      select: {
        id: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        gracePeriodDays: true,
        autoRenew: true,
        cancelAtPeriodEnd: true,
        companyService: {
          select: {
            companyId: true,
            displayName: true,
            service: { select: { name: true } },
          },
        },
        reminders: {
          select: { milestone: true, periodEnd: true },
        },
      },
      take: 200,
    });

    let sent = 0;

    for (const candidate of candidates) {
      // A subscription set to renew itself should not warn anyone; the sweep
      // will extend it at period end.
      if (candidate.autoRenew && !candidate.cancelAtPeriodEnd) {
        continue;
      }

      const alreadySent = candidate.reminders
        .filter(
          (reminder) =>
            reminder.periodEnd.getTime() ===
            candidate.currentPeriodEnd.getTime(),
        )
        .map((reminder) => reminder.milestone);

      const due = dueReminders(candidate, alreadySent, now);

      for (const milestone of due) {
        try {
          await this.dispatch(candidate, milestone, now);
          sent += 1;
        } catch {
          // One failure must not stop the rest of the run; the milestone stays
          // unrecorded and will be retried on the next sweep.
          this.logger.error(
            `Failed to send ${milestone} reminder for subscription ${candidate.id}.`,
          );
        }
      }
    }

    return { examined: candidates.length, sent };
  }

  private async dispatch(
    candidate: {
      id: string;
      currentPeriodEnd: Date;
      companyService: {
        companyId: string;
        displayName: string | null;
        service: { name: string };
      };
    },
    milestone: ReminderMilestone,
    now: Date,
  ): Promise<void> {
    const recipients = await this.recipients(
      candidate.companyService.companyId,
    );

    if (recipients.length > 0) {
      const expiresOn = new Intl.DateTimeFormat('en-CA', {
        timeZone: this.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(candidate.currentPeriodEnd);

      await this.notifications.publish({
        companyId: candidate.companyService.companyId,
        idempotencyKey: `subscription:${candidate.id}:${milestone}:${candidate.currentPeriodEnd.toISOString()}`,
        templateKey: 'subscription.reminder',
        variables: {
          serviceName:
            candidate.companyService.displayName ??
            candidate.companyService.service.name,
          milestone,
          expiresOn,
        },
        recipients: recipients.map((recipient) => ({ userId: recipient.id })),
        actionUrl: '/dashboard/services',
      });
    }

    // Recorded even with no recipients, so a company with no active users does
    // not re-trigger the same lookup on every sweep.
    const supersededRows = supersededMilestones(milestone).map(
      (superseded) => ({
        subscriptionId: candidate.id,
        milestone: superseded,
        periodEnd: candidate.currentPeriodEnd,
        sentAt: now,
      }),
    );

    await this.prisma.subscriptionReminder.createMany({
      data: [
        {
          subscriptionId: candidate.id,
          milestone,
          periodEnd: candidate.currentPeriodEnd,
          sentAt: now,
        },
        ...supersededRows,
      ],
      skipDuplicates: true,
    });
  }

  /** Company users who can actually see services, rather than every employee. */
  private recipients(companyId: string) {
    return this.prisma.user.findMany({
      where: {
        companyId,
        accountScope: AccountScope.COMPANY,
        status: UserStatus.ACTIVE,
        userRoles: {
          some: {
            role: {
              rolePermissions: {
                some: { permission: { key: 'services.read' } },
              },
            },
          },
        },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: 100,
    });
  }
}
