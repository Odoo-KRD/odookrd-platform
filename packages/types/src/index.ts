export type AccountScope = "PLATFORM" | "COMPANY";
export type CompanyStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type UserStatus = "INVITED" | "ACTIVE" | "SUSPENDED";
export type RoleScope = "PLATFORM" | "COMPANY";
export type Locale = "ku" | "ar" | "en";
export type TextDirection = "rtl" | "ltr";

export const PERMISSIONS = {
  COMPANIES_READ: "companies.read",
  COMPANIES_MANAGE: "companies.manage",
  USERS_READ: "users.read",
  USERS_MANAGE: "users.manage",
  ROLES_READ: "roles.read",
  ROLES_MANAGE: "roles.manage",
  SERVICES_READ: "services.read",
  SERVICES_MANAGE: "services.manage",
  SETTINGS_READ: "settings.read",
  SETTINGS_MANAGE: "settings.manage",
  AUDIT_LOGS_READ: "audit_logs.read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface AuthenticatedUser {
  id: string;
  email: string;
  accountScope: AccountScope;
  companyId: string | null;
}

export interface AuthorizationContext {
  roles: string[];
  permissions: string[];
}

export interface CurrentSession {
  user: AuthenticatedUser;
  authorization: AuthorizationContext;
}

export interface ApiLoginResponse {
  token: string;
  session: {
    id: string;
    idleExpiresAt: string;
    absoluteExpiresAt: string;
  };
  user: AuthenticatedUser;
}

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  accountScope: AccountScope;
  companyId: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

export interface Role {
  id: string;
  key: string;
  name: string;
  description: string | null;
  scope: RoleScope;
  permissions: string[];
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface UserInvitation {
  token: string;
  expiresAt: string;
  user: ManagedUser;
}

export type SettingScope = "PLATFORM" | "COMPANY";
export type SettingValueType = "STRING" | "NUMBER" | "BOOLEAN" | "SECRET";
export type SettingSource = "DEFAULT" | "PLATFORM" | "COMPANY";
export type SettingCategory =
  | "general"
  | "theme"
  | "companies"
  | "notifications"
  | "helpdesk"
  | "trainings";
export type SettingPrimitive = string | number | boolean;

export interface ManagedSetting {
  key: string;
  category: SettingCategory;
  valueType: SettingValueType;
  value: SettingPrimitive | null;
  source: SettingSource;
  isSecret: boolean;
  configured: boolean;
  editable: boolean;
}

export interface SettingsCollection {
  scope: SettingScope;
  companyId: string | null;
  settings: ManagedSetting[];
}

export type ServiceCategory =
  "ODOO" | "HOSTING" | "DOMAIN" | "SUPPORT" | "TRAINING" | "OTHER";

export type ServiceCatalogStatus = "ACTIVE" | "INACTIVE";

export type CompanyServiceStatus =
  "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED";

export interface ManagedService {
  id: string;
  key: string;
  name: string;
  category: ServiceCategory;
  description: string | null;
  status: ServiceCatalogStatus;
  createdAt: string;
  updatedAt: string;
  assignmentCount: number;
}

export interface CompanyServiceAssignment {
  id: string;
  companyId: string;
  serviceId: string;
  displayName: string | null;
  status: CompanyServiceStatus;
  serviceUrl: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  company: Pick<Company, "id" | "name" | "status">;
  service: Pick<ManagedService, "id" | "key" | "name" | "category" | "status">;
}
