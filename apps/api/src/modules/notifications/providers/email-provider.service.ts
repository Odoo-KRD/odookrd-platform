import {
  SendEmailCommand,
  SESv2Client,
  type SendEmailCommandOutput,
} from '@aws-sdk/client-sesv2';
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { SettingsService } from '../../settings/settings.service';
import { NotificationProviderError } from '../notification-provider.error';

const RETRYABLE_AWS_ERRORS = new Set([
  'ThrottlingException',
  'TooManyRequestsException',
  'ServiceUnavailableException',
]);

const RETRYABLE_SMTP_CODES = new Set([
  'ECONNECTION',
  'ECONNRESET',
  'EDNS',
  'ESOCKET',
  'ETIMEDOUT',
]);

type SesTransport = 'api' | 'smtp';
type SesSmtpSecurity = 'starttls' | 'tls';

@Injectable()
export class EmailProviderService {
  constructor(private readonly settings: SettingsService) {}

  async send(
    companyId: string | null,
    destination: string,
    subject: string,
    body: string,
    html?: string,
  ): Promise<string | null> {
    const provider = await this.settings.resolveValue(
      'notifications.email.provider',
      companyId,
    );

    if (provider !== 'amazon_ses') {
      throw new NotificationProviderError(
        'EMAIL_PROVIDER_UNSUPPORTED',
        false,
        'Notification delivery configuration is incomplete.',
      );
    }

    const transportValue = await this.settings.resolveValue(
      'notifications.email.amazon_ses.transport',
      companyId,
    );
    const transport = this.sesTransport(transportValue);

    if (transport === 'smtp') {
      return this.sendSmtp(companyId, destination, subject, body, html);
    }

    return this.sendApi(companyId, destination, subject, body, html);
  }

  private async sendApi(
    companyId: string | null,
    destination: string,
    subject: string,
    body: string,
    html?: string,
  ): Promise<string | null> {
    const [
      regionValue,
      senderValue,
      senderNameValue,
      replyToValue,
      accessKeyId,
      secretAccessKey,
      sessionToken,
    ] = await Promise.all([
      this.settings.resolveValue(
        'notifications.email.amazon_ses.region',
        companyId,
      ),
      this.settings.resolveValue('notifications.email.sender_email', companyId),
      this.settings.resolveValue('notifications.email.sender_name', companyId),
      this.settings.resolveValue('notifications.email.reply_to', companyId),
      this.settings.resolveSecret(
        'notifications.email.amazon_ses.access_key_id',
        companyId,
      ),
      this.settings.resolveSecret(
        'notifications.email.amazon_ses.secret_access_key',
        companyId,
      ),
      this.settings.resolveSecret(
        'notifications.email.amazon_ses.session_token',
        companyId,
      ),
    ]);

    const region = this.configuredRegion(regionValue);
    const senderEmail = this.configuredString(senderValue);
    const senderName = this.optionalHeaderString(senderNameValue);
    const replyTo = this.optionalHeaderString(replyToValue);

    if (!region || !senderEmail || !accessKeyId || !secretAccessKey) {
      throw new NotificationProviderError(
        'SES_CONFIGURATION_MISSING',
        false,
        'Notification delivery configuration is incomplete.',
      );
    }

    const fromAddress = senderName
      ? `${this.quoteDisplayName(senderName)} <${senderEmail}>`
      : senderEmail;

    const client = new SESv2Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
      },
    });

    try {
      const result: SendEmailCommandOutput = await client.send(
        new SendEmailCommand({
          FromEmailAddress: fromAddress,
          Destination: { ToAddresses: [destination] },
          ReplyToAddresses: replyTo ? [replyTo] : undefined,
          Content: {
            Simple: {
              Subject: { Data: subject, Charset: 'UTF-8' },
              Body: {
                Text: { Data: body, Charset: 'UTF-8' },
                ...(html ? { Html: { Data: html, Charset: 'UTF-8' } } : {}),
              },
            },
          },
        }),
      );

      return result.MessageId ?? null;
    } catch (error: unknown) {
      const retryable =
        error instanceof Error && RETRYABLE_AWS_ERRORS.has(error.name);
      throw new NotificationProviderError('SES_REQUEST_FAILED', retryable);
    } finally {
      client.destroy();
    }
  }

  private async sendSmtp(
    companyId: string | null,
    destination: string,
    subject: string,
    body: string,
    html?: string,
  ): Promise<string | null> {
    const [
      regionValue,
      portValue,
      securityValue,
      senderValue,
      senderNameValue,
      replyToValue,
      username,
      password,
    ] = await Promise.all([
      this.settings.resolveValue(
        'notifications.email.amazon_ses.region',
        companyId,
      ),
      this.settings.resolveValue(
        'notifications.email.amazon_ses.smtp_port',
        companyId,
      ),
      this.settings.resolveValue(
        'notifications.email.amazon_ses.smtp_security',
        companyId,
      ),
      this.settings.resolveValue('notifications.email.sender_email', companyId),
      this.settings.resolveValue('notifications.email.sender_name', companyId),
      this.settings.resolveValue('notifications.email.reply_to', companyId),
      this.settings.resolveSecret(
        'notifications.email.amazon_ses.smtp_username',
        companyId,
      ),
      this.settings.resolveSecret(
        'notifications.email.amazon_ses.smtp_password',
        companyId,
      ),
    ]);

    const region = this.configuredRegion(regionValue);
    const port = this.smtpPort(portValue);
    const security = this.smtpSecurity(securityValue);
    const senderEmail = this.configuredString(senderValue);
    const senderName = this.optionalHeaderString(senderNameValue);
    const replyTo = this.optionalHeaderString(replyToValue);

    if (
      !region ||
      port === null ||
      !security ||
      !senderEmail ||
      !username ||
      !password
    ) {
      throw new NotificationProviderError(
        'SES_SMTP_CONFIGURATION_MISSING',
        false,
        'Notification delivery configuration is incomplete.',
      );
    }

    const host = `email-smtp.${region}.amazonaws.com`;
    const fromAddress = senderName
      ? `${this.quoteDisplayName(senderName)} <${senderEmail}>`
      : senderEmail;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: security === 'tls',
      requireTLS: security === 'starttls',
      auth: {
        user: username,
        pass: password,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      tls: {
        minVersion: 'TLSv1.2',
        servername: host,
      },
    });

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: destination,
        replyTo: replyTo ?? undefined,
        subject,
        text: body,
        html: html ?? undefined,
      });

      return null;
    } catch (error: unknown) {
      throw this.smtpError(error);
    } finally {
      transporter.close();
    }
  }

  private smtpError(error: unknown): NotificationProviderError {
    const code = this.errorString(error, 'code');
    const responseCode = this.errorNumber(error, 'responseCode');

    if (code === 'EAUTH' || responseCode === 535) {
      return new NotificationProviderError(
        'SES_SMTP_AUTH_FAILED',
        false,
        'Notification provider authentication failed.',
      );
    }

    if (
      (code && RETRYABLE_SMTP_CODES.has(code)) ||
      (responseCode !== null && responseCode >= 400 && responseCode < 500)
    ) {
      return new NotificationProviderError(
        responseCode !== null && responseCode >= 400 && responseCode < 500
          ? 'SES_SMTP_TEMPORARY_FAILURE'
          : 'SES_SMTP_CONNECTION_FAILED',
        true,
      );
    }

    return new NotificationProviderError('SES_SMTP_REQUEST_FAILED', false);
  }

  private errorString(error: unknown, key: string): string | null {
    if (typeof error !== 'object' || error === null || Array.isArray(error)) {
      return null;
    }

    const record = error as Record<string, unknown>;
    const value = record[key];
    return typeof value === 'string' ? value : null;
  }

  private errorNumber(error: unknown, key: string): number | null {
    if (typeof error !== 'object' || error === null || Array.isArray(error)) {
      return null;
    }

    const record = error as Record<string, unknown>;
    const value = record[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private sesTransport(value: unknown): SesTransport {
    return value === 'smtp' ? 'smtp' : 'api';
  }

  private smtpSecurity(value: unknown): SesSmtpSecurity | null {
    return value === 'starttls' || value === 'tls' ? value : null;
  }

  private smtpPort(value: unknown): number | null {
    return typeof value === 'number' &&
      Number.isSafeInteger(value) &&
      value >= 1 &&
      value <= 65535
      ? value
      : null;
  }

  private configuredRegion(value: unknown): string | null {
    const region = this.configuredString(value);
    return region && /^[a-z0-9-]{3,32}$/u.test(region) ? region : null;
  }

  private configuredString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized && !/[\r\n]/u.test(normalized) ? normalized : null;
  }

  private optionalHeaderString(value: unknown): string | null {
    return this.configuredString(value);
  }

  private quoteDisplayName(value: string): string {
    return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
  }
}
