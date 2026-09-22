import { NotificationChannel } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { HelpdeskNotificationService } from './helpdesk-notification.service';

const TICKET = {
  id: 'ticket-1',
  reference: 'TKT-2026-00007',
  subject: 'Printer offline',
  companyId: 'company-1',
  createdByUserId: 'customer-1',
  assigneeUserId: null as string | null,
  company: { name: 'Hosta Kurd' },
};

interface PublishArgs {
  recipients: Array<{ userId: string }>;
  channels: NotificationChannel[];
  idempotencyKey: string;
  actionUrl: string;
}

function serviceFor(options: {
  assigneeUserId?: string | null;
  assigneeIsStaff?: boolean;
  staff?: string[];
  publishFails?: boolean;
}) {
  const published: PublishArgs[] = [];

  const prisma = {
    ticket: {
      findUnique: jest.fn().mockResolvedValue({
        ...TICKET,
        assigneeUserId: options.assigneeUserId ?? null,
      }),
    },
    user: {
      findFirst: jest.fn((args: { where: { id: string } }) =>
        Promise.resolve(
          args.where.id === 'customer-1' ||
            (args.where.id === options.assigneeUserId &&
              options.assigneeIsStaff !== false)
            ? { id: args.where.id }
            : null,
        ),
      ),
      findMany: jest
        .fn()
        .mockResolvedValue((options.staff ?? []).map((id) => ({ id }))),
    },
  } as unknown as PrismaService;

  const notifications = {
    publish: jest.fn((args: PublishArgs) => {
      if (options.publishFails) {
        return Promise.reject(new Error('mail server down'));
      }
      published.push(args);
      return Promise.resolve({ id: 'n', created: true });
    }),
  } as unknown as NotificationsService;

  return {
    service: new HelpdeskNotificationService(prisma, notifications),
    published,
  };
}

describe('HelpdeskNotificationService', () => {
  it('notifies every staff member when a new ticket is unassigned', async () => {
    const { service, published } = serviceFor({ staff: ['s1', 's2'] });

    await service.ticketCreated(TICKET.id);

    expect(published[0].recipients.map((r) => r.userId)).toEqual(['s1', 's2']);
    // WhatsApp is requested but only sent when switched on for the type.
    expect(published[0].channels).toEqual([
      NotificationChannel.IN_APP,
      NotificationChannel.WHATSAPP,
    ]);
    expect(published[0].actionUrl).toBe('/admin/helpdesk/ticket-1');
  });

  it('notifies only the assignee once a ticket is assigned', async () => {
    const { service, published } = serviceFor({
      assigneeUserId: 'agent-1',
      staff: ['s1', 's2'],
    });

    await service.customerReplied(TICKET.id, 'message-9');

    expect(published[0].recipients).toEqual([
      { userId: 'agent-1', locale: 'ku' },
    ]);
    expect(published[0].idempotencyKey).toBe(
      'helpdesk:customer.replied:message-9',
    );
  });

  it('falls back to all staff when the assignee is no longer staff', async () => {
    const { service, published } = serviceFor({
      assigneeUserId: 'agent-1',
      assigneeIsStaff: false,
      staff: ['s1'],
    });

    await service.customerReplied(TICKET.id, 'message-9');

    expect(published[0].recipients.map((r) => r.userId)).toEqual(['s1']);
  });

  it('emails and notifies the customer in-app about a staff reply', async () => {
    const { service, published } = serviceFor({});

    await service.staffReplied(TICKET.id, 'message-3');

    expect(published[0].recipients).toEqual([
      { userId: 'customer-1', locale: 'ku' },
    ]);
    expect(published[0].channels).toEqual([
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
      NotificationChannel.WHATSAPP,
    ]);
    expect(published[0].actionUrl).toBe('/dashboard/helpdesk/ticket-1');
  });

  it('keys each resolution separately so a re-resolved ticket notifies again', async () => {
    const { service, published } = serviceFor({});

    await service.ticketResolved(TICKET.id, new Date('2026-09-20T10:00:00Z'));
    await service.ticketResolved(TICKET.id, new Date('2026-09-21T10:00:00Z'));

    expect(published[0].idempotencyKey).not.toBe(published[1].idempotencyKey);
  });

  it('never throws when publishing fails', async () => {
    const { service } = serviceFor({ publishFails: true });

    await expect(
      service.staffReplied(TICKET.id, 'message-3'),
    ).resolves.toBeUndefined();
  });
});
