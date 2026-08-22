import { Injectable } from '@nestjs/common';

import { SettingsService } from '../../settings/settings.service';
import { NotificationProviderError } from '../notification-provider.error';

interface WhatsAppApiResponse {
  messages?: Array<{ id?: string }>;
}

@Injectable()
export class WhatsAppProviderService {
  constructor(private readonly settings: SettingsService) {}

  async send(
    companyId: string,
    destination: string,
    body: string,
  ): Promise<string | null> {
    const [apiUrlValue, phoneNumberIdValue, accessToken] = await Promise.all([
      this.settings.resolveValue('notifications.whatsapp.api_url', companyId),
      this.settings.resolveValue(
        'notifications.whatsapp.phone_number_id',
        companyId,
      ),
      this.settings.resolveSecret(
        'notifications.whatsapp.access_token',
        companyId,
      ),
    ]);

    const apiUrl = this.configuredString(apiUrlValue);
    const phoneNumberId = this.configuredString(phoneNumberIdValue);
    const normalizedDestination = destination.replace(/^\+/u, '').trim();

    if (!apiUrl || !phoneNumberId || !accessToken) {
      throw new NotificationProviderError(
        'WHATSAPP_CONFIGURATION_MISSING',
        false,
        'Notification delivery configuration is incomplete.',
      );
    }

    if (!/^\d{8,20}$/u.test(normalizedDestination)) {
      throw new NotificationProviderError(
        'WHATSAPP_DESTINATION_INVALID',
        false,
        'Notification destination is invalid.',
      );
    }

    let baseUrl: URL;
    try {
      baseUrl = new URL(apiUrl);
    } catch {
      throw new NotificationProviderError(
        'WHATSAPP_API_URL_INVALID',
        false,
        'Notification delivery configuration is incomplete.',
      );
    }

    if (baseUrl.protocol !== 'https:') {
      throw new NotificationProviderError(
        'WHATSAPP_API_URL_INSECURE',
        false,
        'Notification delivery configuration is incomplete.',
      );
    }

    const endpoint = new URL(
      `${baseUrl.pathname.replace(/\/+$/u, '')}/${encodeURIComponent(phoneNumberId)}/messages`,
      baseUrl,
    );

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedDestination,
          type: 'text',
          text: { preview_url: false, body },
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new NotificationProviderError('WHATSAPP_REQUEST_UNCERTAIN', false);
    }

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new NotificationProviderError(
        `WHATSAPP_HTTP_${String(response.status)}`,
        retryable,
      );
    }

    const payload: unknown = await response.json().catch(() => null);
    return this.messageId(payload);
  }

  private configuredString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private messageId(payload: unknown): string | null {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      Array.isArray(payload)
    ) {
      return null;
    }

    const typed = payload as WhatsAppApiResponse;
    const id = typed.messages?.[0]?.id;
    return typeof id === 'string' && id.length <= 255 ? id : null;
  }
}
