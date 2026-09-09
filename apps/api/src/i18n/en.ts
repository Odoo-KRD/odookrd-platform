import type { ApiTranslations } from './types';

export const apiEn = {
  errors: {
    AUTH_REQUIRED: 'Sign in to access this resource.',
    INVALID_CREDENTIALS: 'The email address or password is incorrect.',
    ACCESS_DENIED: 'You do not have permission to perform this action.',
    COMPANY_SCOPE_DENIED: 'Access outside your company is not allowed.',
    RESOURCE_NOT_FOUND: 'The requested resource could not be found.',
    INVALID_REQUEST: 'The request data is invalid.',
    RATE_LIMITED: 'Too many requests. Please try again later.',
    SERVICE_UNAVAILABLE: 'The service is temporarily unavailable.',
    COMPANY_USER_LIMIT: 'The company has reached its maximum number of users.',
  },
  notifications: {
    invitationSubject: 'Invitation to the OdooKRD platform',
    invitationGreeting: 'You have been invited to create an account.',
    invitationAction: 'Accept invitation',
    serviceAssignedSubject: 'A new service was assigned to your company',

    subscriptionExpiringSubject: 'A service subscription is expiring soon',

    subscriptionExpiringBody:
      'One of your service subscriptions is approaching its renewal date. Request a renewal from the portal to keep the service available.',

    subscriptionExpiredSubject: 'A service subscription has expired',

    subscriptionExpiredBody:
      'A service subscription has reached the end of its period. Renew it from the portal to restore access.',

    subscriptionGraceEndedSubject: 'Access to a service has ended',

    subscriptionGraceEndedBody:
      'The grace period for a service subscription has finished and access has now stopped. Your data is retained and will be available again once the subscription is renewed.',

    subscriptionExpiresOnLabel: 'Expires on',
    serviceAssignedBody: 'A new service is available on your dashboard.',
    securityNoticeSubject: 'Account security notice',
  },
} satisfies ApiTranslations;
