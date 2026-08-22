import {
  SendEmailCommand,
  SESv2Client,
  type SendEmailCommandOutput,
} from '@aws-sdk/client-sesv2';
import { Injectable } from '@nestjs/common';

import { SettingsService } from '../../settings/settings.service';
import { NotificationProviderError } from '../notification-provider.error';

const RETRYABLE_AWS_ERRORS = new Set([
  'ThrottlingException',
  'TooManyRequestsException',
  'ServiceUnavailableException',
]);

@Injectable()
export class EmailProviderService {
  constructor(private readonly settings: SettingsService) {}

  async send(
    companyId: string | null,
    destination: string,
    subject: string,
    body: string,
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

    const region = this.configuredString(regionValue);
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
              Body: { Text: { Data: body, Charset: 'UTF-8' } },
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
