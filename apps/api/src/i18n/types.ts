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
    helpdeskRepliedSubject: string;
    helpdeskRepliedBody: string;
    helpdeskResolvedSubject: string;
    helpdeskResolvedBody: string;
    helpdeskCreatedSubject: string;
    helpdeskCreatedBody: string;
    helpdeskCustomerRepliedSubject: string;
    helpdeskCustomerRepliedBody: string;
    helpdeskTicketLabel: string;
    helpdeskSubjectLabel: string;
    invitationSubject: string;
    invitationGreeting: string;
    invitationAction: string;
    serviceAssignedSubject: string;
    serviceAssignedBody: string;
    subscriptionExpiringSubject: string;
    subscriptionExpiringBody: string;
    subscriptionExpiredSubject: string;
    subscriptionExpiredBody: string;
    subscriptionGraceEndedSubject: string;
    subscriptionGraceEndedBody: string;
    subscriptionExpiresOnLabel: string;
    adminInvitationAcceptedSubject: string;
    adminInvitationAcceptedBody: string;
    adminCourseCompletedSubject: string;
    adminCourseCompletedBody: string;
    adminRenewalRequestedSubject: string;
    adminRenewalRequestedBody: string;
    adminCertificateIssuedSubject: string;
    adminCertificateIssuedBody: string;
    adminKnowledgeFeedbackSubject: string;
    adminKnowledgeFeedbackBody: string;
    adminArticleLabel: string;
    adminCommentLabel: string;
    adminCompanyLabel: string;
    adminUserLabel: string;
    adminCourseLabel: string;
    adminServiceLabel: string;
    securityNoticeSubject: string;
  };
}
