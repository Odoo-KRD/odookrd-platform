export const AUDIT_ACTIONS = {
  COMPANY_CREATED: 'company.created',
  COMPANY_UPDATED: 'company.updated',
  COMPANY_STATUS_CHANGED: 'company.status_changed',

  USER_INVITED: 'user.invited',
  USER_STATUS_CHANGED: 'user.status_changed',
  USER_ROLES_CHANGED: 'user.roles_changed',

  AUTH_INVITATION_ACCEPTED: 'auth.invitation.accepted',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
