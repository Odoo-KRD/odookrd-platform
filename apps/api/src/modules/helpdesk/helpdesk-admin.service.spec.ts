import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { AccountScope, TicketStatus } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { HelpdeskAdminService } from './helpdesk-admin.service';
import type { HelpdeskNotificationService } from './helpdesk-notification.service';

const COMPANY_ID = '7f28dd10-86d3-4286-81ff-f2f58bb8bd21';
const TICKET_ID = '3c1e5a0e-2f7b-4b8e-9d51-6a0f1b2c3d4e';
const FILE_ID = '0b6f2b1e-6f5a-4d7e-9f3c-1a2b3c4d5e01';
const STAFF_ID = '9e2d1c0b-8a7f-4e6d-9c5b-4a3f2e1d0c9b';

const staff: AuthenticatedPrincipal = {
  sessionId: 'staff-session',
  userId: STAFF_ID,
  email: 'dev@odoo.krd',
  accountScope: AccountScope.PLATFORM,
  companyId: null,
};

interface DataArgs {
  data: Record<string, unknown>;
}

interface WhereArgs {
  where: Record<string, unknown>;
}

function ticketState(overrides: Record<string, unknown> = {}) {
  return {
    id: TICKET_ID,
    reference: 'TKT-2026-00001',
    companyId: COMPANY_ID,
    departmentId: 'dept',
    assigneeUserId: null,
    status: TicketStatus.OPEN,
    priority: 'NORMAL',
    resolvedAt: null,
    closedAt: null,
    firstRespondedAt: null,
    updatedAt: new Date(),
    ...overrides,
  };
}

function serviceFor(options: {
  ticket?: Record<string, unknown> | null;
  eligibleFiles?: string[];
  assignee?: { id: string } | null;
}) {
  const messageCreates: DataArgs[] = [];
  const ticketUpdates: DataArgs[] = [];
  const fileQueries: WhereArgs[] = [];

  const state = options.ticket === undefined ? ticketState() : options.ticket;

  const client = {
    ticket: {
      findUnique: jest.fn(() =>
        Promise.resolve(state ? { ...state, messages: [] } : null),
      ),
      update: jest.fn((args: DataArgs) => {
        ticketUpdates.push(args);
        return Promise.resolve({ id: TICKET_ID, updatedAt: new Date() });
      }),
    },
    ticketMessage: {
      create: jest.fn((args: DataArgs) => {
        messageCreates.push(args);
        return Promise.resolve({ id: 'message' });
      }),
    },
    fileAsset: {
      findMany: jest.fn((args: WhereArgs) => {
        fileQueries.push(args);
        return Promise.resolve(
          (options.eligibleFiles ?? []).map((id) => ({ id })),
        );
      }),
    },
    ticketAttachment: { count: jest.fn().mockResolvedValue(0) },
    user: {
      findFirst: jest
        .fn()
        .mockResolvedValue(
          options.assignee === undefined ? { id: STAFF_ID } : options.assignee,
        ),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };

  const prisma = {
    ...client,
    $transaction: jest.fn((callback: (tx: typeof client) => Promise<unknown>) =>
      callback(client),
    ),
  } as unknown as PrismaService;

  const notifier = {
    ticketCreated: jest.fn().mockResolvedValue(undefined),
    customerReplied: jest.fn().mockResolvedValue(undefined),
    staffReplied: jest.fn().mockResolvedValue(undefined),
    ticketResolved: jest.fn().mockResolvedValue(undefined),
  };

  return {
    service: new HelpdeskAdminService(
      prisma,
      notifier as unknown as HelpdeskNotificationService,
    ),
    notifier,
    messageCreates,
    ticketUpdates,
    fileQueries,
  };
}

describe('HelpdeskAdminService', () => {
  describe('internal notes', () => {
    it('are stored as internal and do not touch the ticket', async () => {
      const { service, messageCreates, ticketUpdates } = serviceFor({});

      await service.addMessage(staff, TICKET_ID, {
        isInternal: true,
        body: 'private remark',
      });

      expect(messageCreates[0].data).toMatchObject({
        isInternal: true,
        authorScope: AccountScope.PLATFORM,
      });
      // No lastMessageAt bump: the customer list must not reveal the note.
      expect(ticketUpdates).toHaveLength(0);
    });

    it('cannot carry attachments', async () => {
      const { service, messageCreates } = serviceFor({});

      await expect(
        service.addMessage(staff, TICKET_ID, {
          isInternal: true,
          body: 'see file',
          attachmentIds: [FILE_ID],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(messageCreates).toHaveLength(0);
    });

    it('can be added to a closed ticket', async () => {
      const { service, messageCreates } = serviceFor({
        ticket: ticketState({ status: TicketStatus.CLOSED }),
      });

      await service.addMessage(staff, TICKET_ID, {
        isInternal: true,
        body: 'post-mortem',
      });

      expect(messageCreates).toHaveLength(1);
    });
  });

  describe('notifications', () => {
    it('never notify anyone about an internal note', async () => {
      const { service, notifier } = serviceFor({});

      await service.addMessage(staff, TICKET_ID, {
        isInternal: true,
        body: 'private remark',
      });

      expect(notifier.staffReplied).not.toHaveBeenCalled();
      expect(notifier.ticketResolved).not.toHaveBeenCalled();
    });

    it('tell the customer about a public reply', async () => {
      const { service, notifier } = serviceFor({});

      await service.addMessage(staff, TICKET_ID, {
        isInternal: false,
        body: 'We are on it.',
      });

      expect(notifier.staffReplied).toHaveBeenCalledWith(TICKET_ID, 'message');
      expect(notifier.ticketResolved).not.toHaveBeenCalled();
    });

    it('send one resolution notice when a reply also resolves', async () => {
      const { service, notifier } = serviceFor({});

      await service.addMessage(staff, TICKET_ID, {
        isInternal: false,
        body: 'Fixed.',
        status: TicketStatus.RESOLVED,
      });

      expect(notifier.ticketResolved).toHaveBeenCalledWith(
        TICKET_ID,
        expect.any(Date),
      );
      expect(notifier.staffReplied).not.toHaveBeenCalled();
    });

    it('tell the customer when staff resolve the ticket', async () => {
      const { service, notifier } = serviceFor({});

      await service.updateTicket(staff, TICKET_ID, {
        status: TicketStatus.RESOLVED,
      });

      expect(notifier.ticketResolved).toHaveBeenCalledTimes(1);
    });

    it('stay silent for status changes other than resolved', async () => {
      const { service, notifier } = serviceFor({});

      await service.updateTicket(staff, TICKET_ID, {
        status: TicketStatus.WAITING_ON_CUSTOMER,
      });

      expect(notifier.ticketResolved).not.toHaveBeenCalled();
      expect(notifier.staffReplied).not.toHaveBeenCalled();
    });
  });

  describe('public replies', () => {
    it('record the first response and move a new ticket to IN_PROGRESS', async () => {
      const { service, messageCreates, ticketUpdates } = serviceFor({});

      await service.addMessage(staff, TICKET_ID, {
        isInternal: false,
        body: 'We are looking into it.',
      });

      expect(messageCreates[0].data).toMatchObject({ isInternal: false });
      expect(ticketUpdates[0].data).toMatchObject({
        status: TicketStatus.IN_PROGRESS,
      });
      expect(ticketUpdates[0].data.firstRespondedAt).toBeInstanceOf(Date);
      expect(ticketUpdates[0].data.lastMessageAt).toBeInstanceOf(Date);
    });

    it('are refused on a closed ticket', async () => {
      const { service } = serviceFor({
        ticket: ticketState({ status: TicketStatus.CLOSED }),
      });

      await expect(
        service.addMessage(staff, TICKET_ID, {
          isInternal: false,
          body: 'hello',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("check attachments against the ticket's company, not PLATFORM", async () => {
      const { service, fileQueries } = serviceFor({
        eligibleFiles: [FILE_ID],
      });

      await service.addMessage(staff, TICKET_ID, {
        isInternal: false,
        body: 'log attached',
        attachmentIds: [FILE_ID],
      });

      expect(fileQueries[0].where).toMatchObject({
        accountScope: AccountScope.COMPANY,
        companyId: COMPANY_ID,
        uploadedByUserId: STAFF_ID,
      });
    });

    it('reject a platform-scoped staff file', async () => {
      const { service } = serviceFor({ eligibleFiles: [] });

      await expect(
        service.addMessage(staff, TICKET_ID, {
          isInternal: false,
          body: 'log attached',
          attachmentIds: [FILE_ID],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  it('refuses to assign a ticket to someone who is not support staff', async () => {
    const { service } = serviceFor({ assignee: null });

    await expect(
      service.assignTicket(staff, TICKET_ID, {
        assigneeUserId: '11111111-2222-4333-8444-555555555555',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('reports an unknown ticket as not found', async () => {
    const { service } = serviceFor({ ticket: null });

    await expect(service.getTicket(TICKET_ID)).rejects.toThrow(
      NotFoundException,
    );
  });
});
