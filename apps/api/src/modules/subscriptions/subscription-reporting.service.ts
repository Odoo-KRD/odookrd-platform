import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { AccountScope } from '../../generated/prisma/enums';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { SubscriptionReportQueryDto } from './dto/subscription-report.dto';
import { resolveEntitlement } from './subscription-entitlement';
import {
  buildRenewalHistoryCsv,
  buildSubscriptionPipelineCsv,
  pipelineBucket,
  summarisePipeline,
} from './subscription-reporting';
import { DEFAULT_PLATFORM_TIMEZONE } from './subscription-timezone';

const MS_PER_DAY = 86_400_000;
const HORIZON_DAYS = 90;

@Injectable()
export class SubscriptionReportingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  /**
   * Subscriptions reaching the end of their period within the reporting
   * horizon, bucketed by urgency.
   */
  async pipeline(
    principal: AuthenticatedPrincipal,
    query: SubscriptionReportQueryDto,
    now: Date = new Date(),
  ) {
    const companyScope = this.resolveScope(principal, query.companyId);
    const horizon = new Date(now.getTime() + HORIZON_DAYS * MS_PER_DAY);

    const rows = await this.prisma.subscription.findMany({
      where: {
        status: { not: 'CANCELLED' },
        currentPeriodEnd: { lte: horizon },
        ...(companyScope
          ? { companyService: { companyId: companyScope } }
          : {}),
      },
      select: {
        id: true,
        term: true,
        status: true,
        autoRenew: true,
        cancelAtPeriodEnd: true,
        gracePeriodDays: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        externalBillingRef: true,
        companyService: {
          select: {
            id: true,
            status: true,
            displayName: true,
            company: { select: { id: true, name: true } },
            service: { select: { name: true, billingModel: true } },
          },
        },
      },
      orderBy: { currentPeriodEnd: 'asc' },
      take: 500,
    });

    const summary = summarisePipeline(rows, now);

    const items = rows
      .map((row) => ({
        subscriptionId: row.id,
        assignmentId: row.companyService.id,
        companyId: row.companyService.company.id,
        companyName: row.companyService.company.name,
        serviceName:
          row.companyService.displayName ?? row.companyService.service.name,
        term: row.term,
        status: row.status,
        autoRenew: row.autoRenew,
        gracePeriodDays: row.gracePeriodDays,
        currentPeriodStart: row.currentPeriodStart,
        currentPeriodEnd: row.currentPeriodEnd,
        externalBillingRef: row.externalBillingRef,
        bucket: pipelineBucket(row.currentPeriodEnd, now),
        entitlement: resolveEntitlement(
          {
            billingModel: row.companyService.service.billingModel,
            assignmentStatus: row.companyService.status,
            subscription: row,
          },
          now,
        ),
      }))
      .filter((item) => item.bucket !== null);

    return { summary, items, timeZone: DEFAULT_PLATFORM_TIMEZONE };
  }

  async pipelineCsv(
    principal: AuthenticatedPrincipal,
    query: SubscriptionReportQueryDto,
    now: Date = new Date(),
  ): Promise<{ filename: string; buffer: Buffer }> {
    const { items } = await this.pipeline(principal, query, now);

    const csv = buildSubscriptionPipelineCsv(
      items.map((item) => ({
        companyName: item.companyName,
        serviceName: item.serviceName,
        term: item.term,
        status: item.entitlement.state,
        periodStart: item.currentPeriodStart.toISOString(),
        periodEnd: item.currentPeriodEnd.toISOString(),
        daysRemaining: item.entitlement.daysRemaining ?? 0,
        gracePeriodDays: item.gracePeriodDays,
        autoRenew: item.autoRenew,
        externalBillingRef: item.externalBillingRef,
      })),
    );

    return {
      filename: `subscription-pipeline-${now.toISOString().slice(0, 10)}.csv`,
      buffer: Buffer.from(csv, 'utf8'),
    };
  }

  async renewalHistoryCsv(
    principal: AuthenticatedPrincipal,
    query: SubscriptionReportQueryDto,
    now: Date = new Date(),
  ): Promise<{ filename: string; buffer: Buffer }> {
    const companyScope = this.resolveScope(principal, query.companyId);

    const periods = await this.prisma.subscriptionPeriod.findMany({
      where: companyScope
        ? {
            subscription: {
              companyService: { companyId: companyScope },
            },
          }
        : {},
      select: {
        sequence: true,
        term: true,
        startsAt: true,
        endsAt: true,
        source: true,
        actor: { select: { email: true } },
        subscription: {
          select: {
            companyService: {
              select: {
                displayName: true,
                company: { select: { name: true } },
                service: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 2000,
    });

    const csv = buildRenewalHistoryCsv(
      periods.map((period) => ({
        companyName: period.subscription.companyService.company.name,
        serviceName:
          period.subscription.companyService.displayName ??
          period.subscription.companyService.service.name,
        sequence: period.sequence,
        term: period.term,
        startsAt: period.startsAt.toISOString(),
        endsAt: period.endsAt.toISOString(),
        source: period.source,
        actorEmail: period.actor?.email ?? null,
      })),
    );

    return {
      filename: `renewal-history-${now.toISOString().slice(0, 10)}.csv`,
      buffer: Buffer.from(csv, 'utf8'),
    };
  }

  /**
   * Company principals are pinned to their own company; a malformed one fails
   * closed rather than reporting across every tenant.
   */
  private resolveScope(
    principal: AuthenticatedPrincipal,
    requestedCompanyId: string | undefined,
  ): string | undefined {
    if (principal.accountScope !== AccountScope.COMPANY) {
      return requestedCompanyId;
    }

    if (!principal.companyId) {
      throw new ForbiddenException('Authorization context is invalid.');
    }

    this.authorization.assertCompanyAccess(principal, principal.companyId);

    return principal.companyId;
  }
}
