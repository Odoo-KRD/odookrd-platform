import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { AccountScope, TicketStatus } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { AuthorizationService } from '../authorization/authorization.service';
import { HelpdeskService } from './helpdesk.service';

const COMPANY_ID = '7f28dd10-86d3-4286-81ff-f2f58bb8bd21';
const TICKET_ID = '3c1e5a0e-2f7b-4b8e-9d51-6a0f1b2c3d4e';

const companyUser: AuthenticatedPrincipal = {
  sessionId: 'company-session',
  userId: 'company-user',
  email: 'user@example.com',
  accountScope: AccountScope.COMPANY,
  companyId: COMPANY_ID,
};

const platformUser: AuthenticatedPrincipal = {
  sessionId: 'platform-session',
  userId: 'platform-user',
  email: 'staff@example.com',
  accountScope: AccountScope.PLATFORM,
  companyId: null,
};

interface FindFirstArgs {
  where: Record<string, unknown>;
  select: Record<string, unknown>;
}

interface UpdateArgs {
  data: Record<string, unknown>;
}

function ticketRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TICKET_ID,
    reference: 'TKT-2026-00001',
    status: TicketStatus.OPEN,
    messages: [],
    ...overrides,
  };
}

function serviceFor(options: {
  permissions?: string[];
  ticket?: Record<string, unknown> | null;
}) {
  const findFirstCalls: FindFirstArgs[] = [];
  const updateCalls: UpdateArgs[] = [];

  const ticketDelegate = {
    findFirst: jest.fn((args: FindFirstArgs) => {
      findFirstCalls.push(args);
      return Promise.resolve(
        options.ticket === undefined ? ticketRow() : options.ticket,
      );
    }),
    update: jest.fn((args: UpdateArgs) => {
      updateCalls.push(args);
      return Promise.resolve({ id: TICKET_ID });
    }),
  };

  const transactionClient = {
    ticket: ticketDelegate,
    ticketMessage: { create: jest.fn().mockResolvedValue({ id: 'message' }) },
    fileAsset: { findMany: jest.fn().mockResolvedValue([]) },
    ticketAttachment: { count: jest.fn().mockResolvedValue(0) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };

  const prisma = {
    ticket: ticketDelegate,
    $transaction: jest.fn(
      (callback: (client: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    ),
  } as unknown as PrismaService;

  const authorization = {
    resolveContext: jest.fn().mockResolvedValue({
      permissions: options.permissions ?? ['helpdesk.read'],
    }),
  } as unknown as AuthorizationService;

  return {
    service: new HelpdeskService(prisma, authorization),
    findFirstCalls,
    updateCalls,
  };
}

describe('HelpdeskService (customer)', () => {
  it('refuses platform accounts', async () => {
    const { service } = serviceFor({});

    await expect(service.getTicket(platformUser, TICKET_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('confines a company_user to their own tickets in their own company', async () => {
    const { service, findFirstCalls } = serviceFor({});

    await service.getTicket(companyUser, TICKET_ID);

    expect(findFirstCalls[0].where).toEqual({
      id: TICKET_ID,
      companyId: COMPANY_ID,
      createdByUserId: 'company-user',
    });
  });

  it('shows the whole company to holders of helpdesk.company.read', async () => {
    const { service, findFirstCalls } = serviceFor({
      permissions: ['helpdesk.read', 'helpdesk.company.read'],
    });

    await service.getTicket(companyUser, TICKET_ID);

    expect(findFirstCalls[0].where).toEqual({
      id: TICKET_ID,
      companyId: COMPANY_ID,
    });
  });

  it('filters internal notes in the query and never selects the flag', async () => {
    const { service, findFirstCalls } = serviceFor({});

    await service.getTicket(companyUser, TICKET_ID);

    const messages = findFirstCalls[0].select.messages as {
      where: unknown;
      select: Record<string, unknown>;
    };
    expect(messages.where).toEqual({ isInternal: false });
    expect(messages.select).not.toHaveProperty('isInternal');
  });

  it('reports a ticket outside scope as not found', async () => {
    const { service } = serviceFor({ ticket: null });

    await expect(service.getTicket(companyUser, TICKET_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('hides staff email addresses from customers', async () => {
    const { service } = serviceFor({
      ticket: ticketRow({
        messages: [
          {
            id: 'm1',
            body: 'hi',
            authorScope: AccountScope.PLATFORM,
            createdAt: new Date(),
            author: { id: 's', email: 'staff@odoo.krd', displayName: 'Staff' },
            attachments: [],
          },
        ],
      }),
    });

    const ticket = await service.getTicket(companyUser, TICKET_ID);

    expect(ticket.messages[0].author.email).toBeNull();
  });

  it('rejects a reply to a closed ticket', async () => {
    const { service } = serviceFor({
      ticket: ticketRow({ status: TicketStatus.CLOSED }),
    });

    await expect(
      service.reply(companyUser, TICKET_ID, { body: 'hello' }),
    ).rejects.toThrow(ConflictException);
  });

  it('reopens a resolved ticket when the customer replies', async () => {
    const { service, updateCalls } = serviceFor({
      ticket: ticketRow({ status: TicketStatus.RESOLVED }),
    });

    await service.reply(companyUser, TICKET_ID, { body: 'still broken' });

    expect(updateCalls[0].data).toMatchObject({
      status: TicketStatus.OPEN,
      resolvedAt: null,
    });
  });
});
