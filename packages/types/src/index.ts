export type AccountScope = "PLATFORM" | "COMPANY";
export type CompanyStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type UserStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
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
  TRAINING_READ: "training.read",
  TRAINING_MANAGE: "training.manage",
  TRAINING_ASSIGN: "training.assign",
  TRAINING_PROGRESS_READ: "training.progress.read",

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

export type DashboardSectionKey =
  "companies" | "users" | "roles" | "services" | "notifications" | "settings";

export interface DashboardUiPreferences {
  order: DashboardSectionKey[];
  hidden: DashboardSectionKey[];
  collapsed: DashboardSectionKey[];
}

export interface UserUiPreferences {
  sidebarCollapsed: boolean;
  dashboardPreferences: DashboardUiPreferences;
  updatedAt: string | null;
}

export interface UpdateUserUiPreferencesRequest {
  sidebarCollapsed?: boolean;
  dashboardPreferences?: DashboardUiPreferences;
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
  archivedAt: string | null;
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
  | "trainings"
  | "files";
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

export type ServiceFeatureValueType = "BOOLEAN" | "NUMBER" | "STORAGE" | "TEXT";
export type ServiceFeatureStatus = "ACTIVE" | "INACTIVE";
export type ServiceFeatureValue = boolean | number | string;
export type CompanyServiceFeatureSource = "CATALOG_DEFAULT" | "ADMIN_OVERRIDE";
export type CompanyServiceLifecycleSource = "ADMIN" | "SYSTEM" | "INTEGRATION";
export type BatchMutationOutcome = "CHANGED" | "UNCHANGED";

export interface BatchMutationItem {
  id: string;
  outcome: BatchMutationOutcome;
  updatedAt: string;
}

export interface BatchMutationResult {
  requested: number;
  changed: number;
  unchanged: number;
  items: BatchMutationItem[];
}

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
  featureCount?: number;
}

export interface ManagedServiceFeature {
  id: string;
  serviceId: string;
  definitionId?: string | null;
  key: string;
  name: string;
  nameTranslations: LocalizedText;
  description: string | null;
  descriptionTranslations: LocalizedText;
  valueType: ServiceFeatureValueType;
  parameterLabel?: string | null;
  parameterLabelTranslations?: LocalizedText;
  defaultValue: ServiceFeatureValue;
  valueTranslations: LocalizedText;
  unit: string | null;
  status: ServiceFeatureStatus;
  customerVisible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFeatureDefinition {
  id: string;
  key: string;
  name: string;
  nameTranslations: LocalizedText;
  description: string | null;
  descriptionTranslations: LocalizedText;
  category: ServiceCategory;
  valueType: ServiceFeatureValueType;
  parameterLabel: string;
  parameterLabelTranslations: LocalizedText;
  defaultValue: ServiceFeatureValue;
  valueTranslations: LocalizedText;
  unit: string | null;
  status: ServiceFeatureStatus;
  sortOrder: number;
  serviceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyServiceFeature {
  id: string;
  companyServiceId: string;
  serviceFeatureId: string;
  value: ServiceFeatureValue;
  valueTranslations: LocalizedText;
  source: CompanyServiceFeatureSource;
  customerVisible: boolean;
  customerVisibleOverride: boolean | null;
  sortOrder: number;
  sortOrderOverride: number | null;
  createdAt: string;
  updatedAt: string;
  feature: Pick<
    ManagedServiceFeature,
    | "id"
    | "key"
    | "name"
    | "nameTranslations"
    | "description"
    | "descriptionTranslations"
    | "valueType"
    | "parameterLabel"
    | "parameterLabelTranslations"
    | "unit"
    | "status"
    | "customerVisible"
    | "sortOrder"
  >;
}

export interface CompanyServiceLifecycleEvent {
  id: string;
  companyServiceId: string;
  companyId: string;
  fromStatus: CompanyServiceStatus | null;
  toStatus: CompanyServiceStatus;
  source: CompanyServiceLifecycleSource;
  reasonCode?: string | null;
  reason?: string | null;
  actorUserId?: string | null;
  actorEmailSnapshot?: string | null;
  effectiveAt: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
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

export const TRAINING_STORAGE_PROVIDERS = ["AWS_S3", "LOCAL"] as const;
export type TrainingStorageProvider =
  (typeof TRAINING_STORAGE_PROVIDERS)[number];

export const DEFAULT_TRAINING_STORAGE_PROVIDER: TrainingStorageProvider =
  "AWS_S3";
export const LOCAL_TRAINING_TRANSCODING_ENABLED = false;
export const DEFAULT_LESSON_COMPLETION_PERCENTAGE = 90;

export type TrainingCategoryStatus = "ACTIVE" | "INACTIVE";
export type TrainingCourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TrainingContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TrainingVideoAssetStatus =
  "UPLOADING" | "PROCESSING" | "READY" | "FAILED" | "ARCHIVED";
export type TrainingVideoDeliveryMode =
  "AWS_AUTOMATED" | "AWS_MANUAL" | "LOCAL";

export type TrainingPlayerPlaybackRate = "0.75" | "1" | "1.25" | "1.5" | "2";
export type TrainingCaptionDefaultBehavior =
  "off" | "video_default" | "prefer_learner_language";
export type TrainingCaptionFontSize = "small" | "medium" | "large" | "xlarge";
export type TrainingCaptionTextColor = "white" | "yellow";
export type TrainingCaptionBackground =
  "none" | "light" | "medium" | "dark" | "solid";
export type TrainingCaptionEdgeStyle = "none" | "soft" | "strong";
export type TrainingCaptionPosition = "bottom" | "top";

export interface TrainingPlayerSettings {
  autoplay: boolean;
  defaultPlaybackRate: TrainingPlayerPlaybackRate;
  seekSeconds: number;
  controlsAutoHideSeconds: number;
  showFullscreen: boolean;
  showVolume: boolean;
  showChapters: boolean;
  showSpeedControl: boolean;
  showQualitySelector: boolean;
  branding: {
    enabled: boolean;
    text: string;
  };
  captions: {
    defaultBehavior: TrainingCaptionDefaultBehavior;
    fontSize: TrainingCaptionFontSize;
    textColor: TrainingCaptionTextColor;
    background: TrainingCaptionBackground;
    backgroundOpacity: number;
    edgeStyle: TrainingCaptionEdgeStyle;
    position: TrainingCaptionPosition;
    maxWidthPercent: number;
  };
}
export type TrainingLessonContentType =
  "VIDEO" | "DOCUMENT" | "ARTICLE" | "QUIZ";
// Backwards-compatible Stage 3C.2 display contract.
export type TrainingLessonMediaType = "VIDEO" | "PDF_SLIDES" | "QUIZ";
export type TrainingAudienceMode = "ALL_USERS" | "ASSIGNED_USERS";
export type TrainingUserAccessSource = "PLATFORM" | "COMPANY_ADMIN";
export type TrainingProgressStatus = "IN_PROGRESS" | "COMPLETED";
export type TrainingQuizPlacement = "SECTION" | "COURSE_FINAL";
export type TrainingQuizStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TrainingQuizVersionStatus = "DRAFT" | "PUBLISHED" | "RETIRED";
export type TrainingQuizQuestionType =
  "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";
export type TrainingQuizAttemptStatus =
  "IN_PROGRESS" | "SUBMITTED" | "PASSED" | "FAILED" | "EXPIRED";
export type TrainingCertificateStatus = "ACTIVE" | "REVOKED";

export interface TrainingQuizAdminOption {
  id: string;
  text: string;
  textTranslations: LocalizedText;
  isCorrect: boolean;
  sortOrder: number;
}

export interface TrainingQuizAdminQuestion {
  id: string;
  type: TrainingQuizQuestionType;
  prompt: string;
  promptTranslations: LocalizedText;
  explanation: string | null;
  explanationTranslations: LocalizedText;
  points: number;
  sortOrder: number;
  options: TrainingQuizAdminOption[];
}

export interface TrainingQuizAdminVersion {
  id: string;
  version: number;
  status: TrainingQuizVersionStatus;
  passPercentage: number;
  maxAttempts: number | null;
  timeLimitSeconds: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  revealAnswers: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  questions: TrainingQuizAdminQuestion[];
}

export interface TrainingQuizAdminQuiz {
  id: string;
  courseId: string;
  sectionId: string | null;
  lessonId: string | null;
  placement: TrainingQuizPlacement;
  title: string;
  titleTranslations: LocalizedText;
  instructions: string | null;
  instructionTranslations: LocalizedText;
  status: TrainingQuizStatus;
  requiredForCompletion: boolean;
  requiredToContinue: boolean;
  draftVersion: TrainingQuizAdminVersion | null;
  publishedVersion: TrainingQuizAdminVersion | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingQuizAdminState {
  target: {
    placement: TrainingQuizPlacement;
    courseId: string;
    sectionId: string | null;
    lessonId: string | null;
  };
  quiz: TrainingQuizAdminQuiz | null;
}

export interface TrainingFoundationCapabilities {
  enabled: boolean;
  primaryStorageProvider: TrainingStorageProvider;
  localUploadEnabled: boolean;
  localTranscodingEnabled: false;
  lessonCompletionPercentage: number;
  quizzesEnabled: boolean;
  certificatesEnabled: boolean;
}

export interface TrainingCategory {
  id: string;
  key: string;
  name: string;
  nameTranslations: LocalizedText;
  description: string | null;
  descriptionTranslations: LocalizedText;
  status: TrainingCategoryStatus;
  sortOrder: number;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCourse {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  titleTranslations: LocalizedText;
  summary: string | null;
  summaryTranslations: LocalizedText;
  thumbnailUrl: string | null;
  coverImageAssetId: string | null;
  status: TrainingCourseStatus;
  sortOrder: number;
  publishedAt: string | null;
  sectionCount: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    key: string;
    name: string;
    nameTranslations: LocalizedText;
    status: TrainingCategoryStatus;
  };
}

export interface RichTextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface RichTextNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
}

export interface RichTextDocument extends RichTextNode {
  type: "doc";
}

export type LocalizedRichText = Partial<Record<Locale, RichTextDocument>>;

export interface TrainingSection {
  id: string;
  courseId: string;
  title: string;
  titleTranslations: LocalizedText;
  description: string | null;
  descriptionTranslations: LocalizedText;
  richDescriptionTranslations: LocalizedRichText;
  status: TrainingContentStatus;
  sortOrder: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingLesson {
  id: string;
  courseId: string;
  sectionId: string;
  videoAssetId: string | null;
  contentType: TrainingLessonContentType | null;
  documentAssetId: string | null;
  documentPageCount: number | null;
  articleContentTranslations: LocalizedRichText;
  contentReady: boolean;
  title: string;
  titleTranslations: LocalizedText;
  description: string | null;
  descriptionTranslations: LocalizedText;
  richDescriptionTranslations: LocalizedRichText;
  status: TrainingContentStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCourseStructureSection extends TrainingSection {
  lessons: TrainingLesson[];
}

export interface TrainingCourseStructure {
  courseId: string;
  sections: TrainingCourseStructureSection[];
}

// Stage 3C.1 — Customer training catalog and access contracts.
export interface TrainingCatalogCategory {
  id: string;
  key: string;
  name: string;
  nameTranslations: LocalizedText;
}

export interface TrainingCatalogCourse {
  id: string;
  slug: string;
  title: string;
  titleTranslations: LocalizedText;
  summary: string | null;
  summaryTranslations: LocalizedText;
  publishedAt: string | null;
  hasCover: boolean;
  sectionCount: number;
  lessonCount: number;
  category: TrainingCatalogCategory;
}

export interface TrainingCatalogLesson {
  id: string;
  title: string;
  titleTranslations: LocalizedText;
  description: string | null;
  descriptionTranslations: LocalizedText;
  sortOrder: number;
  contentType: TrainingLessonContentType | null;
  quizId: string | null;
  requiredToContinue: boolean;
  contentReady: boolean;
  locked: boolean;
  lockedByQuizId: string | null;
  mediaType: TrainingLessonMediaType;
  mediaReady: boolean;
}

export interface TrainingCatalogSection {
  id: string;
  title: string;
  titleTranslations: LocalizedText;
  description: string | null;
  descriptionTranslations: LocalizedText;
  sortOrder: number;
  lessons: TrainingCatalogLesson[];
}

export interface TrainingCatalogFinalQuiz {
  id: string;
  title: string;
  titleTranslations: LocalizedText;
  requiredForCompletion: boolean;
  available: boolean;
  passed: boolean;
}

export interface TrainingCatalogCourseDetail extends TrainingCatalogCourse {
  sections: TrainingCatalogSection[];
  finalQuiz: TrainingCatalogFinalQuiz | null;
}

export interface TrainingCatalogStatus {
  enabled: boolean;
}

export interface TrainingCatalogPage extends TrainingCatalogStatus {
  items: TrainingCatalogCourse[];
  categories: TrainingCatalogCategory[];
  pagination: Pagination;
}

export interface TrainingAccessEligibility {
  hasAny: boolean;
  hasAllUsers: boolean;
  hasAssignedUsers: boolean;
  requiresAssignment: boolean;
}

export interface TrainingCompanyAccessRecord {
  id: string;
  companyId: string;
  mode: TrainingAudienceMode;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
    nameTranslations: LocalizedText;
  };
}

export interface TrainingServiceAccessRecord {
  id: string;
  serviceId: string;
  mode: TrainingAudienceMode;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    nameTranslations: LocalizedText;
  };
}

export interface TrainingUserAccessRecord {
  id: string;
  companyId: string;
  userId: string;
  source: TrainingUserAccessSource;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    companyId: string | null;
    status: UserStatus;
  };
}

export interface TrainingAccessSummary {
  scope: "PLATFORM" | "COMPANY";
  course: {
    id: string;
    slug: string;
    title: string;
    titleTranslations: LocalizedText;
  };
  eligibility: TrainingAccessEligibility | null;
  companyAccess: TrainingCompanyAccessRecord[];
  serviceAccess: TrainingServiceAccessRecord[];
  userAccess: TrainingUserAccessRecord[];
}

export interface TrainingAccessOptions {
  scope: "PLATFORM" | "COMPANY";
  selectedCompanyId: string | null;
  companies: Array<{
    id: string;
    name: string;
    nameTranslations: LocalizedText;
  }>;
  services: Array<{
    id: string;
    name: string;
    nameTranslations: LocalizedText;
  }>;
  users: Array<{
    id: string;
    email: string;
    companyId: string | null;
    status: UserStatus;
  }>;
}

export interface TrainingManageableCourse {
  id: string;
  slug: string;
  title: string;
  titleTranslations: LocalizedText;
  hasAllUsers: boolean;
  hasAssignedUsers: boolean;
  requiresAssignment: boolean;
}

// Stage 3C.2 / 3C.2R.1 — Training content delivery and advanced lesson editor contracts.
export interface TrainingVideoMediaAdmin {
  type: "VIDEO";
  assetId: string;
  deliveryMode: TrainingVideoDeliveryMode;
  status: TrainingVideoAssetStatus;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number | null;
  processedSizeBytes: number | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  failureCode: string | null;
  failureMessage: string | null;
  posterFileAssetId: string | null;
  processingProgress: number | null;
  processingPhase: "PROCESSING" | "FINALIZING" | null;
  outputVariants: number[];
  playbackAvailable: boolean;
  updatedAt: string;
  manualPlaybackUrl: string | null;
}

export interface TrainingDocumentMediaAdmin {
  type: "DOCUMENT";
  fileAssetId: string;
  originalFilename: string;
  sizeBytes: number;
  pageCount: number;
}
export type TrainingSlideMediaAdmin = TrainingDocumentMediaAdmin;

export interface TrainingLessonMediaAdmin {
  lessonId: string;
  contentType: TrainingLessonContentType | null;
  mediaType: TrainingLessonMediaType;
  articleContentTranslations: LocalizedRichText;
  video: TrainingVideoMediaAdmin | null;
  document: TrainingDocumentMediaAdmin | null;
  slides: TrainingDocumentMediaAdmin | null;
}

export interface TrainingAutomatedUploadInit {
  assetId: string;
  uploadUrl: string;
  expiresInSeconds: number;
  requiredHeaders: { "Content-Type": "video/mp4" };
}

export interface TrainingVideoCaptionTrackAdmin {
  id: string;
  languageCode: string;
  label: string;
  isDefault: boolean;
  sortOrder: number;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingVideoChapterAdmin {
  id: string;
  title: string;
  titleTranslations: LocalizedText;
  startSeconds: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCustomerVideoCaptionTrack {
  id: string;
  languageCode: string;
  label: string;
  isDefault: boolean;
  contentPath: string;
}

export interface TrainingCustomerVideoChapter {
  id: string;
  title: string;
  titleTranslations: LocalizedText;
  startSeconds: number;
}

export interface TrainingCustomerVideoEnrichment {
  captions: TrainingCustomerVideoCaptionTrack[];
  chapters: TrainingCustomerVideoChapter[];
}

export interface TrainingCustomerVideoContent {
  type: "VIDEO";
  deliveryMode: TrainingVideoDeliveryMode;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  processedSizeBytes: number | null;
  playbackKind: "HLS" | "MP4";
  playbackPath: string;
}
export type TrainingCustomerVideoMedia = TrainingCustomerVideoContent;

export interface TrainingVideoEnrichmentAdmin {
  videoAssetId: string;
  durationSeconds: number | null;
  deliveryMode: TrainingVideoDeliveryMode;
  preview: TrainingCustomerVideoContent;
  captions: TrainingVideoCaptionTrackAdmin[];
  chapters: TrainingVideoChapterAdmin[];
}

export interface TrainingCustomerDocumentContent {
  type: "DOCUMENT";
  pageCount: number;
  sizeBytes: number;
  contentPath: string;
}
export type TrainingCustomerSlideMedia = TrainingCustomerDocumentContent;

export interface TrainingCustomerQuizContent {
  type: "QUIZ";
  quizId: string;
}

export interface TrainingCustomerArticleContent {
  type: "ARTICLE";
  contentTranslations: LocalizedRichText;
}

export type TrainingCustomerLessonContent =
  | TrainingCustomerVideoContent
  | TrainingCustomerDocumentContent
  | TrainingCustomerArticleContent
  | TrainingCustomerQuizContent;

export interface TrainingCustomerLessonResource {
  id: string;
  title: string;
  titleTranslations: LocalizedText;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  downloadPath: string;
}

export interface TrainingCustomerLessonDetail {
  id: string;
  courseId: string;
  sectionId: string;
  title: string;
  titleTranslations: LocalizedText;
  description: string | null;
  descriptionTranslations: LocalizedText;
  richDescriptionTranslations: LocalizedRichText;
  contentType: TrainingLessonContentType | null;
  content: TrainingCustomerLessonContent | null;
  /** Stage 3C.2 compatibility while the learner workspace is refined. */
  media: TrainingCustomerVideoContent | TrainingCustomerDocumentContent | null;
  resources: TrainingCustomerLessonResource[];
}

// Stage 3C.3 — Persistent learner progress and Continue Learning.
export type TrainingLearningStatus = "NOT_STARTED" | TrainingProgressStatus;

export interface TrainingLessonProgressState {
  courseId: string;
  lessonId: string;
  contentType: TrainingLessonContentType;
  status: TrainingLearningStatus;
  lastPositionSeconds: number;
  furthestPositionSeconds: number;
  lastPageNumber: number;
  furthestPageNumber: number;
  completedAt: string | null;
  lastAccessedAt: string | null;
}

export interface TrainingCourseProgressSummary {
  courseId: string;
  slug: string;
  status: TrainingLearningStatus;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  resumeLessonId: string | null;
  lastAccessedAt: string | null;
}

export interface TrainingCourseProgressDetail extends TrainingCourseProgressSummary {
  lessons: TrainingLessonProgressState[];
}

export interface TrainingContinueLearningItem {
  course: {
    id: string;
    slug: string;
    title: string;
    titleTranslations: LocalizedText;
    hasCover: boolean;
    category: TrainingCatalogCategory;
  };
  progress: TrainingCourseProgressDetail;
}

export interface TrainingContinueLearningResponse {
  items: TrainingContinueLearningItem[];
}

export interface TrainingLessonProgressUpdate {
  positionSeconds?: number;
  pageNumber?: number;
}

export type TrainingLessonReadinessBlocker =
  | "NO_CONTENT"
  | "VIDEO_NOT_READY"
  | "DOCUMENT_NOT_READY"
  | "ARTICLE_EMPTY"
  | "QUIZ_NOT_CONFIGURED";

export interface TrainingLessonResource {
  id: string;
  fileAssetId: string;
  title: string;
  titleTranslations: LocalizedText;
  customerVisible: boolean;
  sortOrder: number;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status: FileAssetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingLessonReview {
  ready: boolean;
  blockers: TrainingLessonReadinessBlocker[];
  resourcesCount: number;
}

export interface TrainingLessonEditorState {
  lesson: TrainingLesson;
  media: TrainingLessonMediaAdmin;
  resources: TrainingLessonResource[];
  review: TrainingLessonReview;
}

// Stage 3B.1 — Shared file/media contracts.
export const FILE_ASSET_KINDS = ["IMAGE", "DOCUMENT", "ATTACHMENT"] as const;
export type FileAssetKind = (typeof FILE_ASSET_KINDS)[number];
export const FILE_STORAGE_PROVIDERS = ["LOCAL", "AWS_S3"] as const;
export type FileStorageProvider = (typeof FILE_STORAGE_PROVIDERS)[number];
export type FileAssetStatus = "READY" | "DELETED";

export interface FileAsset {
  id: string;
  accountScope: AccountScope;
  companyId: string | null;
  kind: FileAssetKind;
  storageProvider: FileStorageProvider;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  status: FileAssetStatus;
  uploadedByUserId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  contentPath: string;
}

// Stage 3C.4 Pass 2 — Learner quiz attempts and assessment.
export interface TrainingQuizLearnerSummary {
  id: string;
  courseId: string;
  lessonId: string | null;
  placement: TrainingQuizPlacement;
  title: string;
  titleTranslations: LocalizedText;
  instructions: string | null;
  instructionTranslations: LocalizedText;
  requiredForCompletion: boolean;
  requiredToContinue: boolean;
  version: number;
  passPercentage: number;
  maxAttempts: number | null;
  attemptsUsed: number;
  attemptsRemaining: number | null;
  timeLimitSeconds: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  revealAnswers: boolean;
  questionCount: number;
  totalPoints: number;
  activeAttemptId: string | null;
  activeAttemptExpiresAt: string | null;
}

export interface TrainingQuizLearnerOption {
  id: string;
  text: string;
  textTranslations: LocalizedText;
  isCorrect: boolean | null;
}

export interface TrainingQuizLearnerQuestion {
  id: string;
  type: TrainingQuizQuestionType;
  prompt: string;
  promptTranslations: LocalizedText;
  explanation: string | null;
  explanationTranslations: LocalizedText;
  points: number;
  selectedOptionIds: string[];
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  options: TrainingQuizLearnerOption[];
}

export interface TrainingQuizLearnerAttempt {
  id: string;
  quizId: string;
  quizVersionId: string;
  quizVersion: number;
  courseId: string;
  lessonId: string | null;
  placement: TrainingQuizPlacement;
  title: string;
  titleTranslations: LocalizedText;
  instructions: string | null;
  instructionTranslations: LocalizedText;
  attemptNumber: number;
  status: TrainingQuizAttemptStatus;
  passPercentage: number;
  maxAttempts: number | null;
  timeLimitSeconds: number | null;
  revealAnswers: boolean;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string | null;
  questions: TrainingQuizLearnerQuestion[];
}

export interface TrainingQuizAttemptHistoryItem {
  id: string;
  attemptNumber: number;
  status: TrainingQuizAttemptStatus;
  version: number;
  passPercentage: number;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string | null;
}

export interface TrainingQuizAttemptHistory {
  items: TrainingQuizAttemptHistoryItem[];
}

export interface TrainingQuizAnswerInput {
  selectedOptionIds: string[];
}
