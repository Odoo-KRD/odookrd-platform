import { Injectable, Logger } from '@nestjs/common';

import {
  AccountScope,
  NotificationChannel,
  UserStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { ApiLocale } from '../../i18n/types';
import { NotificationsService } from './notifications.service';
import type {
  NotificationTemplateKey,
  NotificationTemplateVariablesByKey,
} from './notification-template.service';

/** publish() accepts at most 100 recipients per notification. */
const MAX_ADMIN_RECIPIENTS = 100;

interface AdminEventInput<K extends NotificationTemplateKey> {
  companyId: string;
  templateKey: K;
  variables: NotificationTemplateVariablesByKey[K];
  /** Stable per event, so a retried flow never notifies twice. */
  idempotencyKey: string;
  actionUrl?: string | null;
}

/**
 * Platform-wide operational notifications: a customer does something, every
 * platform admin hears about it in their inbox.
 *
 * These are in-app only and never throw. A notification failure must not roll
 * back the customer action that triggered it.
 */
@Injectable()
export class AdminEventNotificationService {
  private readonly logger = new Logger(AdminEventNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async invitationAccepted(input: {
    companyId: string;
    userId: string;
    companyName?: string | null;
    userName?: string | null;
  }): Promise<void> {
    await this.publish({
      companyId: input.companyId,
      templateKey: 'admin.invitation.accepted',
      variables: {
        companyName: input.companyName ?? undefined,
        userName: input.userName ?? undefined,
      },
      idempotencyKey: `admin:invitation.accepted:${input.userId}`,
      actionUrl: `/admin/users/${input.userId}`,
    });
  }

  async courseCompleted(input: {
    companyId: string;
    completionId: string;
    companyName?: string | null;
    learnerName?: string | null;
    courseTitle?: string | null;
  }): Promise<void> {
    await this.publish({
      companyId: input.companyId,
      templateKey: 'admin.course.completed',
      variables: {
        companyName: input.companyName ?? undefined,
        learnerName: input.learnerName ?? undefined,
        courseTitle: input.courseTitle ?? undefined,
      },
      idempotencyKey: `admin:course.completed:${input.completionId}`,
      actionUrl: '/admin/training/reports',
    });
  }

  async renewalRequested(input: {
    companyId: string;
    requestId: string;
    companyName?: string | null;
    serviceName?: string | null;
  }): Promise<void> {
    await this.publish({
      companyId: input.companyId,
      templateKey: 'admin.renewal.requested',
      variables: {
        companyName: input.companyName ?? undefined,
        serviceName: input.serviceName ?? undefined,
      },
      idempotencyKey: `admin:renewal.requested:${input.requestId}`,
      actionUrl: '/admin/services/renewals',
    });
  }

  async certificateIssued(input: {
    companyId: string;
    certificateId: string;
    companyName?: string | null;
    learnerName?: string | null;
    courseTitle?: string | null;
  }): Promise<void> {
    await this.publish({
      companyId: input.companyId,
      templateKey: 'admin.certificate.issued',
      variables: {
        companyName: input.companyName ?? undefined,
        learnerName: input.learnerName ?? undefined,
        courseTitle: input.courseTitle ?? undefined,
      },
      idempotencyKey: `admin:certificate.issued:${input.certificateId}`,
      actionUrl: '/admin/training/certificates',
    });
  }

  /**
   * Fires on every unhelpful answer that carries a comment. The idempotency key
   * includes the feedback row's revision, so an edited comment notifies again
   * while a retried request does not.
   */
  async knowledgeArticleMarkedUnhelpful(input: {
    companyId: string;
    feedbackId: string;
    revision: number;
    articleTitle?: string | null;
    comment?: string | null;
    companyName?: string | null;
    articleId: string;
  }): Promise<void> {
    await this.publish({
      companyId: input.companyId,
      templateKey: 'admin.knowledge.feedback',
      variables: {
        articleTitle: input.articleTitle ?? undefined,
        comment: input.comment ?? undefined,
        companyName: input.companyName ?? undefined,
      },
      idempotencyKey: `admin:knowledge.feedback:${input.feedbackId}:${input.revision}`,
      actionUrl: `/admin/knowledge/articles/${input.articleId}`,
    });
  }

  private async publish<K extends NotificationTemplateKey>(
    input: AdminEventInput<K>,
  ): Promise<void> {
    try {
      const admins = await this.platformAdmins();
      if (admins.length === 0) return;

      await this.notifications.publish({
        companyId: input.companyId,
        idempotencyKey: input.idempotencyKey,
        templateKey: input.templateKey,
        variables: input.variables,
        recipients: admins,
        // WhatsApp only goes out when switched on for this type.
        channels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP],
        actionUrl: input.actionUrl ?? null,
        allowPlatformRecipients: true,
        dispatchImmediately: true,
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Admin event notification failed (${input.idempotencyKey}): ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async platformAdmins(): Promise<
    { userId: string; locale: ApiLocale }[]
  > {
    const users = await this.prisma.user.findMany({
      where: {
        accountScope: AccountScope.PLATFORM,
        status: UserStatus.ACTIVE,
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: MAX_ADMIN_RECIPIENTS,
    });

    return users.map((user) => ({ userId: user.id, locale: 'ku' }));
  }
}
