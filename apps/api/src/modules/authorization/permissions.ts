export const PERMISSIONS = {
  COMPANIES_READ: 'companies.read',
  COMPANIES_MANAGE: 'companies.manage',

  USERS_READ: 'users.read',
  USERS_MANAGE: 'users.manage',

  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',

  SERVICES_READ: 'services.read',
  SERVICES_MANAGE: 'services.manage',
  NOTIFICATIONS_READ: 'notifications.read',
  NOTIFICATIONS_MANAGE: 'notifications.manage',
  SETTINGS_READ: 'settings.read',

  SETTINGS_MANAGE: 'settings.manage',

  TRAINING_READ: 'training.read',
  TRAINING_MANAGE: 'training.manage',
  TRAINING_ASSIGN: 'training.assign',
  TRAINING_PROGRESS_READ: 'training.progress.read',

  AUDIT_LOGS_READ: 'audit_logs.read',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
