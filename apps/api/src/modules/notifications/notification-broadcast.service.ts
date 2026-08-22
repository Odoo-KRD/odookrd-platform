import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import {
  AccountScope,
  CompanyStatus,
  NotificationChannel,
  UserStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { SendNotificationBroadcastDto } from './dto/notification-broadcast.dto';
import { NotificationsService } from './notifications.service';

const MAX_BROADCAST_RECIPIENTS = 5_000;
const BROADCAST_BATCH_SIZE = 100;
const BROADCAST_RATE_LIMIT = 10;
const BROADCAST_RATE_WINDOW_MS = 10 * 60_000;

interface AudienceCompanyRow {
  id: string;
  name: string;
  recipient_count: number;
  whatsapp_count: number;
}

interface BroadcastTarget {
  id: string;
  companyId: string | null;
  email: string;
  whatsappNumber: string | null;
}

@Injectable()
export class NotificationBroadcastService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async options(principal: AuthenticatedPrincipal) {
    const rows =
      principal.accountScope === AccountScope.PLATFORM
        ? await this.platformAudienceRows()
        : await this.companyAudienceRows(principal);

    const companies = rows.map((row) => ({
      id: row.id,
      name: row.name,
      recipientCount: row.recipient_count,
      emailCount: row.recipient_count,
      whatsappCount: row.whatsapp_count,
      overLimit: row.recipient_count > MAX_BROADCAST_RECIPIENTS,
    }));

    const recipientCount = rows.reduce(
      (total, row) => total + row.recipient_count,
      0,
    );
    const whatsappCount = rows.reduce(
      (total, row) => total + row.whatsapp_count,
      0,
    );

    return {
      isPlatform: principal.accountScope === AccountScope.PLATFORM,
      maxRecipients: MAX_BROADCAST_RECIPIENTS,
      allCustomers:
        principal.accountScope === AccountScope.PLATFORM
          ? {
              companyCount: rows.filter((row) => row.recipient_count > 0)
                .length,
              recipientCount,
              emailCount: recipientCount,
              whatsappCount,
              overLimit: recipientCount > MAX_BROADCAST_RECIPIENTS,
            }
          : null,
      companies,
    };
  }

  async send(
    principal: AuthenticatedPrincipal,
    input: SendNotificationBroadcastDto,
  ) {
    await this.enforceRateLimit(principal.userId);

    const title = input.title.trim();
    const body = input.body.trim();

    if (!title || !body) {
      throw new BadRequestException(
        'Notification title and message are required.',
      );
    }

    const targets = await this.resolveTargets(principal, input);

    if (targets.length < 1) {
      throw new BadRequestException(
        'The selected audience has no active customer users.',
      );
    }

    if (targets.length > MAX_BROADCAST_RECIPIENTS) {
      throw new BadRequestException(
        'The selected audience exceeds the broadcast safety limit.',
      );
    }

    const channels = input.channels.map((channel) =>
      this.notificationChannel(channel),
    );

    const grouped = new Map<string, BroadcastTarget[]>();

    for (const target of targets) {
      if (!target.companyId) {
        throw new BadRequestException(
          'A broadcast recipient is missing company scope.',
        );
      }

      const current = grouped.get(target.companyId) ?? [];
      current.push(target);
      grouped.set(target.companyId, current);
    }

    let notificationCount = 0;
    let createdNotificationCount = 0;

    for (const [companyId, companyTargets] of grouped) {
      for (
        let offset = 0;
        offset < companyTargets.length;
        offset += BROADCAST_BATCH_SIZE
      ) {
        const batch = companyTargets.slice(
          offset,
          offset + BROADCAST_BATCH_SIZE,
        );
        const batchIndex = Math.floor(offset / BROADCAST_BATCH_SIZE);

        const result = await this.notifications.publish({
          companyId,
          idempotencyKey: `broadcast:${input.requestId}:${companyId}:${String(batchIndex)}`,
          templateKey: 'admin.broadcast',
          variables: {
            title,
            body,
          },
          recipients: batch.map((target) => ({
            userId: target.id,
            locale: input.locale,
            whatsappAddress: target.whatsappNumber,
          })),
          channels,
          actionUrl: input.actionUrl ?? null,
          actorUserId: principal.userId,
          dispatchImmediately: false,
        });

        notificationCount += 1;
        if (result.created) createdNotificationCount += 1;
      }
    }

    const companyId =
      principal.accountScope === AccountScope.COMPANY
        ? principal.companyId
        : input.audience === 'COMPANY'
          ? (input.companyId ?? null)
          : null;

    if (createdNotificationCount > 0) {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId,
          action: 'notification.broadcast.queued',
          targetType: 'notification_broadcast',
          targetId: input.requestId,
          metadata: {
            audience: input.audience,
            selectedCompanyId: input.audience === 'COMPANY' ? companyId : null,
            companyCount: grouped.size,
            recipientCount: targets.length,
            notificationCount,
            channels,
            locale: input.locale,
          },
        },
      });
    }

    return {
      requestId: input.requestId,
      created: createdNotificationCount > 0,
      companyCount: grouped.size,
      recipientCount: targets.length,
      notificationCount,
      channels,
      externalDeliveryQueued: channels.some(
        (channel) =>
          channel === NotificationChannel.EMAIL ||
          channel === NotificationChannel.WHATSAPP,
      ),
    };
  }

  private async platformAudienceRows(): Promise<AudienceCompanyRow[]> {
    return this.prisma.$queryRaw<AudienceCompanyRow[]>`
      SELECT
        c."id",
        c."name",
        COUNT(u."id")::int AS "recipient_count",
        COUNT(u."whatsapp_number")::int AS "whatsapp_count"
      FROM "companies" c
      LEFT JOIN "users" u
        ON u."company_id" = c."id"
       AND u."account_scope" = 'COMPANY'
       AND u."status" = 'ACTIVE'
      WHERE c."status" = 'ACTIVE'
      GROUP BY c."id", c."name"
      ORDER BY c."name" ASC, c."id" ASC
    `;
  }

  private async companyAudienceRows(
    principal: AuthenticatedPrincipal,
  ): Promise<AudienceCompanyRow[]> {
    const companyId = this.requireCompanyPrincipal(principal);

    return this.prisma.$queryRaw<AudienceCompanyRow[]>`
      SELECT
        c."id",
        c."name",
        COUNT(u."id")::int AS "recipient_count",
        COUNT(u."whatsapp_number")::int AS "whatsapp_count"
      FROM "companies" c
      LEFT JOIN "users" u
        ON u."company_id" = c."id"
       AND u."account_scope" = 'COMPANY'
       AND u."status" = 'ACTIVE'
      WHERE c."id" = ${companyId}::uuid
        AND c."status" = 'ACTIVE'
      GROUP BY c."id", c."name"
    `;
  }

  private async resolveTargets(
    principal: AuthenticatedPrincipal,
    input: SendNotificationBroadcastDto,
  ): Promise<BroadcastTarget[]> {
    if (principal.accountScope === AccountScope.COMPANY) {
      const companyId = this.requireCompanyPrincipal(principal);

      if (
        input.audience !== 'COMPANY' ||
        (input.companyId && input.companyId !== companyId)
      ) {
        throw new ForbiddenException(
          'Company administrators can broadcast only inside their own company.',
        );
      }

      return this.activeCompanyUsers(companyId);
    }

    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException('Notification broadcast scope is invalid.');
    }

    if (input.audience === 'COMPANY') {
      if (!input.companyId) {
        throw new BadRequestException('Choose a company for this broadcast.');
      }

      return this.activeCompanyUsers(input.companyId);
    }

    const activeCompanies = await this.prisma.company.findMany({
      where: { status: CompanyStatus.ACTIVE },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    if (activeCompanies.length < 1) {
      return [];
    }

    const companyIds = activeCompanies.map((company) => company.id);

    const total = await this.prisma.user.count({
      where: {
        accountScope: AccountScope.COMPANY,
        status: UserStatus.ACTIVE,
        companyId: { in: companyIds },
      },
    });

    if (total > MAX_BROADCAST_RECIPIENTS) {
      throw new BadRequestException(
        'The selected audience exceeds the broadcast safety limit.',
      );
    }

    return this.prisma.user.findMany({
      where: {
        accountScope: AccountScope.COMPANY,
        status: UserStatus.ACTIVE,
        companyId: { in: companyIds },
      },
      select: {
        id: true,
        companyId: true,
        email: true,
        whatsappNumber: true,
      },
      orderBy: [{ companyId: 'asc' }, { id: 'asc' }],
    });
  }

  private async activeCompanyUsers(
    companyId: string,
  ): Promise<BroadcastTarget[]> {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        status: CompanyStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!company) {
      throw new BadRequestException(
        'The selected company is unavailable for notifications.',
      );
    }

    const total = await this.prisma.user.count({
      where: {
        companyId,
        accountScope: AccountScope.COMPANY,
        status: UserStatus.ACTIVE,
      },
    });

    if (total > MAX_BROADCAST_RECIPIENTS) {
      throw new BadRequestException(
        'The selected audience exceeds the broadcast safety limit.',
      );
    }

    return this.prisma.user.findMany({
      where: {
        companyId,
        accountScope: AccountScope.COMPANY,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        companyId: true,
        email: true,
        whatsappNumber: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  private async enforceRateLimit(actorUserId: string): Promise<void> {
    const since = new Date(Date.now() - BROADCAST_RATE_WINDOW_MS);

    const count = await this.prisma.auditLog.count({
      where: {
        actorUserId,
        action: 'notification.broadcast.queued',
        createdAt: { gte: since },
      },
    });

    if (count >= BROADCAST_RATE_LIMIT) {
      throw new HttpException(
        'Wait before sending another bulk notification.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private requireCompanyPrincipal(principal: AuthenticatedPrincipal): string {
    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException(
        'A valid company administrator scope is required.',
      );
    }

    return principal.companyId;
  }

  private notificationChannel(
    value: 'IN_APP' | 'EMAIL' | 'WHATSAPP',
  ): NotificationChannel {
    if (value === 'IN_APP') {
      return NotificationChannel.IN_APP;
    }
    if (value === 'EMAIL') {
      return NotificationChannel.EMAIL;
    }
    return NotificationChannel.WHATSAPP;
  }
}
