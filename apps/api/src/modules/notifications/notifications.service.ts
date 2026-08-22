import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccountScope,
  NotificationChannel,
  NotificationDeliveryStatus,
  Prisma,
  UserStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { ApiLocale } from '../../i18n/types';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { SettingsService } from '../settings/settings.service';
import type { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import {
  NotificationTemplateService,
  type NotificationTemplateKey,
  type NotificationTemplateVariablesByKey,
} from './notification-template.service';

const recipientInboxSelect = {
  id: true,
  title: true,
  body: true,
  readAt: true,
  createdAt: true,
  notification: {
    select: {
      templateKey: true,
      actionUrl: true,
    },
  },
  deliveries: {
    select: {
      channel: true,
      status: true,
      attemptCount: true,
      sentAt: true,
    },
    orderBy: { channel: 'asc' },
  },
} satisfies Prisma.NotificationRecipientSelect;

export interface PublishRecipient {
  userId: string;
  locale?: ApiLocale;
  whatsappAddress?: string | null;
}

export interface PublishNotificationInput<K extends NotificationTemplateKey> {
  companyId: string;
  idempotencyKey: string;
  templateKey: K;
  variables: NotificationTemplateVariablesByKey[K];
  recipients: readonly PublishRecipient[];
  channels?: readonly NotificationChannel[];
  actionUrl?: string | null;
  actorUserId?: string;
  dispatchImmediately?: boolean;
}

export interface PublishNotificationResult {
  id: string;
  created: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly templates: NotificationTemplateService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  async list(principal: AuthenticatedPrincipal, query: ListNotificationsDto) {
    const companyId = this.requireCompany(principal);
    const where: Prisma.NotificationRecipientWhereInput = {
      companyId,
      userId: principal.userId,
      deliveries: {
        some: {
          channel: NotificationChannel.IN_APP,
          status: NotificationDeliveryStatus.SENT,
        },
      },
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.notificationRecipient.findMany({
        where,
        select: recipientInboxSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.notificationRecipient.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        id: record.id,
        templateKey: record.notification.templateKey,
        title: record.title,
        body: record.body,
        actionUrl: record.notification.actionUrl,
        readAt: record.readAt,
        createdAt: record.createdAt,
        deliveries: record.deliveries,
      })),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async unreadCount(
    principal: AuthenticatedPrincipal,
  ): Promise<{ unread: number }> {
    const companyId = this.requireCompany(principal);
    const unread = await this.prisma.notificationRecipient.count({
      where: {
        companyId,
        userId: principal.userId,
        readAt: null,
        deliveries: {
          some: {
            channel: NotificationChannel.IN_APP,
            status: NotificationDeliveryStatus.SENT,
          },
        },
      },
    });

    return { unread };
  }

  async markRead(
    principal: AuthenticatedPrincipal,
    recipientId: string,
  ): Promise<{ readAt: Date }> {
    const companyId = this.requireCompany(principal);

    return this.prisma.$transaction(async (transaction) => {
      const recipient = await transaction.notificationRecipient.findFirst({
        where: {
          id: recipientId,
          companyId,
          userId: principal.userId,
          deliveries: {
            some: {
              channel: NotificationChannel.IN_APP,
              status: NotificationDeliveryStatus.SENT,
            },
          },
        },
        select: { id: true, readAt: true },
      });

      if (!recipient) {
        throw new NotFoundException('Notification was not found.');
      }

      const readAt = recipient.readAt ?? new Date();
      if (!recipient.readAt) {
        await transaction.notificationRecipient.updateMany({
          where: {
            id: recipient.id,
            companyId,
            userId: principal.userId,
            readAt: null,
          },
          data: { readAt },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            companyId,
            action: 'notification.read',
            targetType: 'notification_recipient',
            targetId: recipient.id,
          },
        });
      }

      return { readAt };
    });
  }

  async markAllRead(
    principal: AuthenticatedPrincipal,
  ): Promise<{ updated: number }> {
    const companyId = this.requireCompany(principal);
    const now = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.notificationRecipient.updateMany({
        where: {
          companyId,
          userId: principal.userId,
          readAt: null,
          deliveries: {
            some: {
              channel: NotificationChannel.IN_APP,
              status: NotificationDeliveryStatus.SENT,
            },
          },
        },
        data: { readAt: now },
      });

      if (updated.count > 0) {
        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            companyId,
            action: 'notification.read_all',
            targetType: 'notification_recipient',
            metadata: { updated: updated.count },
          },
        });
      }

      return { updated: updated.count };
    });
  }

  async publish<K extends NotificationTemplateKey>(
    input: PublishNotificationInput<K>,
  ): Promise<PublishNotificationResult> {
    const idempotencyKey = input.idempotencyKey.trim();
    if (!idempotencyKey || idempotencyKey.length > 200) {
      throw new BadRequestException('Notification idempotency key is invalid.');
    }

    if (input.recipients.length < 1 || input.recipients.length > 100) {
      throw new BadRequestException('Notification recipients are invalid.');
    }

    const recipientIds = input.recipients.map((recipient) => recipient.userId);
    if (new Set(recipientIds).size !== recipientIds.length) {
      throw new BadRequestException('Notification recipients must be unique.');
    }

    const existing = await this.prisma.notification.findUnique({
      where: {
        companyId_idempotencyKey: {
          companyId: input.companyId,
          idempotencyKey,
        },
      },
      select: { id: true },
    });

    if (existing) {
      if (input.dispatchImmediately !== false) {
        await this.dispatcher.dispatchNotification(existing.id);
      }
      return { id: existing.id, created: false };
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: recipientIds },
        companyId: input.companyId,
        accountScope: AccountScope.COMPANY,
        status: UserStatus.ACTIVE,
      },
      select: { id: true, email: true },
    });

    if (users.length !== recipientIds.length) {
      throw new BadRequestException(
        'One or more notification recipients are invalid.',
      );
    }

    const usersById = new Map(users.map((user) => [user.id, user]));
    const channels = this.normalizeChannels(input.channels);
    const [inAppEnabled, emailEnabled, whatsappEnabled] = await Promise.all([
      this.settingBoolean('notifications.in_app.enabled', input.companyId),
      this.settingBoolean('notifications.email.enabled', input.companyId),
      this.settingBoolean('notifications.whatsapp.enabled', input.companyId),
    ]);
    const now = new Date();
    const actionUrl = this.normalizeActionUrl(input.actionUrl);

    let createdId: string;
    try {
      createdId = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.notification.create({
          data: {
            companyId: input.companyId,
            templateKey: input.templateKey,
            idempotencyKey,
            actionUrl,
            recipients: {
              create: input.recipients.map((recipient) => {
                const user = usersById.get(recipient.userId);
                if (!user) {
                  throw new BadRequestException(
                    'Notification recipient is invalid.',
                  );
                }

                const locale = recipient.locale ?? 'ku';
                const rendered = this.templates.render(
                  input.templateKey,
                  locale,
                  input.variables,
                );

                return {
                  companyId: input.companyId,
                  userId: recipient.userId,
                  locale,
                  title: rendered.title,
                  body: rendered.body,
                  deliveries: {
                    create: channels.map((channel) =>
                      this.deliveryCreateData(
                        channel,
                        user.email,
                        recipient.whatsappAddress ?? null,
                        { inAppEnabled, emailEnabled, whatsappEnabled },
                        now,
                      ),
                    ),
                  },
                };
              }),
            },
          },
          select: { id: true },
        });

        await transaction.auditLog.create({
          data: {
            actorUserId: input.actorUserId,
            companyId: input.companyId,
            action: 'notification.created',
            targetType: 'notification',
            targetId: created.id,
            metadata: {
              templateKey: input.templateKey,
              recipientCount: input.recipients.length,
              channels,
            },
          },
        });

        return created.id;
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const concurrent = await this.prisma.notification.findUnique({
          where: {
            companyId_idempotencyKey: {
              companyId: input.companyId,
              idempotencyKey,
            },
          },
          select: { id: true },
        });

        if (concurrent) {
          if (input.dispatchImmediately !== false) {
            await this.dispatcher.dispatchNotification(concurrent.id);
          }
          return { id: concurrent.id, created: false };
        }
      }

      throw error;
    }

    if (input.dispatchImmediately !== false) {
      await this.dispatcher.dispatchNotification(createdId);
    }
    return { id: createdId, created: true };
  }

  private requireCompany(principal: AuthenticatedPrincipal): string {
    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException('A company account is required.');
    }

    return principal.companyId;
  }

  private normalizeChannels(
    requested: readonly NotificationChannel[] | undefined,
  ): NotificationChannel[] {
    const channels = requested ?? [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
      NotificationChannel.WHATSAPP,
    ];
    const unique = [...new Set(channels)];

    if (unique.length < 1 || unique.length > 3) {
      throw new BadRequestException('Notification channels are invalid.');
    }

    return unique;
  }

  private deliveryCreateData(
    channel: NotificationChannel,
    email: string,
    whatsappAddress: string | null,
    enabled: {
      inAppEnabled: boolean;
      emailEnabled: boolean;
      whatsappEnabled: boolean;
    },
    now: Date,
  ): Prisma.NotificationDeliveryCreateWithoutRecipientInput {
    if (channel === NotificationChannel.IN_APP) {
      return enabled.inAppEnabled
        ? {
            channel,
            status: NotificationDeliveryStatus.SENT,
            attemptCount: 0,
            sentAt: now,
          }
        : {
            channel,
            status: NotificationDeliveryStatus.SKIPPED,
            attemptCount: 0,
            failureCode: 'CHANNEL_DISABLED',
            failureMessage: 'This notification channel is disabled.',
          };
    }

    if (channel === NotificationChannel.EMAIL) {
      return enabled.emailEnabled
        ? {
            channel,
            status: NotificationDeliveryStatus.PENDING,
            destination: email,
          }
        : {
            channel,
            status: NotificationDeliveryStatus.SKIPPED,
            failureCode: 'CHANNEL_DISABLED',
            failureMessage: 'This notification channel is disabled.',
          };
    }

    if (!enabled.whatsappEnabled) {
      return {
        channel,
        status: NotificationDeliveryStatus.SKIPPED,
        failureCode: 'CHANNEL_DISABLED',
        failureMessage: 'This notification channel is disabled.',
      };
    }

    const destination = whatsappAddress?.trim();
    return destination
      ? { channel, status: NotificationDeliveryStatus.PENDING, destination }
      : {
          channel,
          status: NotificationDeliveryStatus.SKIPPED,
          failureCode: 'DESTINATION_MISSING',
          failureMessage: 'Notification destination is unavailable.',
        };
  }

  private async settingBoolean(
    key: string,
    companyId: string,
  ): Promise<boolean> {
    const value = await this.settings.resolveValue(key, companyId);
    if (typeof value !== 'boolean') {
      throw new BadRequestException(
        'Notification channel configuration is invalid.',
      );
    }

    return value;
  }

  private normalizeActionUrl(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    if (!normalized) {
      return null;
    }

    if (
      normalized.length > 500 ||
      !normalized.startsWith('/') ||
      normalized.startsWith('//')
    ) {
      throw new BadRequestException(
        'Notification action URL must be an internal path.',
      );
    }

    return normalized;
  }
}
