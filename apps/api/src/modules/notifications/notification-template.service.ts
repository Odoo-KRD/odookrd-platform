import { BadRequestException, Injectable } from '@nestjs/common';

import { apiTranslations } from '../../i18n';
import type { ApiLocale } from '../../i18n/types';

export interface NotificationTemplateVariablesByKey {
  'service.assigned': {
    serviceName?: string;
  };
  'subscription.reminder': {
    serviceName?: string;
    milestone: string;
    expiresOn: string;
    daysRemaining?: number;
  };
  'security.notice': {
    message: string;
  };
  'admin.broadcast': {
    title: string;
    body: string;
  };
}

export type NotificationTemplateKey = keyof NotificationTemplateVariablesByKey;

export interface RenderedNotification {
  title: string;
  body: string;
}

@Injectable()
export class NotificationTemplateService {
  render<K extends NotificationTemplateKey>(
    key: K,
    locale: ApiLocale,
    variables: NotificationTemplateVariablesByKey[K],
  ): RenderedNotification {
    const copy = apiTranslations[locale].notifications;

    switch (key) {
      case 'service.assigned': {
        const input =
          variables as NotificationTemplateVariablesByKey['service.assigned'];
        const serviceName = input.serviceName?.trim();

        return {
          title: copy.serviceAssignedSubject,
          body: serviceName
            ? `${copy.serviceAssignedBody}\n\n${serviceName}`
            : copy.serviceAssignedBody,
        };
      }

      case 'subscription.reminder': {
        const input =
          variables as NotificationTemplateVariablesByKey['subscription.reminder'];
        const serviceName = input.serviceName?.trim();

        const heading =
          input.milestone === 'EXPIRED'
            ? copy.subscriptionExpiredSubject
            : input.milestone === 'GRACE_ENDED'
              ? copy.subscriptionGraceEndedSubject
              : copy.subscriptionExpiringSubject;

        const lead =
          input.milestone === 'EXPIRED'
            ? copy.subscriptionExpiredBody
            : input.milestone === 'GRACE_ENDED'
              ? copy.subscriptionGraceEndedBody
              : copy.subscriptionExpiringBody;

        const lines = [lead];

        if (serviceName) {
          lines.push(serviceName);
        }

        lines.push(`${copy.subscriptionExpiresOnLabel}: ${input.expiresOn}`);

        return { title: heading, body: lines.join('\n\n') };
      }

      case 'security.notice': {
        const input =
          variables as NotificationTemplateVariablesByKey['security.notice'];
        const message = input.message.trim();

        if (!message || message.length > 3500) {
          throw new BadRequestException('Notification message is invalid.');
        }

        return {
          title: copy.securityNoticeSubject,
          body: message,
        };
      }

      case 'admin.broadcast': {
        const input =
          variables as NotificationTemplateVariablesByKey['admin.broadcast'];
        const title = input.title.trim();
        const body = input.body.trim();

        if (!title || title.length > 300 || !body || body.length > 3500) {
          throw new BadRequestException(
            'Broadcast notification content is invalid.',
          );
        }

        return { title, body };
      }

      default:
        throw new BadRequestException(
          `Unsupported notification template: ${String(key)}`,
        );
    }
  }
}
