import { Injectable, Logger } from '@nestjs/common';

import {
  AccountScope,
  NotificationChannel,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PERMISSIONS } from '../authorization/permissions';
import type {
  NotificationTemplateKey,
  NotificationTemplateVariablesByKey,
} from '../notifications/notification-template.service';
import {
  NotificationsService,
  type PublishRecipient,
} from '../notifications/notifications.service';

/** publish() accepts at most 100 recipients per notification. */
const MAX_STAFF_RECIPIENTS = 100;

/**
 * Recipients have no stored language preference yet, so notifications render
 * in the platform default, exactly like the other admin events.
 */
const DEFAULT_LOCALE = 'ku' as const;

interface TicketFacts {
  id: string;
  reference: string;
  subject: string;
  companyId: string;
  createdByUserId: string;
  assigneeUserId: string | null;
  company: { name: string };
}

/**
 * Helpdesk notifications.
 *
 * Customer events (a public staff reply, a resolution) go to the customer who
 * opened the ticket, in-app and by email. Staff events (a new ticket, a
 * customer reply) go to the assignee when there is one, otherwise to every
 * active staff member holding helpdesk.manage, in-app only.
 *
 * Every method is called after the triggering transaction has committed and
 * never throws: a failed notification must not undo a reply or a ticket.
 * Internal notes are never passed to this service, so they cannot notify a
 * customer.
 */
@Injectable()
export class HelpdeskNotificationService {
  private readonly logger = new Logger(HelpdeskNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Staff: a customer opened a ticket. */
  async ticketCreated(ticketId: string): Promise<void> {
    await this.toStaff(ticketId, 'admin.helpdesk.ticket.created', (ticket) => ({
      key: `helpdesk:ticket.created:${ticket.id}`,
    }));
  }

  /** Staff: a customer replied. Keyed by message, so each reply notifies once. */
  async customerReplied(ticketId: string, messageId: string): Promise<void> {
    await this.toStaff(ticketId, 'admin.helpdesk.customer.replied', () => ({
      key: `helpdesk:customer.replied:${messageId}`,
    }));
  }

  /** Customer: support posted a public reply. */
  async staffReplied(ticketId: string, messageId: string): Promise<void> {
    await this.toCustomer(
      ticketId,
      'helpdesk.ticket.replied',
      `helpdesk:ticket.replied:${messageId}`,
    );
  }

  /**
   * Customer: the ticket was resolved. The key includes the resolution time,
   * because a reopened ticket can be resolved again and should notify again.
   */
  async ticketResolved(ticketId: string, resolvedAt: Date): Promise<void> {
    await this.toCustomer(
      ticketId,
      'helpdesk.ticket.resolved',
      `helpdesk:ticket.resolved:${ticketId}:${resolvedAt.toISOString()}`,
    );
  }

  private async toCustomer(
    ticketId: string,
    templateKey: 'helpdesk.ticket.replied' | 'helpdesk.ticket.resolved',
    idempotencyKey: string,
  ): Promise<void> {
    try {
      const ticket = await this.ticketFacts(ticketId);
      if (!ticket) return;

      const customer = await this.prisma.user.findFirst({
        where: {
          id: ticket.createdByUserId,
          status: UserStatus.ACTIVE,
          accountScope: AccountScope.COMPANY,
          companyId: ticket.companyId,
        },
        select: { id: true },
      });
      if (!customer) return;

      await this.notifications.publish({
        companyId: ticket.companyId,
        idempotencyKey,
        templateKey,
        variables: { reference: ticket.reference, subject: ticket.subject },
        recipients: [{ userId: customer.id, locale: DEFAULT_LOCALE }],
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        actionUrl: `/dashboard/helpdesk/${ticket.id}`,
        dispatchImmediately: true,
      });
    } catch (error: unknown) {
      this.warn(idempotencyKey, error);
    }
  }

  private async toStaff<
    K extends
      'admin.helpdesk.ticket.created' | 'admin.helpdesk.customer.replied',
  >(
    ticketId: string,
    templateKey: K,
    identity: (ticket: TicketFacts) => { key: string },
  ): Promise<void> {
    let idempotencyKey = `helpdesk:${templateKey}:${ticketId}`;

    try {
      const ticket = await this.ticketFacts(ticketId);
      if (!ticket) return;

      idempotencyKey = identity(ticket).key;
      const recipients = await this.staffRecipients(ticket.assigneeUserId);
      if (recipients.length === 0) return;

      const variables: NotificationTemplateVariablesByKey[K] = {
        reference: ticket.reference,
        subject: ticket.subject,
        companyName: ticket.company.name,
      };

      await this.notifications.publish<NotificationTemplateKey>({
        companyId: ticket.companyId,
        idempotencyKey,
        templateKey,
        variables,
        recipients,
        channels: [NotificationChannel.IN_APP],
        actionUrl: `/admin/helpdesk/${ticket.id}`,
        allowPlatformRecipients: true,
        dispatchImmediately: true,
      });
    } catch (error: unknown) {
      this.warn(idempotencyKey, error);
    }
  }

  /**
   * The assignee when the ticket has one and they are still active staff;
   * otherwise every active platform user holding helpdesk.manage.
   */
  private async staffRecipients(
    assigneeUserId: string | null,
  ): Promise<PublishRecipient[]> {
    const staffWhere = {
      accountScope: AccountScope.PLATFORM,
      status: UserStatus.ACTIVE,
      userRoles: {
        some: {
          role: {
            rolePermissions: {
              some: { permission: { key: PERMISSIONS.HELPDESK_MANAGE } },
            },
          },
        },
      },
    };

    if (assigneeUserId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: assigneeUserId, ...staffWhere },
        select: { id: true },
      });

      if (assignee) {
        return [{ userId: assignee.id, locale: DEFAULT_LOCALE }];
      }
    }

    const staff = await this.prisma.user.findMany({
      where: staffWhere,
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: MAX_STAFF_RECIPIENTS,
    });

    return staff.map((user) => ({ userId: user.id, locale: DEFAULT_LOCALE }));
  }

  private ticketFacts(ticketId: string): Promise<TicketFacts | null> {
    return this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        reference: true,
        subject: true,
        companyId: true,
        createdByUserId: true,
        assigneeUserId: true,
        company: { select: { name: true } },
      },
    });
  }

  private warn(idempotencyKey: string, error: unknown): void {
    this.logger.warn(
      `Helpdesk notification failed (${idempotencyKey}): ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    );
  }
}
