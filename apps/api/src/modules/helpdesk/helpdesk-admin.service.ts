import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  batchMutationResult,
  type BatchMutationItem,
  type BatchMutationResult,
} from '../../common/batch/batch-mutation.dto';
import type { PaginatedResult } from '../../common/pagination/paginated-result.interface';
import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  TicketDepartmentStatus,
  TicketStatus,
  UserStatus,
} from '../../generated/prisma/enums';
import { normalizeLocalizedText } from '../../i18n/localized-content';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { PERMISSIONS } from '../authorization/permissions';
import { slugify, uniqueSlug } from '../knowledge/knowledge.rules';
import type {
  AssignTicketDto,
  BatchTicketAssignDto,
  BatchTicketStatusDto,
  CreateStaffMessageDto,
  CreateTicketDepartmentDto,
  ListQueueQueryDto,
  UpdateTicketDepartmentDto,
  UpdateTicketDto,
} from './dto/helpdesk-admin.dto';
import {
  assertAttachableFiles,
  LIVE_ATTACHMENT_WHERE,
  normalizeMessageBody,
  statusAfterStaffReply,
  statusChangeData,
} from './helpdesk.rules';

const departmentSelect = {
  id: true,
  slug: true,
  name: true,
  nameTranslations: true,
} as const satisfies Prisma.TicketDepartmentSelect;

const adminDepartmentSelect = {
  ...departmentSelect,
  description: true,
  descriptionTranslations: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { tickets: true } },
} as const satisfies Prisma.TicketDepartmentSelect;

const userSummarySelect = {
  id: true,
  email: true,
  displayName: true,
} as const satisfies Prisma.UserSelect;

const companyServiceSelect = {
  id: true,
  displayName: true,
  displayNameTranslations: true,
  status: true,
  service: { select: { id: true, name: true, nameTranslations: true } },
} as const satisfies Prisma.CompanyServiceSelect;

const queueSelect = {
  id: true,
  reference: true,
  subject: true,
  status: true,
  priority: true,
  lastMessageAt: true,
  firstRespondedAt: true,
  resolvedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  company: { select: { id: true, name: true } },
  department: { select: departmentSelect },
  companyService: { select: companyServiceSelect },
  createdBy: { select: userSummarySelect },
  assignee: { select: userSummarySelect },
} as const satisfies Prisma.TicketSelect;

/** Staff see the whole thread, internal notes included and labelled. */
const staffDetailSelect = {
  ...queueSelect,
  messages: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      body: true,
      isInternal: true,
      authorScope: true,
      createdAt: true,
      author: { select: userSummarySelect },
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
  },
} as const satisfies Prisma.TicketSelect;

type QueueItem = Prisma.TicketGetPayload<{ select: typeof queueSelect }>;

/**
 * Staff side of the helpdesk: the queue, triage, assignment, replies and
 * internal notes, and department management.
 *
 * Staff are PLATFORM principals holding helpdesk.manage; assignment also needs
 * helpdesk.assign. Both are enforced by the controller's guards; this service
 * additionally checks that an assignee is an active staff member.
 */
@Injectable()
export class HelpdeskAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listQueue(
    principal: AuthenticatedPrincipal,
    query: ListQueueQueryDto,
  ): Promise<PaginatedResult<QueueItem>> {
    const search = query.q?.trim();
    const where: Prisma.TicketWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...this.assigneeWhere(principal, query.assignee),
      ...(search
        ? {
            OR: [
              { reference: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.TicketOrderByWithRelationInput[] =
      query.sort === 'created'
        ? [{ createdAt: 'desc' }, { id: 'desc' }]
        : query.sort === 'priority'
          ? [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }]
          : [{ lastMessageAt: 'desc' }, { id: 'desc' }];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        select: queueSelect,
        orderBy,
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

  /** Staff who can be assigned tickets: active platform users with helpdesk.manage. */
  async listAssignees() {
    return this.prisma.user.findMany({
      where: this.assignableStaffWhere(),
      select: userSummarySelect,
      orderBy: [{ displayName: 'asc' }, { email: 'asc' }],
      take: 200,
    });
  }

  async getTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: staffDetailSelect,
    });

    if (!ticket) {
      throw new NotFoundException('The ticket was not found.');
    }

    return ticket;
  }

  async updateTicket(
    principal: AuthenticatedPrincipal,
    ticketId: string,
    dto: UpdateTicketDto,
  ) {
    await this.prisma.$transaction(async (transaction) => {
      const ticket = await this.findTicketForUpdate(transaction, ticketId);
      const data: Prisma.TicketUncheckedUpdateInput = {};
      const changes: Record<string, { from: string; to: string }> = {};

      if (dto.status !== undefined && dto.status !== ticket.status) {
        Object.assign(data, statusChangeData(ticket, dto.status, new Date()));
        changes.status = { from: ticket.status, to: dto.status };
      }

      if (dto.priority !== undefined && dto.priority !== ticket.priority) {
        data.priority = dto.priority;
        changes.priority = { from: ticket.priority, to: dto.priority };
      }

      if (
        dto.departmentId !== undefined &&
        dto.departmentId !== ticket.departmentId
      ) {
        await this.assertActiveDepartment(transaction, dto.departmentId);
        data.departmentId = dto.departmentId;
        changes.departmentId = {
          from: ticket.departmentId,
          to: dto.departmentId,
        };
      }

      if (Object.keys(changes).length === 0) {
        return;
      }

      await transaction.ticket.update({
        where: { id: ticket.id },
        data,
        select: { id: true },
      });

      await this.audit(transaction, principal, ticket, {
        action: AUDIT_ACTIONS.HELPDESK_TICKET_UPDATED,
        metadata: { changes },
      });
    });

    return this.getTicket(ticketId);
  }

  async assignTicket(
    principal: AuthenticatedPrincipal,
    ticketId: string,
    dto: AssignTicketDto,
  ) {
    await this.prisma.$transaction(async (transaction) => {
      const ticket = await this.findTicketForUpdate(transaction, ticketId);

      if (ticket.assigneeUserId === dto.assigneeUserId) {
        return;
      }

      if (dto.assigneeUserId) {
        await this.assertAssignable(transaction, dto.assigneeUserId);
      }

      await transaction.ticket.update({
        where: { id: ticket.id },
        data: { assigneeUserId: dto.assigneeUserId },
        select: { id: true },
      });

      await this.audit(transaction, principal, ticket, {
        action: AUDIT_ACTIONS.HELPDESK_TICKET_ASSIGNED,
        metadata: {
          from: ticket.assigneeUserId,
          to: dto.assigneeUserId,
        },
      });
    });

    return this.getTicket(ticketId);
  }

  /**
   * A public reply or an internal note, decided only by dto.isInternal.
   *
   * Internal notes never touch lastMessageAt or the status: the customer's
   * list is sorted by lastMessageAt, so bumping it would reveal that staff
   * wrote something the customer cannot see. They also cannot carry files,
   * because attachments live in the customer's company file scope.
   */
  async addMessage(
    principal: AuthenticatedPrincipal,
    ticketId: string,
    dto: CreateStaffMessageDto,
  ) {
    const body = normalizeMessageBody(dto.body);

    if (dto.isInternal && (dto.attachmentIds?.length ?? 0) > 0) {
      throw new BadRequestException('Internal notes cannot carry attachments.');
    }

    if (dto.isInternal && dto.status !== undefined) {
      throw new BadRequestException(
        'An internal note cannot change the status; update the ticket instead.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      const ticket = await this.findTicketForUpdate(transaction, ticketId);
      const now = new Date();

      if (dto.isInternal) {
        await transaction.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            authorUserId: principal.userId,
            authorScope: AccountScope.PLATFORM,
            isInternal: true,
            body,
            createdAt: now,
          },
          select: { id: true },
        });

        return;
      }

      if (ticket.status === TicketStatus.CLOSED) {
        throw new ConflictException(
          'This ticket is closed. Reopen it before replying to the customer.',
        );
      }

      // Staff attachments are scoped to the ticket's company, never PLATFORM:
      // upload with POST /v1/files and companyId set to the ticket's company.
      const attachmentIds = await assertAttachableFiles(transaction, {
        companyId: ticket.companyId,
        uploaderUserId: principal.userId,
        fileAssetIds: dto.attachmentIds,
      });
      const nextStatus = dto.status ?? statusAfterStaffReply(ticket.status);

      await transaction.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorUserId: principal.userId,
          authorScope: AccountScope.PLATFORM,
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
          ...(ticket.firstRespondedAt ? {} : { firstRespondedAt: now }),
          ...(nextStatus !== ticket.status
            ? statusChangeData(ticket, nextStatus, now)
            : {}),
        },
        select: { id: true },
      });
    });

    return this.getTicket(ticketId);
  }

  async batchStatus(
    principal: AuthenticatedPrincipal,
    dto: BatchTicketStatusDto,
  ): Promise<BatchMutationResult> {
    return this.prisma.$transaction(async (transaction) => {
      const tickets = await this.findTicketsForBatch(transaction, dto.ids);
      const now = new Date();
      const items: BatchMutationItem[] = [];

      for (const ticket of tickets) {
        if (ticket.status === dto.status) {
          items.push({
            id: ticket.id,
            outcome: 'UNCHANGED',
            updatedAt: ticket.updatedAt,
          });
          continue;
        }

        const updated = await transaction.ticket.update({
          where: { id: ticket.id },
          data: statusChangeData(ticket, dto.status, now),
          select: { id: true, updatedAt: true },
        });

        await this.audit(transaction, principal, ticket, {
          action: AUDIT_ACTIONS.HELPDESK_TICKET_UPDATED,
          metadata: {
            batch: true,
            changes: { status: { from: ticket.status, to: dto.status } },
          },
        });

        items.push({ ...updated, outcome: 'CHANGED' });
      }

      return batchMutationResult(items);
    });
  }

  async batchAssign(
    principal: AuthenticatedPrincipal,
    dto: BatchTicketAssignDto,
  ): Promise<BatchMutationResult> {
    return this.prisma.$transaction(async (transaction) => {
      if (dto.assigneeUserId) {
        await this.assertAssignable(transaction, dto.assigneeUserId);
      }

      const tickets = await this.findTicketsForBatch(transaction, dto.ids);
      const items: BatchMutationItem[] = [];

      for (const ticket of tickets) {
        if (ticket.assigneeUserId === dto.assigneeUserId) {
          items.push({
            id: ticket.id,
            outcome: 'UNCHANGED',
            updatedAt: ticket.updatedAt,
          });
          continue;
        }

        const updated = await transaction.ticket.update({
          where: { id: ticket.id },
          data: { assigneeUserId: dto.assigneeUserId },
          select: { id: true, updatedAt: true },
        });

        await this.audit(transaction, principal, ticket, {
          action: AUDIT_ACTIONS.HELPDESK_TICKET_ASSIGNED,
          metadata: {
            batch: true,
            from: ticket.assigneeUserId,
            to: dto.assigneeUserId,
          },
        });

        items.push({ ...updated, outcome: 'CHANGED' });
      }

      return batchMutationResult(items);
    });
  }

  // ---------------------------------------------------------------- departments

  async listDepartments() {
    return this.prisma.ticketDepartment.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: adminDepartmentSelect,
    });
  }

  async getDepartment(departmentId: string) {
    const department = await this.prisma.ticketDepartment.findUnique({
      where: { id: departmentId },
      select: adminDepartmentSelect,
    });

    if (!department) {
      throw new NotFoundException('The department was not found.');
    }

    return department;
  }

  async createDepartment(
    principal: AuthenticatedPrincipal,
    input: CreateTicketDepartmentDto,
  ) {
    const name = input.name.trim();
    const department = await this.prisma.ticketDepartment.create({
      data: {
        slug: await this.resolveDepartmentSlug(
          input.slug ?? input.nameTranslations?.en ?? name,
        ),
        name,
        nameTranslations: normalizeLocalizedText(input.nameTranslations, name),
        description: input.description?.trim() || null,
        descriptionTranslations: normalizeLocalizedText(
          input.descriptionTranslations,
          input.description,
        ),
        status: input.status ?? TicketDepartmentStatus.ACTIVE,
        sortOrder: input.sortOrder ?? 0,
      },
      select: adminDepartmentSelect,
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: principal.userId,
        companyId: null,
        action: AUDIT_ACTIONS.HELPDESK_DEPARTMENT_CREATED,
        targetType: 'ticket_department',
        targetId: department.id,
        metadata: { slug: department.slug },
      },
    });

    return department;
  }

  async updateDepartment(
    principal: AuthenticatedPrincipal,
    departmentId: string,
    input: UpdateTicketDepartmentDto,
  ) {
    const existing = await this.prisma.ticketDepartment.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true, description: true },
    });

    if (!existing) {
      throw new NotFoundException('The department was not found.');
    }

    const name = input.name?.trim() ?? existing.name;
    const description =
      input.description !== undefined
        ? input.description?.trim() || null
        : existing.description;

    const department = await this.prisma.ticketDepartment.update({
      where: { id: departmentId },
      data: {
        ...(input.slug !== undefined
          ? { slug: await this.resolveDepartmentSlug(input.slug, departmentId) }
          : {}),
        ...(input.name !== undefined ? { name } : {}),
        ...(input.nameTranslations !== undefined
          ? {
              nameTranslations: normalizeLocalizedText(
                input.nameTranslations,
                name,
              ),
            }
          : {}),
        ...(input.description !== undefined ? { description } : {}),
        ...(input.descriptionTranslations !== undefined
          ? {
              descriptionTranslations: normalizeLocalizedText(
                input.descriptionTranslations,
                description,
              ),
            }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.sortOrder !== undefined
          ? { sortOrder: input.sortOrder }
          : {}),
      },
      select: adminDepartmentSelect,
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: principal.userId,
        companyId: null,
        action: AUDIT_ACTIONS.HELPDESK_DEPARTMENT_UPDATED,
        targetType: 'ticket_department',
        targetId: department.id,
        metadata: { fields: Object.keys(input) },
      },
    });

    return department;
  }

  /**
   * Only an unused department can be deleted; one with tickets is archived
   * instead. The foreign key (Restrict) is the real guarantee if a ticket is
   * filed between this check and the delete.
   */
  async deleteDepartment(
    principal: AuthenticatedPrincipal,
    departmentId: string,
  ) {
    const department = await this.prisma.ticketDepartment.findUnique({
      where: { id: departmentId },
      select: { id: true, slug: true, _count: { select: { tickets: true } } },
    });

    if (!department) {
      throw new NotFoundException('The department was not found.');
    }

    if (department._count.tickets > 0) {
      throw new ConflictException(
        'This department has tickets. Archive it instead of deleting it.',
      );
    }

    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.ticketDepartment.delete({
          where: { id: departmentId },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            companyId: null,
            action: AUDIT_ACTIONS.HELPDESK_DEPARTMENT_DELETED,
            targetType: 'ticket_department',
            targetId: departmentId,
            metadata: { slug: department.slug },
          },
        });
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'This department has tickets. Archive it instead of deleting it.',
        );
      }

      throw error;
    }

    return { id: departmentId, deleted: true };
  }

  // -------------------------------------------------------------------- helpers

  private assigneeWhere(
    principal: AuthenticatedPrincipal,
    assignee: string | undefined,
  ): Prisma.TicketWhereInput {
    if (!assignee) {
      return {};
    }

    if (assignee === 'unassigned') {
      return { assigneeUserId: null };
    }

    return {
      assigneeUserId:
        assignee === 'me' ? principal.userId : assignee.toLowerCase(),
    };
  }

  private assignableStaffWhere(): Prisma.UserWhereInput {
    return {
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
  }

  private async assertAssignable(
    transaction: Prisma.TransactionClient,
    userId: string,
  ): Promise<void> {
    const assignee = await transaction.user.findFirst({
      where: { id: userId, ...this.assignableStaffWhere() },
      select: { id: true },
    });

    if (!assignee) {
      throw new BadRequestException(
        'Tickets can only be assigned to active support staff.',
      );
    }
  }

  private async assertActiveDepartment(
    transaction: Prisma.TransactionClient,
    departmentId: string,
  ): Promise<void> {
    const department = await transaction.ticketDepartment.findFirst({
      where: { id: departmentId, status: TicketDepartmentStatus.ACTIVE },
      select: { id: true },
    });

    if (!department) {
      throw new BadRequestException('The department is not active.');
    }
  }

  private async findTicketForUpdate(
    transaction: Prisma.TransactionClient,
    ticketId: string,
  ) {
    const ticket = await transaction.ticket.findUnique({
      where: { id: ticketId },
      select: ticketStateSelect,
    });

    if (!ticket) {
      throw new NotFoundException('The ticket was not found.');
    }

    return ticket;
  }

  private async findTicketsForBatch(
    transaction: Prisma.TransactionClient,
    ids: readonly string[],
  ) {
    const tickets = await transaction.ticket.findMany({
      where: { id: { in: [...ids] } },
      select: ticketStateSelect,
      orderBy: { id: 'asc' },
    });

    if (tickets.length !== ids.length) {
      throw new NotFoundException('One or more tickets were not found.');
    }

    return tickets;
  }

  private async audit(
    transaction: Prisma.TransactionClient,
    principal: AuthenticatedPrincipal,
    ticket: { id: string; companyId: string; reference: string },
    entry: {
      action: (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
      metadata: Prisma.InputJsonObject;
    },
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        actorUserId: principal.userId,
        companyId: ticket.companyId,
        action: entry.action,
        targetType: 'ticket',
        targetId: ticket.id,
        metadata: { reference: ticket.reference, ...entry.metadata },
      },
    });
  }

  private async resolveDepartmentSlug(source: string, excludeId?: string) {
    const base = slugify(source);

    if (!base) {
      throw new BadRequestException(
        'Could not derive a slug from that name; set one explicitly.',
      );
    }

    const taken = await this.prisma.ticketDepartment.findMany({
      where: {
        slug: { startsWith: base },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { slug: true },
    });

    return uniqueSlug(base, new Set(taken.map((row) => row.slug)));
  }
}

const ticketStateSelect = {
  id: true,
  reference: true,
  companyId: true,
  departmentId: true,
  assigneeUserId: true,
  status: true,
  priority: true,
  resolvedAt: true,
  closedAt: true,
  firstRespondedAt: true,
  updatedAt: true,
} as const satisfies Prisma.TicketSelect;
