export const API_SUPPORTED_LOCALES = ['ku', 'ar', 'en'] as const;

export type ApiLocale = (typeof API_SUPPORTED_LOCALES)[number];

export const API_ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCESS_DENIED: 'ACCESS_DENIED',
  COMPANY_SCOPE_DENIED: 'COMPANY_SCOPE_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  COMPANY_USER_LIMIT: 'COMPANY_USER_LIMIT',
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface ApiTranslations {
  errors: Record<ApiErrorCode, string>;
  notifications: {
    invitationSubject: string;
    invitationGreeting: string;
    invitationAction: string;
    serviceAssignedSubject: string;
    serviceAssignedBody: string;
    securityNoticeSubject: string;
  };
}
