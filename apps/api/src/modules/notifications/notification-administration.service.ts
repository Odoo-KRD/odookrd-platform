import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import {
  AccountScope,
  NotificationChannel,
  NotificationDeliveryStatus,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { ApiLocale } from '../../i18n/types';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { SettingsService } from '../settings/settings.service';
import type { ListNotificationAdministrationDeliveriesDto } from './dto/notification-administration.dto';
import { NotificationAdministrationTemplateService } from './notification-administration-template.service';
import { NotificationProviderError } from './notification-provider.error';
import { WhatsAppProviderService } from './providers/whatsapp-provider.service';
import { EmailProviderService } from './providers/email-provider.service';
import {
  listTwilioContentTemplates,
  type TwilioContentTemplate,
} from './providers/twilio-whatsapp.client';
import { WHATSAPP_TEMPLATE_EVENTS } from './providers/whatsapp-template-catalog';

interface DeliveryLogRow {
  id: string;
  kind: 'NOTIFICATION' | 'INVITATION' | 'TEST';
  company_id: string | null;
  company_name: string | null;
  user_id: string | null;
  recipient: string;
  template_key: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  attempt_count: number;
  provider_message_id: string | null;
  failure_code: string | null;
  created_at: Date;
  last_attempt_at: Date | null;
  sent_at: Date | null;
}

interface CountRow {
  count: number;
}

interface CompanyRow {
  id: string;
  name: string;
}

import type { TestWhatsAppNotificationDto } from './dto/notification-administration.dto';

/** Plain-text test, per language; delivered only inside the 24-hour window. */
const WHATSAPP_TEST_TEXT = {
  ku: 'ئەمە نامەیەکی تاقیکردنەوەیە لە OdooKRD.',
  ar: 'هذه رسالة اختبار من OdooKRD.',
  en: 'This is a test message from OdooKRD.',
} as const;

/**
 * Sample values for testing an approved template, one per variable name used
 * by the invitation, helpdesk and subscription-reminder notifications. The
 * invitation token is not a real one, so its button opens an invalid link.
 */
const WHATSAPP_TEST_VARIABLES: Record<string, string> = {
  reference: 'TKT-2026-00001',
  subject: 'Test',
  companyName: 'OdooKRD',
  serviceName: 'Odoo',
  milestone: '7',
  expiresOn: '2026-12-31',
  expiresAt: '2026-12-31 18:00',
  token: 'test-invitation-token',
  daysRemaining: '7',
};

@Injectable()
export class NotificationAdministrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly emailProvider: EmailProviderService,
    private readonly whatsappProvider: WhatsAppProviderService,
    private readonly templates: NotificationAdministrationTemplateService,
  ) {}

  async providerStatus(principal: AuthenticatedPrincipal) {
    this.assertPlatform(principal);

    const [
      emailEnabledValue,
      emailProviderValue,
      transportValue,
      regionValue,
      smtpPortValue,
      smtpSecurityValue,
      senderEmailValue,
      senderNameValue,
      replyToValue,
      accessKeyId,
      secretAccessKey,
      sessionToken,
      smtpUsername,
      smtpPassword,
      whatsappEnabledValue,
      whatsappApiUrlValue,
      whatsappPhoneNumberIdValue,
      whatsappAccessToken,
    ] = await Promise.all([
      this.settings.resolveValue('notifications.email.enabled', null),
      this.settings.resolveValue('notifications.email.provider', null),
      this.settings.resolveValue(
        'notifications.email.amazon_ses.transport',
        null,
      ),
      this.settings.resolveValue('notifications.email.amazon_ses.region', null),
      this.settings.resolveValue(
        'notifications.email.amazon_ses.smtp_port',
        null,
      ),
      this.settings.resolveValue(
        'notifications.email.amazon_ses.smtp_security',
        null,
      ),
      this.settings.resolveValue('notifications.email.sender_email', null),
      this.settings.resolveValue('notifications.email.sender_name', null),
      this.settings.resolveValue('notifications.email.reply_to', null),
      this.settings.resolveSecret(
        'notifications.email.amazon_ses.access_key_id',
        null,
      ),
      this.settings.resolveSecret(
        'notifications.email.amazon_ses.secret_access_key',
        null,
      ),
      this.settings.resolveSecret(
        'notifications.email.amazon_ses.session_token',
        null,
      ),
      this.settings.resolveSecret(
        'notifications.email.amazon_ses.smtp_username',
        null,
      ),
      this.settings.resolveSecret(
        'notifications.email.amazon_ses.smtp_password',
        null,
      ),
      this.settings.resolveValue('notifications.whatsapp.enabled', null),
      this.settings.resolveValue('notifications.whatsapp.api_url', null),
      this.settings.resolveValue(
        'notifications.whatsapp.phone_number_id',
        null,
      ),
      this.settings.resolveSecret('notifications.whatsapp.access_token', null),
    ]);

    const enabled = emailEnabledValue === true;
    const provider = this.stringValue(emailProviderValue);
    const transport = transportValue === 'smtp' ? 'smtp' : 'api';
    const region = this.stringValue(regionValue);
    const smtpPort =
      typeof smtpPortValue === 'number' &&
      Number.isSafeInteger(smtpPortValue) &&
      smtpPortValue >= 1 &&
      smtpPortValue <= 65535
        ? smtpPortValue
        : null;
    const smtpSecurity =
      smtpSecurityValue === 'starttls' || smtpSecurityValue === 'tls'
        ? smtpSecurityValue
        : null;
    const senderEmail = this.stringValue(senderEmailValue);
    const senderName = this.stringValue(senderNameValue);
    const replyTo = this.stringValue(replyToValue);

    const whatsappEnabled = whatsappEnabledValue === true;
    const whatsappApiUrl = this.stringValue(whatsappApiUrlValue);
    const whatsappPhoneNumberId = this.stringValue(whatsappPhoneNumberIdValue);

    const twilio = await this.twilioStatus();

    const apiReady = Boolean(
      region && senderEmail && accessKeyId && secretAccessKey,
    );
    const smtpReady = Boolean(
      region &&
      senderEmail &&
      smtpPort !== null &&
      smtpSecurity &&
      smtpUsername &&
      smtpPassword,
    );

    return {
      email: {
        enabled,
        provider,
        transport,
        ready:
          enabled &&
          provider === 'amazon_ses' &&
          (transport === 'smtp' ? smtpReady : apiReady),
        region,
        senderEmail,
        senderName,
        replyTo,
        accessKeyId: this.maskedSecret(accessKeyId, true),
        secretAccessKey: this.maskedSecret(secretAccessKey, false),
        sessionToken: this.maskedSecret(sessionToken, false),
        smtp: {
          host: region ? `email-smtp.${region}.amazonaws.com` : null,
          port: smtpPort,
          security: smtpSecurity,
          username: this.maskedSecret(smtpUsername, true),
          password: this.maskedSecret(smtpPassword, false),
        },
      },
      whatsapp: {
        enabled: whatsappEnabled,
        provider: twilio.provider,
        ready:
          whatsappEnabled &&
          (twilio.provider === 'twilio'
            ? twilio.ready
            : Boolean(
                whatsappApiUrl && whatsappPhoneNumberId && whatsappAccessToken,
              )),
        twilio: twilio.status,
        apiUrl: whatsappApiUrl,
        phoneNumberId: whatsappPhoneNumberId,
        accessToken: this.maskedSecret(whatsappAccessToken, false),
      },
    };
  }

  async testEmail(
    principal: AuthenticatedPrincipal,
    recipient: string,
    locale: ApiLocale,
  ) {
    this.assertPlatform(principal);
    await this.enforceTestRateLimit(principal.userId);

    const normalizedRecipient = recipient.trim().toLowerCase();
    const now = new Date();

    const attempt = await this.prisma.notificationProviderTest.create({
      data: {
        actorUserId: principal.userId,
        channel: NotificationChannel.EMAIL,
        destination: normalizedRecipient,
        status: NotificationDeliveryStatus.PROCESSING,
        attemptCount: 1,
        lastAttemptAt: now,
      },
      select: { id: true },
    });

    const rendered = this.templates.renderTestEmail(locale);

    try {
      const providerMessageId = await this.emailProvider.send(
        null,
        normalizedRecipient,
        rendered.subject,
        rendered.body,
      );
      const sentAt = new Date();

      const result = await this.prisma.notificationProviderTest.update({
        where: { id: attempt.id },
        data: {
          status: NotificationDeliveryStatus.SENT,
          providerMessageId,
          failureCode: null,
          sentAt,
        },
        select: {
          id: true,
          channel: true,
          destination: true,
          status: true,
          providerMessageId: true,
          failureCode: true,
          sentAt: true,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: null,
          action: 'notification.provider.email.test.sent',
          targetType: 'notification_provider_test',
          targetId: attempt.id,
          metadata: {
            status: result.status,
          },
        },
      });

      return {
        id: result.id,
        channel: 'EMAIL' as const,
        recipient: result.destination,
        status: result.status,
        providerMessageId: result.providerMessageId,
        failureCode: result.failureCode,
        sentAt: result.sentAt,
      };
    } catch (error: unknown) {
      const failureCode =
        error instanceof NotificationProviderError
          ? this.safeFailureCode(error.code)
          : 'EMAIL_TEST_FAILED';

      const result = await this.prisma.notificationProviderTest.update({
        where: { id: attempt.id },
        data: {
          status: NotificationDeliveryStatus.FAILED,
          providerMessageId: null,
          failureCode,
          sentAt: null,
        },
        select: {
          id: true,
          channel: true,
          destination: true,
          status: true,
          providerMessageId: true,
          failureCode: true,
          sentAt: true,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: null,
          action: 'notification.provider.email.test.failed',
          targetType: 'notification_provider_test',
          targetId: attempt.id,
          metadata: {
            status: result.status,
            failureCode,
          },
        },
      });

      return {
        id: result.id,
        channel: 'EMAIL' as const,
        recipient: result.destination,
        status: result.status,
        providerMessageId: result.providerMessageId,
        failureCode: result.failureCode,
        sentAt: result.sentAt,
      };
    }
  }

  /**
   * Sends one WhatsApp test through the active provider, recorded like the
   * email test (rate-limited, stored in notification_provider_tests, audited).
   */
  async testWhatsApp(
    principal: AuthenticatedPrincipal,
    input: TestWhatsAppNotificationDto,
  ) {
    this.assertPlatform(principal);
    await this.enforceTestRateLimit(principal.userId);

    const destination = input.destination.replace(/[\s()-]/gu, '');
    const attempt = await this.prisma.notificationProviderTest.create({
      data: {
        actorUserId: principal.userId,
        channel: NotificationChannel.WHATSAPP,
        destination,
        status: NotificationDeliveryStatus.PROCESSING,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      },
      select: { id: true },
    });

    const body = WHATSAPP_TEST_TEXT[input.locale];
    let status: NotificationDeliveryStatus = NotificationDeliveryStatus.SENT;
    let providerMessageId: string | null = null;
    let failureCode: string | null = null;

    try {
      providerMessageId = await this.whatsappProvider.send(
        null,
        destination,
        body,
        input.templateKey
          ? {
              templateKey: input.templateKey,
              locale: input.locale,
              variables: WHATSAPP_TEST_VARIABLES,
            }
          : undefined,
      );
    } catch (error: unknown) {
      status = NotificationDeliveryStatus.FAILED;
      failureCode =
        error instanceof NotificationProviderError
          ? this.safeFailureCode(error.code)
          : 'WHATSAPP_TEST_FAILED';
    }

    const result = await this.prisma.notificationProviderTest.update({
      where: { id: attempt.id },
      data: {
        status,
        providerMessageId,
        failureCode,
        sentAt: status === NotificationDeliveryStatus.SENT ? new Date() : null,
      },
      select: {
        id: true,
        destination: true,
        status: true,
        providerMessageId: true,
        failureCode: true,
        sentAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: principal.userId,
        companyId: null,
        action:
          status === NotificationDeliveryStatus.SENT
            ? 'notification.provider.whatsapp.test.sent'
            : 'notification.provider.whatsapp.test.failed',
        targetType: 'notification_provider_test',
        targetId: attempt.id,
        metadata: {
          status: result.status,
          failureCode,
          templateKey: input.templateKey ?? null,
        },
      },
    });

    return {
      id: result.id,
      channel: 'WHATSAPP' as const,
      recipient: result.destination,
      status: result.status,
      providerMessageId: result.providerMessageId,
      failureCode: result.failureCode,
      sentAt: result.sentAt,
    };
  }

  /**
   * The platform's template-capable notification types and the account's
   * odookrd* Twilio Content Templates, for the template mapping tab. A
   * Twilio failure is returned as an error code rather than thrown, so the
   * tab can still show the saved mapping.
   */
  async whatsappTemplates(principal: AuthenticatedPrincipal) {
    this.assertPlatform(principal);

    const [provider, accountSidValue, authToken] = await Promise.all([
      this.settings.resolveValue('notifications.whatsapp.provider', null),
      this.settings.resolveValue(
        'notifications.whatsapp.twilio.account_sid',
        null,
      ),
      this.settings.resolveSecret(
        'notifications.whatsapp.twilio.auth_token',
        null,
      ),
    ]);

    const accountSid = this.stringValue(accountSidValue);
    let templates: TwilioContentTemplate[] = [];
    let error: string | null = null;

    if (!accountSid || !authToken) {
      error = 'WHATSAPP_CONFIGURATION_MISSING';
    } else {
      try {
        templates = await listTwilioContentTemplates({ accountSid, authToken });
      } catch (caught: unknown) {
        error =
          caught instanceof NotificationProviderError
            ? this.safeFailureCode(caught.code)
            : 'TWILIO_CONTENT_FAILED';
      }
    }

    return {
      provider: this.stringValue(provider) === 'twilio' ? 'twilio' : 'meta',
      events: WHATSAPP_TEMPLATE_EVENTS.map((event) => ({
        key: event.key,
        slug: event.slug,
        variables: [...event.variables],
      })),
      templates,
      error,
      fetchedAt: new Date().toISOString(),
    };
  }

  /** Twilio configuration for the status page, secrets masked. */
  private async twilioStatus() {
    const [provider, accountSid, authToken, primary, fallback, templates] =
      await Promise.all([
        this.settings.resolveValue('notifications.whatsapp.provider', null),
        this.settings.resolveValue(
          'notifications.whatsapp.twilio.account_sid',
          null,
        ),
        this.settings.resolveSecret(
          'notifications.whatsapp.twilio.auth_token',
          null,
        ),
        this.settings.resolveValue(
          'notifications.whatsapp.twilio.primary_sender',
          null,
        ),
        this.settings.resolveValue(
          'notifications.whatsapp.twilio.fallback_sender',
          null,
        ),
        this.settings.resolveValue(
          'notifications.whatsapp.twilio.content_templates',
          null,
        ),
      ]);

    const sid = this.stringValue(accountSid);
    const primarySender = this.stringValue(primary);
    let templateCount = 0;
    let templatesValid = true;
    const map = this.stringValue(templates);

    if (map) {
      try {
        const parsed: unknown = JSON.parse(map);
        templateCount =
          typeof parsed === 'object' && parsed !== null
            ? Object.keys(parsed).length
            : 0;
      } catch {
        templatesValid = false;
      }
    }

    return {
      provider: this.stringValue(provider) === 'twilio' ? 'twilio' : 'meta',
      ready: Boolean(sid && authToken && primarySender && templatesValid),
      status: {
        accountSid: this.maskedSecret(sid, true),
        authToken: this.maskedSecret(authToken, false),
        primarySender,
        fallbackSender: this.stringValue(fallback),
        templateCount,
        templatesValid,
      },
    };
  }

  async listDeliveries(
    principal: AuthenticatedPrincipal,
    query: ListNotificationAdministrationDeliveriesDto,
  ) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const conditions: Prisma.Sql[] = [];

    if (principal.accountScope === AccountScope.COMPANY) {
      if (!principal.companyId) {
        throw new ForbiddenException('Company account scope is invalid.');
      }
      conditions.push(Prisma.sql`"company_id" = ${principal.companyId}::uuid`);
    } else if (principal.accountScope !== AccountScope.PLATFORM) {
      throw new ForbiddenException('Notification administration is forbidden.');
    }

    if (
      principal.accountScope === AccountScope.COMPANY &&
      query.companyId &&
      query.companyId !== principal.companyId
    ) {
      throw new ForbiddenException(
        'Cross-company delivery access is forbidden.',
      );
    }

    if (query.companyId) {
      conditions.push(Prisma.sql`"company_id" = ${query.companyId}::uuid`);
    }
    if (query.kind) {
      conditions.push(Prisma.sql`"kind" = ${query.kind}`);
    }
    if (query.channel) {
      conditions.push(
        Prisma.sql`"channel" = ${query.channel}::notification_channel`,
      );
    }
    if (query.status) {
      conditions.push(
        Prisma.sql`"status" = ${query.status}::notification_delivery_status`,
      );
    }

    const where =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    const [rows, countRows, companies] = await Promise.all([
      this.prisma.$queryRaw<DeliveryLogRow[]>(
        Prisma.sql`
          SELECT
            "id",
            "kind",
            "company_id",
            "company_name",
            "user_id",
            "recipient",
            "template_key",
            "channel",
            "status",
            "attempt_count",
            "provider_message_id",
            "failure_code",
            "created_at",
            "last_attempt_at",
            "sent_at"
          FROM "notification_delivery_log"
          ${where}
          ORDER BY "created_at" DESC, "id" DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `,
      ),
      this.prisma.$queryRaw<CountRow[]>(
        Prisma.sql`
          SELECT COUNT(*)::int AS "count"
          FROM "notification_delivery_log"
          ${where}
        `,
      ),
      principal.accountScope === AccountScope.PLATFORM
        ? this.prisma.$queryRaw<CompanyRow[]>(
            Prisma.sql`
              SELECT DISTINCT
                "company_id" AS "id",
                "company_name" AS "name"
              FROM "notification_delivery_log"
              WHERE "company_id" IS NOT NULL
                AND "company_name" IS NOT NULL
              ORDER BY "name" ASC
            `,
          )
        : Promise.resolve<CompanyRow[]>([]),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        companyId: row.company_id,
        companyName: row.company_name,
        userId: row.user_id,
        recipient: row.recipient,
        templateKey: row.template_key,
        channel: row.channel,
        status: row.status,
        attemptCount: row.attempt_count,
        providerMessageId: row.provider_message_id,
        failureCode: row.failure_code,
        createdAt: row.created_at,
        lastAttemptAt: row.last_attempt_at,
        sentAt: row.sent_at,
      })),
      companies: companies.map((company) => ({
        id: company.id,
        name: company.name,
      })),
      pagination: {
        limit,
        offset,
        total: countRows[0]?.count ?? 0,
      },
    };
  }

  private async enforceTestRateLimit(actorUserId: string): Promise<void> {
    const since = new Date(Date.now() - 60_000);
    const attempts = await this.prisma.notificationProviderTest.count({
      where: {
        actorUserId,
        createdAt: { gte: since },
      },
    });

    if (attempts >= 5) {
      throw new HttpException(
        'Wait before sending another provider test.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private assertPlatform(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException(
        'Platform notification provider administration is forbidden.',
      );
    }
  }

  private stringValue(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private maskedSecret(
    value: string | null,
    revealEdges: boolean,
  ): { configured: boolean; masked: string | null } {
    if (!value) {
      return { configured: false, masked: null };
    }

    if (revealEdges && value.length >= 8) {
      return {
        configured: true,
        masked: `${value.slice(0, 4)}••••••••${value.slice(-4)}`,
      };
    }

    return {
      configured: true,
      masked: '••••••••••••••••',
    };
  }

  private safeFailureCode(code: string): string {
    const normalized = code
      .toUpperCase()
      .replace(/[^A-Z0-9_]/gu, '_')
      .slice(0, 80);
    return normalized || 'EMAIL_TEST_FAILED';
  }
}
