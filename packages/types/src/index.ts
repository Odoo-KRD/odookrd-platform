export type AccountScope = "PLATFORM" | "COMPANY";
export type CompanyStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type UserStatus = "INVITED" | "ACTIVE" | "SUSPENDED";
export type RoleScope = "PLATFORM" | "COMPANY";
export type Locale = "ku" | "ar" | "en";
export type LocalizedText = Partial<Record<Locale, string>>;
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
  NOTIFICATIONS_READ: "notifications.read",
  NOTIFICATIONS_MANAGE: "notifications.manage",
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

export interface UserUiPreferences {
  sidebarCollapsed: boolean;
  dashboardPreferences: Record<string, unknown>;
  updatedAt: string | null;
}

export interface UpdateUserUiPreferencesRequest {
  sidebarCollapsed: boolean;
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
  nameTranslations: LocalizedText;
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
  isSystem: boolean;
  assignmentCount: number;
  permissions: string[];
}

export interface PermissionDefinition {
  key: string;
  name: string;
  description: string | null;
  allowedForCompany: boolean;
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
  nameTranslations: LocalizedText;
  category: ServiceCategory;
  description: string | null;
  descriptionTranslations: LocalizedText;
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
  displayNameTranslations: LocalizedText;
  status: CompanyServiceStatus;
  serviceUrl: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  company: Pick<Company, "id" | "name" | "nameTranslations" | "status">;
  service: Pick<
    ManagedService,
    | "id"
    | "key"
    | "name"
    | "nameTranslations"
    | "description"
    | "descriptionTranslations"
    | "category"
    | "status"
  >;
}

export type CustomerActivityAction =
  | "company.created"
  | "company.updated"
  | "company.status.updated"
  | "service.assignment.created"
  | "service.assignment.updated"
  | "user.invited"
  | "user.created"
  | "user.status.updated"
  | "user.roles.updated";

export interface CustomerServiceSummary {
  total: number;
  active: number;
  provisioning: number;
  suspended: number;
  expired: number;
  cancelled: number;
  expiringSoon: number;
}

export interface CustomerRecentService {
  id: string;
  companyId: string;
  displayName: string | null;
  displayNameTranslations: LocalizedText;
  status: CompanyServiceStatus;
  expiresAt: string | null;
  serviceUrl: string | null;
  service: Pick<
    ManagedService,
    "id" | "name" | "nameTranslations" | "category"
  >;
}

export interface CustomerActivity {
  id: string;
  action: CustomerActivityAction;
  targetType: string | null;
  createdAt: string;
}

export interface CustomerWorkspaceOverview {
  company: Company;
  summary: CustomerServiceSummary;
  teamMembers: number;
  recentServices: CustomerRecentService[];
  recentActivity: CustomerActivity[];
}

export interface CustomerAccountProfile {
  id: string;
  email: string;
  companyId: string;
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: Company;
  roles: string[];
  lastSeenAt: string | null;
}

export type NotificationChannel = "IN_APP" | "EMAIL" | "WHATSAPP";

export type NotificationDeliveryStatus =
  "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "SKIPPED";

export interface CustomerNotificationDelivery {
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  attemptCount: number;
  sentAt: string | null;
}

export interface CustomerNotification {
  id: string;
  templateKey: string;
  title: string;
  body: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
  deliveries: CustomerNotificationDelivery[];
}

export interface CustomerNotificationPage {
  items: CustomerNotification[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface NotificationUnreadCount {
  unread: number;
}

export type InvitationDeliveryChannel = "EMAIL" | "WHATSAPP";

export interface InvitationDeliverySummary {
  channel: InvitationDeliveryChannel;
  status: NotificationDeliveryStatus;
  attemptCount: number;
  failureCode: string | null;
  lastAttemptAt: string | null;
  sentAt: string | null;
}

export interface InvitationDispatchSummary {
  id: string;
  expiresAt: string;
  createdAt: string;
  deliveries: InvitationDeliverySummary[];
}

export interface UserAdministrationDetails {
  userId: string;
  whatsappNumber: string | null;
  canRemoveAdminRole: boolean;
  invitation: {
    active: boolean;
    expiresAt: string;
    lastDispatch: InvitationDispatchSummary | null;
  } | null;
}

export interface InvitationDeliveryOperation {
  expiresAt: string;
  dispatch: InvitationDispatchSummary;
}

export interface InvitationRegeneration {
  token: string;
  expiresAt: string;
}

export type NotificationAdministrationKind =
  "NOTIFICATION" | "INVITATION" | "TEST";

export interface NotificationProviderSecretStatus {
  configured: boolean;
  masked: string | null;
}

export type AmazonSesTransport = "api" | "smtp";
export type AmazonSesSmtpSecurity = "starttls" | "tls";

export interface EmailProviderAdministrationStatus {
  enabled: boolean;
  provider: string | null;
  transport: AmazonSesTransport;
  ready: boolean;
  region: string | null;
  senderEmail: string | null;
  senderName: string | null;
  replyTo: string | null;
  accessKeyId: NotificationProviderSecretStatus;
  secretAccessKey: NotificationProviderSecretStatus;
  sessionToken: NotificationProviderSecretStatus;
  smtp: {
    host: string | null;
    port: number | null;
    security: AmazonSesSmtpSecurity | null;
    username: NotificationProviderSecretStatus;
    password: NotificationProviderSecretStatus;
  };
}

export interface WhatsAppProviderAdministrationStatus {
  enabled: boolean;
  ready: boolean;
  apiUrl: string | null;
  phoneNumberId: string | null;
  accessToken: NotificationProviderSecretStatus;
}

export interface NotificationProviderAdministrationStatus {
  email: EmailProviderAdministrationStatus;
  whatsapp: WhatsAppProviderAdministrationStatus;
}

export interface NotificationAdministrationDelivery {
  id: string;
  kind: NotificationAdministrationKind;
  companyId: string | null;
  companyName: string | null;
  userId: string | null;
  recipient: string;
  templateKey: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  attemptCount: number;
  providerMessageId: string | null;
  failureCode: string | null;
  createdAt: string;
  lastAttemptAt: string | null;
  sentAt: string | null;
}

export interface NotificationAdministrationCompanyFilter {
  id: string;
  name: string;
}

export interface NotificationAdministrationDeliveryPage {
  items: NotificationAdministrationDelivery[];
  companies: NotificationAdministrationCompanyFilter[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface NotificationProviderTestResult {
  id: string;
  channel: "EMAIL";
  recipient: string;
  status: NotificationDeliveryStatus;
  providerMessageId: string | null;
  failureCode: string | null;
  sentAt: string | null;
}

export type NotificationBroadcastAudience = "ALL_CUSTOMERS" | "COMPANY";

export interface NotificationBroadcastAudienceSummary {
  companyCount: number;
  recipientCount: number;
  emailCount: number;
  whatsappCount: number;
  overLimit: boolean;
}

export interface NotificationBroadcastCompanySummary {
  id: string;
  name: string;
  recipientCount: number;
  emailCount: number;
  whatsappCount: number;
  overLimit: boolean;
}

export interface NotificationBroadcastOptions {
  isPlatform: boolean;
  maxRecipients: number;
  allCustomers: NotificationBroadcastAudienceSummary | null;
  companies: NotificationBroadcastCompanySummary[];
}

export interface NotificationBroadcastResult {
  requestId: string;
  created: boolean;
  companyCount: number;
  recipientCount: number;
  notificationCount: number;
  channels: NotificationChannel[];
  externalDeliveryQueued: boolean;
}
