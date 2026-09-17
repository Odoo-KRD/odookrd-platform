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
  'admin.invitation.accepted': {
    companyName?: string;
    userName?: string;
  };
  'admin.course.completed': {
    companyName?: string;
    learnerName?: string;
    courseTitle?: string;
  };
  'admin.renewal.requested': {
    companyName?: string;
    serviceName?: string;
  };
  'admin.certificate.issued': {
    companyName?: string;
    learnerName?: string;
    courseTitle?: string;
  };
}

export type NotificationTemplateKey = keyof NotificationTemplateVariablesByKey;

export interface RenderedNotification {
  title: string;
  body: string;
}

@Injectable()
export class NotificationTemplateService {
  /** Admin events read as a lead line plus the "Label: value" facts we have. */
  private withDetails(
    lead: string,
    details: readonly (readonly [string, string | undefined])[],
  ): string {
    const lines = details
      .map(([label, value]) => [label, value?.trim()] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1]))
      .map(([label, value]) => `${label}: ${value.slice(0, 200)}`);

    return lines.length === 0 ? lead : `${lead}\n\n${lines.join('\n')}`;
  }

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

      case 'admin.invitation.accepted': {
        const input =
          variables as NotificationTemplateVariablesByKey['admin.invitation.accepted'];

        return {
          title: copy.adminInvitationAcceptedSubject,
          body: this.withDetails(copy.adminInvitationAcceptedBody, [
            [copy.adminCompanyLabel, input.companyName],
            [copy.adminUserLabel, input.userName],
          ]),
        };
      }

      case 'admin.course.completed': {
        const input =
          variables as NotificationTemplateVariablesByKey['admin.course.completed'];

        return {
          title: copy.adminCourseCompletedSubject,
          body: this.withDetails(copy.adminCourseCompletedBody, [
            [copy.adminCompanyLabel, input.companyName],
            [copy.adminUserLabel, input.learnerName],
            [copy.adminCourseLabel, input.courseTitle],
          ]),
        };
      }

      case 'admin.renewal.requested': {
        const input =
          variables as NotificationTemplateVariablesByKey['admin.renewal.requested'];

        return {
          title: copy.adminRenewalRequestedSubject,
          body: this.withDetails(copy.adminRenewalRequestedBody, [
            [copy.adminCompanyLabel, input.companyName],
            [copy.adminServiceLabel, input.serviceName],
          ]),
        };
      }

      case 'admin.certificate.issued': {
        const input =
          variables as NotificationTemplateVariablesByKey['admin.certificate.issued'];

        return {
          title: copy.adminCertificateIssuedSubject,
          body: this.withDetails(copy.adminCertificateIssuedBody, [
            [copy.adminCompanyLabel, input.companyName],
            [copy.adminUserLabel, input.learnerName],
            [copy.adminCourseLabel, input.courseTitle],
          ]),
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
