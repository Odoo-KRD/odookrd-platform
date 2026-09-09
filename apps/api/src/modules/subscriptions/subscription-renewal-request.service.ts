import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AuthorizationService } from '../authorization/authorization.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  AccountScope,
  ServiceBillingModel,
  SubscriptionPeriodSource,
  SubscriptionRenewalRequestStatus,
} from '../../generated/prisma/enums';
import type {
  CreateRenewalRequestDto,
  ListRenewalRequestsQueryDto,
  ReviewRenewalRequestDto,
} from './dto/renewal-request.dto';
import { SubscriptionAdministrationService } from './subscription-administration.service';

const requestSelect = {
  id: true,
  subscriptionId: true,
  requestedTerm: true,
  status: true,
  note: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  requestedBy: {
    select: { id: true, email: true, displayName: true },
  },
  reviewedBy: {
    select: { id: true, email: true, displayName: true },
  },
  subscription: {
    select: {
      id: true,
      term: true,
      status: true,
      currentPeriodEnd: true,
      companyService: {
        select: {
          id: true,
          displayName: true,
          companyId: true,
          company: { select: { id: true, name: true } },
          service: { select: { id: true, name: true, key: true } },
        },
      },
    },
  },
};

@Injectable()
export class SubscriptionRenewalRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
    private readonly administration: SubscriptionAdministrationService,
  ) {}

  /**
   * Raised by a customer against their own service assignment.
   *
   * The database carries a partial unique index allowing one PENDING request
   * per subscription, so a double-submitted form is rejected there rather than
   * depending on this check winning a race.
   */
  async create(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    dto: CreateRenewalRequestDto,
  ) {
    const assignment = await this.prisma.companyService.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        companyId: true,
        service: { select: { billingModel: true } },
        subscription: { select: { id: true, status: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('The service assignment was not found.');
    }

    this.authorization.assertCompanyAccess(principal, assignment.companyId);

    if (assignment.service.billingModel !== ServiceBillingModel.SUBSCRIPTION) {
      throw new ConflictException(
        'Only subscription-billed services can be renewed.',
      );
    }

    if (!assignment.subscription) {
      throw new NotFoundException(
        'This service assignment has no subscription to renew.',
      );
    }

    if (assignment.subscription.status === 'CANCELLED') {
      throw new ConflictException(
        'A cancelled subscription cannot be renewed. Please contact support.',
      );
    }

    const subscriptionId = assignment.subscription.id;

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const request = await transaction.subscriptionRenewalRequest.create({
          data: {
            subscriptionId,
            requestedByUserId: principal.userId,
            requestedTerm: dto.requestedTerm,
            note: dto.note?.trim() || null,
          },
          select: requestSelect,
        });

        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            companyId: assignment.companyId,
            action: AUDIT_ACTIONS.SUBSCRIPTION_RENEWAL_REQUESTED,
            targetType: 'subscription_renewal_request',
            targetId: request.id,
            metadata: { requestedTerm: dto.requestedTerm },
          },
        });

        return request;
      });
    } catch (error: unknown) {
      // P2002 is the one-pending-per-subscription index.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A renewal request is already awaiting review for this service.',
        );
      }

      throw error;
    }
  }

  async list(
    principal: AuthenticatedPrincipal,
    query: ListRenewalRequestsQueryDto,
  ) {
    // A company principal is always confined to its own company. Deriving the
    // scope defensively rather than trusting the guard means a malformed
    // principal fails closed instead of listing every company's requests.
    let companyScope: string | undefined;

    if (principal.accountScope === AccountScope.COMPANY) {
      if (!principal.companyId) {
        throw new ForbiddenException('Authorization context is invalid.');
      }

      companyScope = principal.companyId;
    } else {
      companyScope = query.companyId;
    }

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(companyScope
        ? { subscription: { companyService: { companyId: companyScope } } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscriptionRenewalRequest.findMany({
        where,
        select: requestSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.subscriptionRenewalRequest.count({ where }),
    ]);

    return {
      items,
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  /**
   * Approving performs the renewal itself, so an operator cannot mark a request
   * approved and forget to extend the subscription.
   */
  async approve(
    principal: AuthenticatedPrincipal,
    requestId: string,
    dto: ReviewRenewalRequestDto,
  ) {
    const request = await this.requirePending(requestId);

    await this.administration.renew(
      principal,
      request.subscription.companyService.id,
      {
        term: request.requestedTerm,
        source: SubscriptionPeriodSource.MANUAL_RENEWAL,
      },
    );

    return this.prisma.$transaction(async (transaction) => {
      const reviewed = await transaction.subscriptionRenewalRequest.update({
        where: { id: requestId },
        data: {
          status: SubscriptionRenewalRequestStatus.APPROVED,
          reviewedByUserId: principal.userId,
          reviewedAt: new Date(),
          reviewNote: dto.reviewNote?.trim() || null,
        },
        select: requestSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: request.subscription.companyService.companyId,
          action: AUDIT_ACTIONS.SUBSCRIPTION_RENEWAL_APPROVED,
          targetType: 'subscription_renewal_request',
          targetId: requestId,
          metadata: { requestedTerm: request.requestedTerm },
        },
      });

      return reviewed;
    });
  }

  async reject(
    principal: AuthenticatedPrincipal,
    requestId: string,
    dto: ReviewRenewalRequestDto,
  ) {
    const request = await this.requirePending(requestId);

    return this.prisma.$transaction(async (transaction) => {
      const reviewed = await transaction.subscriptionRenewalRequest.update({
        where: { id: requestId },
        data: {
          status: SubscriptionRenewalRequestStatus.REJECTED,
          reviewedByUserId: principal.userId,
          reviewedAt: new Date(),
          reviewNote: dto.reviewNote?.trim() || null,
        },
        select: requestSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: request.subscription.companyService.companyId,
          action: AUDIT_ACTIONS.SUBSCRIPTION_RENEWAL_REJECTED,
          targetType: 'subscription_renewal_request',
          targetId: requestId,
          metadata: {},
        },
      });

      return reviewed;
    });
  }

  /** Withdrawn by the customer who raised it, while it is still pending. */
  async cancel(principal: AuthenticatedPrincipal, requestId: string) {
    const request = await this.requirePending(requestId);

    this.authorization.assertCompanyAccess(
      principal,
      request.subscription.companyService.companyId,
    );

    return this.prisma.subscriptionRenewalRequest.update({
      where: { id: requestId },
      data: {
        status: SubscriptionRenewalRequestStatus.CANCELLED,
        reviewedAt: new Date(),
      },
      select: requestSelect,
    });
  }

  private async requirePending(requestId: string) {
    const request = await this.prisma.subscriptionRenewalRequest.findUnique({
      where: { id: requestId },
      select: requestSelect,
    });

    if (!request) {
      throw new NotFoundException('The renewal request was not found.');
    }

    if (request.status !== SubscriptionRenewalRequestStatus.PENDING) {
      throw new ConflictException(
        'This renewal request has already been reviewed.',
      );
    }

    return request;
  }
}
