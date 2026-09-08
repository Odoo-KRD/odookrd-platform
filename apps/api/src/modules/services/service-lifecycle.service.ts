import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  batchMutationResult,
  type BatchMutationItem,
  type BatchMutationResult,
} from '../../common/batch/batch-mutation.dto';
import type { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ServiceAssignmentsService } from './service-assignments.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type { BatchAssignmentTransitionDto } from './dto/service-batch.dto';
import type { CreateServiceTransitionDto } from './dto/service-lifecycle.dto';
import {
  assignmentSelect,
  lifecycleSelect,
  type VisibleAssignment,
} from './services.selectors';
import {
  assertAllowedTransition,
  assertPlatformAdministrator,
  resolveTransitionDate,
} from './services.rules';
import {
  presentAssignment,
  presentLifecycleEvent,
} from './services.presenters';
import { recordLifecycleTransition } from './services.lifecycle-events';

@Injectable()
export class ServiceLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assignmentsService: ServiceAssignmentsService,
  ) {}

  async listAssignmentHistory(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    query: PaginationQueryDto,
  ) {
    const assignment = await this.assignmentsService.getAssignment(
      principal,
      assignmentId,
    );
    const where: Prisma.CompanyServiceLifecycleEventWhereInput = {
      companyServiceId: assignment.id,
      companyId: assignment.companyId,
    };

    const [events, total] = await this.prisma.$transaction([
      this.prisma.companyServiceLifecycleEvent.findMany({
        where,
        select: lifecycleSelect,
        orderBy: [{ effectiveAt: 'desc' }, { id: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.companyServiceLifecycleEvent.count({ where }),
    ]);

    return {
      items: events.map((event) => presentLifecycleEvent(event, principal)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async transitionAssignment(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    input: CreateServiceTransitionDto,
  ): Promise<VisibleAssignment> {
    assertPlatformAdministrator(principal);
    const effectiveAt = resolveTransitionDate(input.effectiveAt);

    const updated = await this.prisma.$transaction(async (transaction) => {
      const assignment = await transaction.companyService.findUnique({
        where: { id: assignmentId },
        select: assignmentSelect,
      });

      if (!assignment) {
        throw new NotFoundException('Assigned service was not found.');
      }

      if (assignment.status === input.toStatus) {
        return assignment;
      }

      assertAllowedTransition(assignment.status, input.toStatus, input.reason);

      const record = await transaction.companyService.update({
        where: { id: assignment.id },
        data: { status: input.toStatus },
        select: assignmentSelect,
      });

      await recordLifecycleTransition(transaction, principal, {
        assignmentId: assignment.id,
        companyId: assignment.companyId,
        fromStatus: assignment.status,
        toStatus: input.toStatus,
        reasonCode: input.reasonCode,
        reason: input.reason,
        effectiveAt,
      });

      return record;
    });

    return presentAssignment(updated, principal);
  }

  async transitionAssignments(
    principal: AuthenticatedPrincipal,
    input: BatchAssignmentTransitionDto,
  ): Promise<BatchMutationResult> {
    assertPlatformAdministrator(principal);
    const effectiveAt = resolveTransitionDate(input.effectiveAt);

    return this.prisma.$transaction(async (transaction) => {
      const assignments = await transaction.companyService.findMany({
        where: { id: { in: input.ids } },
        select: { id: true, companyId: true, status: true, updatedAt: true },
      });

      if (assignments.length !== input.ids.length) {
        throw new NotFoundException(
          'One or more selected service assignments could not be found.',
        );
      }

      for (const assignment of assignments) {
        if (assignment.status !== input.toStatus) {
          assertAllowedTransition(
            assignment.status,
            input.toStatus,
            input.reason,
          );
        }
      }

      const selected = new Map(
        assignments.map((assignment) => [assignment.id, assignment]),
      );
      const items: BatchMutationItem[] = [];

      for (const assignmentId of input.ids) {
        const assignment = selected.get(assignmentId);

        if (!assignment) {
          throw new NotFoundException('Assigned service was not found.');
        }

        if (assignment.status === input.toStatus) {
          items.push({
            id: assignment.id,
            outcome: 'UNCHANGED',
            updatedAt: assignment.updatedAt,
          });
          continue;
        }

        const updated = await transaction.companyService.update({
          where: { id: assignment.id },
          data: { status: input.toStatus },
          select: { id: true, updatedAt: true },
        });

        await recordLifecycleTransition(transaction, principal, {
          assignmentId: assignment.id,
          companyId: assignment.companyId,
          fromStatus: assignment.status,
          toStatus: input.toStatus,
          reason: input.reason,
          effectiveAt,
        });

        items.push({
          id: updated.id,
          outcome: 'CHANGED',
          updatedAt: updated.updatedAt,
        });
      }

      const result = batchMutationResult(items);

      if (result.changed > 0) {
        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            action: AUDIT_ACTIONS.SERVICE_ASSIGNMENT_BATCH_TRANSITIONED,
            targetType: 'company_service',
            metadata: {
              status: input.toStatus,
              requested: result.requested,
              changed: result.changed,
            },
          },
        });
      }

      return result;
    });
  }
}
