import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AuthorizationService } from '../authorization/authorization.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  ServiceBillingModel,
  SubscriptionPeriodSource,
  SubscriptionTerm,
} from '../../generated/prisma/enums';
import type {
  CancelSubscriptionDto,
  CreateSubscriptionDto,
  RenewSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import { resolveEntitlement } from './subscription-entitlement';
import { addTerm } from './subscription-terms';
import {
  DEFAULT_PLATFORM_TIMEZONE,
  assertSupportedTimeZone,
  endOfDayInZone,
} from './subscription-timezone';

const subscriptionSelect = {
  id: true,
  companyServiceId: true,
  term: true,
  status: true,
  autoRenew: true,
  cancelAtPeriodEnd: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  gracePeriodDays: true,
  externalBillingRef: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class SubscriptionAdministrationService {
  private readonly timeZone: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
    configService: ConfigService,
  ) {
    this.timeZone =
      configService.get<string>('PLATFORM_TIMEZONE') ??
      DEFAULT_PLATFORM_TIMEZONE;

    assertSupportedTimeZone(this.timeZone);
  }

  async get(principal: AuthenticatedPrincipal, assignmentId: string) {
    const assignment = await this.requireAssignment(principal, assignmentId);

    // Only query for periods once a subscription exists. Passing an empty
    // string as the id makes Postgres reject it as an invalid uuid, which
    // previously failed the whole request for every unsubscribed assignment.
    const subscriptionId = assignment.subscription?.id ?? null;

    const periods = subscriptionId
      ? await this.prisma.subscriptionPeriod.findMany({
          where: { subscriptionId },
          select: {
            id: true,
            sequence: true,
            term: true,
            startsAt: true,
            endsAt: true,
            source: true,
            createdAt: true,
          },
          orderBy: { sequence: 'desc' },
          take: 50,
        })
      : [];

    return {
      subscription: assignment.subscription,
      periods,
      entitlement: resolveEntitlement(
        {
          billingModel: assignment.service.billingModel,
          assignmentStatus: assignment.status,
          subscription: assignment.subscription,
        },
        new Date(),
      ),
    };
  }

  async create(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    dto: CreateSubscriptionDto,
  ) {
    const assignment = await this.requireAssignment(principal, assignmentId);

    if (assignment.subscription) {
      throw new ConflictException(
        'This service assignment already has a subscription.',
      );
    }

    if (assignment.service.billingModel !== ServiceBillingModel.SUBSCRIPTION) {
      throw new ConflictException(
        'Only subscription-billed services can hold a subscription.',
      );
    }

    const periodStart = dto.startsAt ? new Date(dto.startsAt) : new Date();

    if (Number.isNaN(periodStart.getTime())) {
      throw new BadRequestException('The subscription start date is invalid.');
    }

    const periodEnd = this.resolvePeriodEnd(dto.term, periodStart, dto.endsAt);

    return this.prisma.$transaction(async (transaction) => {
      const subscription = await transaction.subscription.create({
        data: {
          companyServiceId: assignmentId,
          term: dto.term,
          status: dto.trial ? 'TRIAL' : 'ACTIVE',
          autoRenew: dto.autoRenew ?? false,
          gracePeriodDays: dto.gracePeriodDays ?? 0,
          externalBillingRef: dto.externalBillingRef?.trim() || null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
        select: subscriptionSelect,
      });

      await transaction.subscriptionPeriod.create({
        data: {
          subscriptionId: subscription.id,
          sequence: 1,
          term: dto.term,
          startsAt: periodStart,
          endsAt: periodEnd,
          source: SubscriptionPeriodSource.INITIAL,
          actorUserId: principal.userId,
        },
      });

      await transaction.companyService.update({
        where: { id: assignmentId },
        data: { expiresAt: periodEnd },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: assignment.companyId,
          action: AUDIT_ACTIONS.SUBSCRIPTION_CREATED,
          targetType: 'subscription',
          targetId: subscription.id,
          metadata: { term: dto.term, periodEnd: periodEnd.toISOString() },
        },
      });

      return subscription;
    });
  }

  async update(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    dto: UpdateSubscriptionDto,
  ) {
    const assignment = await this.requireAssignment(principal, assignmentId);
    const existing = assignment.subscription;

    if (!existing) {
      throw new NotFoundException(
        'This service assignment has no subscription.',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      const subscription = await transaction.subscription.update({
        where: { id: existing.id },
        data: {
          ...(dto.term !== undefined ? { term: dto.term } : {}),
          ...(dto.autoRenew !== undefined ? { autoRenew: dto.autoRenew } : {}),
          ...(dto.cancelAtPeriodEnd !== undefined
            ? { cancelAtPeriodEnd: dto.cancelAtPeriodEnd }
            : {}),
          ...(dto.gracePeriodDays !== undefined
            ? { gracePeriodDays: dto.gracePeriodDays }
            : {}),
          ...(dto.externalBillingRef !== undefined
            ? { externalBillingRef: dto.externalBillingRef?.trim() || null }
            : {}),
        },
        select: subscriptionSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: assignment.companyId,
          action: AUDIT_ACTIONS.SUBSCRIPTION_UPDATED,
          targetType: 'subscription',
          targetId: subscription.id,
          metadata: { ...dto },
        },
      });

      return subscription;
    });
  }

  /**
   * Extends a subscription by one term.
   *
   * The new period starts at the previous end so renewals never drift, unless
   * the subscription already lapsed, in which case it starts now to avoid
   * selling a period that is already in the past.
   */
  async renew(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    dto: RenewSubscriptionDto,
  ) {
    const assignment = await this.requireAssignment(principal, assignmentId);
    const existing = assignment.subscription;

    if (!existing) {
      throw new NotFoundException(
        'This service assignment has no subscription.',
      );
    }

    if (existing.status === 'CANCELLED') {
      throw new ConflictException(
        'A cancelled subscription cannot be renewed.',
      );
    }

    const now = new Date();
    const term = dto.term ?? existing.term;
    const periodStart =
      existing.currentPeriodEnd.getTime() > now.getTime()
        ? existing.currentPeriodEnd
        : now;

    const periodEnd = this.resolvePeriodEnd(term, periodStart, dto.endsAt);

    const latest = await this.prisma.subscriptionPeriod.findFirst({
      where: { subscriptionId: existing.id },
      select: { sequence: true },
      orderBy: { sequence: 'desc' },
    });

    return this.prisma.$transaction(async (transaction) => {
      const subscription = await transaction.subscription.update({
        where: { id: existing.id },
        data: {
          term,
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
        select: subscriptionSelect,
      });

      await transaction.subscriptionPeriod.create({
        data: {
          subscriptionId: existing.id,
          sequence: (latest?.sequence ?? 0) + 1,
          term,
          startsAt: periodStart,
          endsAt: periodEnd,
          source: dto.source ?? SubscriptionPeriodSource.MANUAL_RENEWAL,
          actorUserId: principal.userId,
        },
      });

      await transaction.companyService.update({
        where: { id: assignmentId },
        data: { expiresAt: periodEnd },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: assignment.companyId,
          action: AUDIT_ACTIONS.SUBSCRIPTION_RENEWED,
          targetType: 'subscription',
          targetId: existing.id,
          metadata: { term, periodEnd: periodEnd.toISOString() },
        },
      });

      return subscription;
    });
  }

  async cancel(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    dto: CancelSubscriptionDto,
  ) {
    const assignment = await this.requireAssignment(principal, assignmentId);
    const existing = assignment.subscription;

    if (!existing) {
      throw new NotFoundException(
        'This service assignment has no subscription.',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      const subscription = await transaction.subscription.update({
        where: { id: existing.id },
        data: dto.atPeriodEnd
          ? { cancelAtPeriodEnd: true, autoRenew: false }
          : { status: 'CANCELLED', autoRenew: false },
        select: subscriptionSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: assignment.companyId,
          action: AUDIT_ACTIONS.SUBSCRIPTION_CANCELLED,
          targetType: 'subscription',
          targetId: existing.id,
          metadata: {
            atPeriodEnd: dto.atPeriodEnd ?? false,
            reason: dto.reason?.trim() || null,
          },
        },
      });

      return subscription;
    });
  }

  /**
   * A CUSTOM term carries no implied length, so it needs an explicit end date.
   * Every other term derives one, resolved to local end-of-day.
   */
  private resolvePeriodEnd(
    term: SubscriptionTerm,
    periodStart: Date,
    endsAt?: string,
  ): Date {
    if (term === SubscriptionTerm.CUSTOM) {
      if (!endsAt) {
        throw new BadRequestException(
          'A custom term requires an explicit end date.',
        );
      }

      const parsed = new Date(endsAt);

      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('The subscription end date is invalid.');
      }

      if (parsed.getTime() <= periodStart.getTime()) {
        throw new BadRequestException(
          'The subscription end date must be after its start date.',
        );
      }

      return endOfDayInZone(parsed, this.timeZone);
    }

    if (endsAt) {
      throw new BadRequestException(
        'An explicit end date is only allowed for a custom term.',
      );
    }

    return endOfDayInZone(addTerm(periodStart, term), this.timeZone);
  }

  private async requireAssignment(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
  ) {
    const assignment = await this.prisma.companyService.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        companyId: true,
        status: true,
        service: { select: { billingModel: true } },
        subscription: {
          select: {
            id: true,
            term: true,
            status: true,
            autoRenew: true,
            cancelAtPeriodEnd: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            gracePeriodDays: true,
            externalBillingRef: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('The service assignment was not found.');
    }

    this.authorization.assertCompanyAccess(principal, assignment.companyId);

    return assignment;
  }
}
