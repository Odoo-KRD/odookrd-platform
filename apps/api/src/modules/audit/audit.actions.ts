export const AUDIT_ACTIONS = {
  COMPANY_CREATED: 'company.created',
  COMPANY_UPDATED: 'company.updated',
  COMPANY_STATUS_CHANGED: 'company.status_changed',

  USER_INVITED: 'user.invited',
  USER_STATUS_CHANGED: 'user.status_changed',
  USER_ROLES_CHANGED: 'user.roles_changed',

  ROLE_CREATED: 'role.created',
  ROLE_UPDATED: 'role.updated',
  ROLE_DELETED: 'role.deleted',

  AUTH_INVITATION_ACCEPTED: 'auth.invitation.accepted',

  SERVICE_BATCH_STATUS_CHANGED: 'service.batch_status_changed',
  SERVICE_FEATURE_CREATED: 'service.feature.created',
  SERVICE_FEATURE_DEFINITION_CREATED: 'service.feature_definition.created',
  SERVICE_FEATURE_DEFINITION_UPDATED: 'service.feature_definition.updated',
  SERVICE_FEATURE_DEFINITION_ATTACHED: 'service.feature_definition.attached',
  SERVICE_FEATURE_UPDATED: 'service.feature.updated',
  SERVICE_FEATURE_REORDERED: 'service.feature.reordered',
  SERVICE_ASSIGNMENT_FEATURE_UPDATED: 'service.assignment.feature.updated',
  SERVICE_ASSIGNMENT_FEATURES_SYNCED: 'service.assignment.features_synced',
  SERVICE_ASSIGNMENT_STATUS_TRANSITIONED:
    'service.assignment.status_transitioned',
  SERVICE_ASSIGNMENT_BATCH_TRANSITIONED:
    'service.assignment.batch_transitioned',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
