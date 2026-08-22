import { Injectable } from '@nestjs/common';

import {
  NotificationChannel,
  NotificationDeliveryStatus,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { NotificationProviderError } from './notification-provider.error';
import { EmailProviderService } from './providers/email-provider.service';
import { WhatsAppProviderService } from './providers/whatsapp-provider.service';

const deliverySelect = {
  id: true,
  recipientId: true,
  channel: true,
  status: true,
  destination: true,
  attemptCount: true,
  maxAttempts: true,
  nextAttemptAt: true,
  recipient: {
    select: {
      companyId: true,
      title: true,
      body: true,
      notification: { select: { id: true } },
    },
  },
} satisfies Prisma.NotificationDeliverySelect;

type DeliveryRecord = Prisma.NotificationDeliveryGetPayload<{
  select: typeof deliverySelect;
}>;

@Injectable()
export class NotificationDispatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailProviderService,
    private readonly whatsapp: WhatsAppProviderService,
  ) {}

  async dispatchNotification(notificationId: string): Promise<void> {
    const now = new Date();
    const deliveries = await this.prisma.notificationDelivery.findMany({
      where: {
        recipient: { notificationId },
        OR: [
          { status: NotificationDeliveryStatus.PENDING },
          {
            status: NotificationDeliveryStatus.FAILED,
            nextAttemptAt: { lte: now },
          },
        ],
      },
      select: { id: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    for (const delivery of deliveries) {
      await this.dispatchDelivery(delivery.id);
    }
  }

  async dispatchDue(limit: number = 25): Promise<void> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - 5 * 60_000);

    await this.prisma.notificationDelivery.updateMany({
      where: {
        status: NotificationDeliveryStatus.PROCESSING,
        lastAttemptAt: { lt: staleBefore },
      },
      data: {
        status: NotificationDeliveryStatus.FAILED,
        nextAttemptAt: null,
        failureCode: 'DELIVERY_STATE_UNCERTAIN',
        failureMessage: 'Delivery state is uncertain and requires review.',
      },
    });

    const due = await this.prisma.notificationDelivery.findMany({
      where: {
        OR: [
          { status: NotificationDeliveryStatus.PENDING },
          {
            status: NotificationDeliveryStatus.FAILED,
            nextAttemptAt: { lte: now },
          },
        ],
      },
      select: { id: true },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      take: Math.min(Math.max(limit, 1), 100),
    });

    for (const delivery of due) {
      await this.dispatchDelivery(delivery.id);
    }
  }

  private async dispatchDelivery(deliveryId: string): Promise<void> {
    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
      select: deliverySelect,
    });

    if (!delivery || !this.isDue(delivery)) {
      return;
    }

    if (delivery.attemptCount >= delivery.maxAttempts) {
      return;
    }

    const claimedAt = new Date();
    const claim = await this.prisma.notificationDelivery.updateMany({
      where: {
        id: delivery.id,
        status: delivery.status,
        attemptCount: delivery.attemptCount,
      },
      data: {
        status: NotificationDeliveryStatus.PROCESSING,
        attemptCount: { increment: 1 },
        lastAttemptAt: claimedAt,
        failureCode: null,
        failureMessage: null,
      },
    });

    if (claim.count !== 1) {
      return;
    }

    const currentAttempt = delivery.attemptCount + 1;

    try {
      const providerMessageId = await this.send(delivery);
      await this.prisma.$transaction(async (transaction) => {
        await transaction.notificationDelivery.updateMany({
          where: {
            id: delivery.id,
            status: NotificationDeliveryStatus.PROCESSING,
          },
          data: {
            status: NotificationDeliveryStatus.SENT,
            providerMessageId,
            sentAt: new Date(),
            nextAttemptAt: null,
          },
        });
        await transaction.auditLog.create({
          data: {
            companyId: delivery.recipient.companyId,
            action: 'notification.delivery.sent',
            targetType: 'notification_delivery',
            targetId: delivery.id,
            metadata: { channel: delivery.channel },
          },
        });
      });
    } catch (error: unknown) {
      const providerError =
        error instanceof NotificationProviderError
          ? error
          : new NotificationProviderError('DELIVERY_INTERNAL_FAILURE', false);
      const canRetry =
        providerError.retryable && currentAttempt < delivery.maxAttempts;
      const nextAttemptAt = canRetry
        ? new Date(Date.now() + this.retryDelayMilliseconds(currentAttempt))
        : null;

      await this.prisma.$transaction(async (transaction) => {
        await transaction.notificationDelivery.updateMany({
          where: {
            id: delivery.id,
            status: NotificationDeliveryStatus.PROCESSING,
          },
          data: {
            status: NotificationDeliveryStatus.FAILED,
            nextAttemptAt,
            failureCode: this.safeFailureCode(providerError.code),
            failureMessage: providerError.message,
          },
        });
        await transaction.auditLog.create({
          data: {
            companyId: delivery.recipient.companyId,
            action: 'notification.delivery.failed',
            targetType: 'notification_delivery',
            targetId: delivery.id,
            metadata: {
              channel: delivery.channel,
              failureCode: this.safeFailureCode(providerError.code),
              retryScheduled: nextAttemptAt !== null,
            },
          },
        });
      });
    }
  }

  private async send(delivery: DeliveryRecord): Promise<string | null> {
    if (!delivery.destination) {
      throw new NotificationProviderError(
        'DESTINATION_MISSING',
        false,
        'Notification destination is unavailable.',
      );
    }

    if (delivery.channel === NotificationChannel.EMAIL) {
      return this.email.send(
        delivery.recipient.companyId,
        delivery.destination,
        delivery.recipient.title,
        delivery.recipient.body,
      );
    }

    if (delivery.channel === NotificationChannel.WHATSAPP) {
      return this.whatsapp.send(
        delivery.recipient.companyId,
        delivery.destination,
        delivery.recipient.body,
      );
    }

    throw new NotificationProviderError('CHANNEL_NOT_DISPATCHABLE', false);
  }

  private isDue(delivery: DeliveryRecord): boolean {
    if (delivery.status === NotificationDeliveryStatus.PENDING) {
      return true;
    }

    return (
      delivery.status === NotificationDeliveryStatus.FAILED &&
      delivery.nextAttemptAt !== null &&
      delivery.nextAttemptAt.getTime() <= Date.now()
    );
  }

  private retryDelayMilliseconds(attempt: number): number {
    const seconds = Math.min(60 * 2 ** Math.max(attempt - 1, 0), 3600);
    return seconds * 1000;
  }

  private safeFailureCode(code: string): string {
    const normalized = code
      .toUpperCase()
      .replace(/[^A-Z0-9_]/gu, '_')
      .slice(0, 80);
    return normalized || 'DELIVERY_FAILED';
  }
}
