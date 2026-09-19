import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { PaginatedResult } from '../../common/pagination/paginated-result.interface';
import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  TicketDepartmentStatus,
  TicketStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AuthorizationService } from '../authorization/authorization.service';
import { PERMISSIONS } from '../authorization/permissions';
import type {
  CreateTicketDto,
  CreateTicketReplyDto,
  ListCustomerTicketsQueryDto,
} from './dto/helpdesk.dto';
import {
  allocateTicketReference,
  assertAttachableFiles,
  CUSTOMER_VISIBLE_MESSAGE_WHERE,
  LIVE_ATTACHMENT_WHERE,
  normalizeMessageBody,
  statusAfterCustomerReply,
} from './helpdesk.rules';

/**
 * `name` + `nameTranslations` are resolved by LocalizedContentInterceptor.
 */
const departmentSelect = {
  id: true,
  slug: true,
  name: true,
  nameTranslations: true,
} as const satisfies Prisma.TicketDepartmentSelect;

const ticketListSelect = {
  id: true,
  reference: true,
  subject: true,
  status: true,
  priority: true,
  lastMessageAt: true,
  resolvedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  department: { select: departmentSelect },
  createdBy: { select: { id: true, email: true, displayName: true } },
} as const satisfies Prisma.TicketSelect;

/**
 * The customer thread. isInternal is deliberately not selected, and the
 * where clause is the shared CUSTOMER_VISIBLE_MESSAGE_WHERE.
 */
const customerMessagesSelect = {
  where: CUSTOMER_VISIBLE_MESSAGE_WHERE,
  orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  select: {
    id: true,
    body: true,
    authorScope: true,
    createdAt: true,
    author: { select: { id: true, email: true, displayName: true } },
    attachments: {
      where: LIVE_ATTACHMENT_WHERE,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        fileAsset: {
          select: {
            id: true,
            originalFilename: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
      },
    },
  },
} as const satisfies Prisma.Ticket$messagesArgs;

const ticketDetailSelect = {
  ...ticketListSelect,
  messages: customerMessagesSelect,
} as const satisfies Prisma.TicketSelect;

type CustomerMessage = Prisma.TicketMessageGetPayload<{
  select: (typeof customerMessagesSelect)['select'];
}>;

interface CustomerScope {
  companyId: string;
  userId: string;
  canReadCompanyTickets: boolean;
}

/**
 * Customer side of the helpdesk.
 *
 * Tenant isolation is enforced here, not in the controller: every query is
 * built from the authenticated principal's companyId, and a company_user
 * without helpdesk.company.read is further confined to tickets they created.
 * A ticket outside that scope is reported as not found, never as forbidden,
 * so ids cannot be probed across companies.
 */
@Injectable()
export class HelpdeskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  async listDepartments() {
    return this.prisma.ticketDepartment.findMany({
      where: { status: TicketDepartmentStatus.ACTIVE },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: departmentSelect,
    });
  }

  async listTickets(
    principal: AuthenticatedPrincipal,
    query: ListCustomerTicketsQueryDto,
  ): Promise<
    PaginatedResult<
      Prisma.TicketGetPayload<{ select: typeof ticketListSelect }>
    >
  > {
    const scope = await this.resolveScope(principal);
    const search = query.q?.trim();

    const where: Prisma.TicketWhereInput = {
      ...this.visibleTicketsWhere(scope),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        select: ticketListSelect,
        orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      items,
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getTicket(principal: AuthenticatedPrincipal, ticketId: string) {
    const scope = await this.resolveScope(principal);
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, ...this.visibleTicketsWhere(scope) },
      select: ticketDetailSelect,
    });

    if (!ticket) {
      throw new NotFoundException('The ticket was not found.');
    }

    return {
      ...ticket,
      messages: ticket.messages.map((message) => this.presentMessage(message)),
    };
  }

  async createTicket(principal: AuthenticatedPrincipal, dto: CreateTicketDto) {
    const scope = await this.resolveScope(principal);
    const subject = dto.subject.trim();
    const body = normalizeMessageBody(dto.body);

    if (!subject) {
      throw new BadRequestException('The subject cannot be empty.');
    }

    const department = await this.prisma.ticketDepartment.findFirst({
      where: {
        id: dto.departmentId,
        status: TicketDepartmentStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!department) {
      throw new NotFoundException('The department was not found.');
    }

    const created = await this.prisma.$transaction(async (transaction) => {
      const now = new Date();
      const attachmentIds = await assertAttachableFiles(transaction, {
        companyId: scope.companyId,
        uploaderUserId: scope.userId,
        fileAssetIds: dto.attachmentIds,
      });
      const reference = await allocateTicketReference(transaction, now);

      const ticket = await transaction.ticket.create({
        data: {
          reference,
          companyId: scope.companyId,
          departmentId: department.id,
          createdByUserId: scope.userId,
          subject,
          lastMessageAt: now,
          messages: {
            create: {
              authorUserId: scope.userId,
              authorScope: AccountScope.COMPANY,
              isInternal: false,
              body,
              createdAt: now,
              attachments: {
                create: attachmentIds.map((fileAssetId) => ({ fileAssetId })),
              },
            },
          },
        },
        select: { id: true, reference: true },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: scope.userId,
          companyId: scope.companyId,
          action: AUDIT_ACTIONS.HELPDESK_TICKET_CREATED,
          targetType: 'ticket',
          targetId: ticket.id,
          metadata: {
            reference: ticket.reference,
            departmentId: department.id,
            attachments: attachmentIds.length,
          },
        },
      });

      return ticket;
    });

    return this.getTicket(principal, created.id);
  }

  async reply(
    principal: AuthenticatedPrincipal,
    ticketId: string,
    dto: CreateTicketReplyDto,
  ) {
    const scope = await this.resolveScope(principal);
    const body = normalizeMessageBody(dto.body);

    await this.prisma.$transaction(async (transaction) => {
      const ticket = await transaction.ticket.findFirst({
        where: { id: ticketId, ...this.visibleTicketsWhere(scope) },
        select: { id: true, status: true },
      });

      if (!ticket) {
        throw new NotFoundException('The ticket was not found.');
      }

      if (ticket.status === TicketStatus.CLOSED) {
        throw new ConflictException(
          'This ticket is closed. Please open a new ticket.',
        );
      }

      const attachmentIds = await assertAttachableFiles(transaction, {
        companyId: scope.companyId,
        uploaderUserId: scope.userId,
        fileAssetIds: dto.attachmentIds,
      });
      const now = new Date();
      const nextStatus = statusAfterCustomerReply(ticket.status);

      await transaction.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorUserId: scope.userId,
          authorScope: AccountScope.COMPANY,
          isInternal: false,
          body,
          createdAt: now,
          attachments: {
            create: attachmentIds.map((fileAssetId) => ({ fileAssetId })),
          },
        },
        select: { id: true },
      });

      await transaction.ticket.update({
        where: { id: ticket.id },
        data: {
          lastMessageAt: now,
          ...(nextStatus !== ticket.status
            ? { status: nextStatus, resolvedAt: null }
            : {}),
        },
        select: { id: true },
      });
    });

    return this.getTicket(principal, ticketId);
  }

  /**
   * Lets the customer close a ticket they no longer need. Closing is final;
   * a follow-up is a new ticket.
   */
  async close(principal: AuthenticatedPrincipal, ticketId: string) {
    const scope = await this.resolveScope(principal);

    await this.prisma.$transaction(async (transaction) => {
      const ticket = await transaction.ticket.findFirst({
        where: { id: ticketId, ...this.visibleTicketsWhere(scope) },
        select: { id: true, status: true, reference: true },
      });

      if (!ticket) {
        throw new NotFoundException('The ticket was not found.');
      }

      if (ticket.status === TicketStatus.CLOSED) {
        throw new ConflictException('This ticket is already closed.');
      }

      await transaction.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.CLOSED, closedAt: new Date() },
        select: { id: true },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: scope.userId,
          companyId: scope.companyId,
          action: AUDIT_ACTIONS.HELPDESK_TICKET_CLOSED,
          targetType: 'ticket',
          targetId: ticket.id,
          metadata: {
            reference: ticket.reference,
            previousStatus: ticket.status,
          },
        },
      });
    });

    return this.getTicket(principal, ticketId);
  }

  /**
   * Customer endpoints are for company accounts only. Staff work tickets
   * through the staff API, where the company is chosen explicitly.
   */
  private async resolveScope(
    principal: AuthenticatedPrincipal,
  ): Promise<CustomerScope> {
    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException(
        'The customer helpdesk requires a company account.',
      );
    }

    const context = await this.authorization.resolveContext(principal);

    return {
      companyId: principal.companyId,
      userId: principal.userId,
      canReadCompanyTickets: context.permissions.includes(
        PERMISSIONS.HELPDESK_COMPANY_READ,
      ),
    };
  }

  private visibleTicketsWhere(scope: CustomerScope): Prisma.TicketWhereInput {
    return scope.canReadCompanyTickets
      ? { companyId: scope.companyId }
      : { companyId: scope.companyId, createdByUserId: scope.userId };
  }

  /**
   * Staff authors are shown by display name only; their email address is not
   * disclosed to customers.
   */
  private presentMessage(message: CustomerMessage) {
    const isStaff = message.authorScope === AccountScope.PLATFORM;

    return {
      ...message,
      author: {
        id: message.author.id,
        displayName: message.author.displayName,
        email: isStaff ? null : message.author.email,
      },
    };
  }
}
