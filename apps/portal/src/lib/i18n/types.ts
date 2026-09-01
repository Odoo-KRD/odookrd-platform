import type {
  CompanyServiceStatus,
  Locale,
  ServiceCatalogStatus,
  ServiceCategory,
  SettingCategory,
  SettingSource,
} from "@odookrd/types";

export interface Dictionary {
  common: {
    brand: string;
    language: string;
    platform: string;
    secureAccess: string;
  };
  login: {
    title: string;
    description: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    invalidCredentials: string;
    tooManyAttempts: string;
    unavailable: string;
  };
  workspace: {
    adminTitle: string;
    adminDescription: string;
    customerTitle: string;
    customerDescription: string;
    signedInAs: string;
    permissions: string;
    signOut: string;
    signingOut: string;
  };
}

export interface AdminDictionary {
  navigation: {
    label: string;
    overview: string;
    companies: string;
    myCompany: string;
    users: string;
    roles: string;
    manageUsers: string;
    manageRoles: string;
    manageNotifications: string;
    collapseSidebar: string;
    expandSidebar: string;
    platformAdministration: string;
    companyAdministration: string;
  };
  overview: {
    title: string;
    description: string;
    companiesDescription: string;
    companyDescription: string;
    usersDescription: string;
    rolesDescription: string;
    openSection: string;
  };
  companies: {
    title: string;
    description: string;
    ownDescription: string;
    create: string;
    createTitle: string;
    createDescription: string;
    detailsTitle: string;
    editTitle: string;
    name: string;
    status: string;
    created: string;
    updated: string;
    actions: string;
    view: string;
    save: string;
    saving: string;
    cancel: string;
    changeStatus: string;
    applyStatus: string;
    statusActive: string;
    statusSuspended: string;
    statusArchived: string;
    allStatuses: string;
    emptyTitle: string;
    emptyDescription: string;
    archiveConfirmation: string;
    previous: string;
    next: string;
    records: string;
  };
  roles: {
    title: string;
    description: string;
    readOnly: string;
    name: string;
    scope: string;
    permissions: string;
    noPermissions: string;
    emptyTitle: string;
    emptyDescription: string;
    platform: string;
    company: string;
    platformAdmin: string;
    companyAdmin: string;
    companyUser: string;
  };
  users: {
    title: string;
    nextStep: string;
  };
}

export interface UsersDictionary {
  title: string;
  description: string;
  ownDescription: string;
  invite: string;
  inviteTitle: string;
  inviteDescription: string;
  detailsTitle: string;
  email: string;
  status: string;
  accountScope: string;
  company: string;
  roles: string;
  created: string;
  updated: string;
  emailVerified: string;
  emailNotVerified: string;
  actions: string;
  view: string;
  platform: string;
  companyAccount: string;
  platformAccount: string;
  chooseCompany: string;
  chooseRoles: string;
  allCompanies: string;
  allStatuses: string;
  statusInvited: string;
  statusActive: string;
  statusSuspended: string;
  statusArchived: string;
  saveRoles: string;
  updateStatus: string;
  applyStatus: string;
  save: string;
  saving: string;
  sendInvitation: string;
  creatingInvitation: string;
  cancel: string;
  previous: string;
  next: string;
  records: string;
  emptyTitle: string;
  emptyDescription: string;
  invitationCreated: string;
  invitationDescription: string;
  invitationExpires: string;
  invitationLink: string;
  copyLink: string;
  copied: string;
  confirmPlatformInvitation: string;
  invitationPending: string;
}

export interface FieldCopy {
  label: string;
  description: string;
}

export interface SettingsDictionary {
  title: string;
  description: string;
  platformScope: string;
  companyScope: string;
  platformDescription: string;
  companyDescription: string;
  selectScope: string;
  platformDefaults: string;
  save: string;
  saving: string;
  saved: string;
  configured: string;
  notConfigured: string;
  clearSecret: string;
  secretPlaceholder: string;
  readOnly: string;
  inheritedNotice: string;
  categories: Record<SettingCategory, string>;
  categoryDescriptions: Record<SettingCategory, string>;
  sources: Record<SettingSource, string>;
  localeOptions: Record<Locale, string>;
  booleanOptions: { enabled: string; disabled: string };
  fields: Record<string, FieldCopy>;
}

export interface ServicesDictionary {
  title: string;
  description: string;
  catalog: string;
  assignments: string;
  addService: string;
  assignService: string;
  editService: string;
  editAssignment: string;
  service: string;
  company: string;
  key: string;
  name: string;
  category: string;
  status: string;
  serviceDescription: string;
  displayName: string;
  serviceUrl: string;
  startsAt: string;
  expiresAt: string;
  notes: string;
  internalNotes: string;
  internalNotesHint: string;
  assignmentCount: string;
  created: string;
  actions: string;
  view: string;
  openService: string;
  back: string;
  save: string;
  saving: string;
  cancel: string;
  chooseCompany: string;
  chooseService: string;
  allStatuses: string;
  allCategories: string;
  records: string;
  previous: string;
  next: string;
  emptyCatalogTitle: string;
  emptyCatalogDescription: string;
  emptyAssignmentsTitle: string;
  emptyAssignmentsDescription: string;
  categoryLabels: Record<ServiceCategory, string>;
  catalogStatusLabels: Record<ServiceCatalogStatus, string>;
  assignmentStatusLabels: Record<CompanyServiceStatus, string>;
}

export interface PortalDictionary {
  navigation: {
    label: string;
    dashboard: string;
    administration: string;
    portal: string;
    collapseSidebar: string;
    expandSidebar: string;
  };
  dashboard: {
    title: string;
    description: string;
    accountTitle: string;
    accountDescription: string;
    email: string;
    status: string;
    active: string;
    accountType: string;
    companyAdministrator: string;
    companyUser: string;
    administrationTitle: string;
    administrationDescription: string;
    openAdministration: string;
  };
}

export interface InvitationDictionary {
  acceptanceTitle: string;
  acceptanceDescription: string;
  newPassword: string;
  confirmPassword: string;
  passwordHint: string;
  activateAccount: string;
  activatingAccount: string;
  invalidInvitation: string;
  passwordsDoNotMatch: string;
  acceptanceUnavailable: string;
  accountActivated: string;
}

export interface FrontendServicesDictionary {
  title: string;
  customerTitle: string;
  customerDescription: string;
  customerSummary: string;
  service: string;
  category: string;
  status: string;
  serviceDescription: string;
  displayName: string;
  serviceUrl: string;
  startsAt: string;
  expiresAt: string;
  notes: string;
  view: string;
  openService: string;
  back: string;
  records: string;
  previous: string;
  next: string;
  customerEmptyTitle: string;
  customerEmptyDescription: string;
  categoryLabels: Record<ServiceCategory, string>;
  assignmentStatusLabels: Record<CompanyServiceStatus, string>;
}

export interface AdminErrorDictionary {
  title: string;
  description: string;
  retry: string;
}

export interface ContentEditorDictionary {
  locale: Locale;
  translations: string;
  saveTranslations: string;
  discardTranslations: string;
  defaultLanguage: string;
  optionalLanguage: string;
  languages: Record<Locale, string>;
}

export interface AdminTranslations {
  administration: AdminDictionary;
  users: UsersDictionary;
  settings: SettingsDictionary;
  services: ServicesDictionary;
  errors: AdminErrorDictionary;
  content: ContentEditorDictionary;
}

export interface CustomerWorkspaceDictionary {
  navigation: {
    company: string;
    profile: string;
  };
  dashboard: {
    serviceOverview: string;
    totalServices: string;
    activeServices: string;
    provisioningServices: string;
    attentionServices: string;
    expiringSoon: string;
    nextThirtyDays: string;
    recentServices: string;
    recentActivity: string;
    noRecentServices: string;
    noRecentActivity: string;
    viewAllServices: string;
    companyOverview: string;
    teamMembers: string;
    companyStatus: string;
    memberSince: string;
    openCompany: string;
    openProfile: string;
  };
  company: {
    title: string;
    description: string;
    companyName: string;
    status: string;
    created: string;
    updated: string;
    teamMembers: string;
    editTitle: string;
    editDescription: string;
    readOnly: string;
    save: string;
    saving: string;
    cancel: string;
    statusLabels: Record<"ACTIVE" | "SUSPENDED" | "ARCHIVED", string>;
  };
  profile: {
    title: string;
    description: string;
    email: string;
    company: string;
    role: string;
    accountStatus: string;
    emailVerification: string;
    verified: string;
    notVerified: string;
    joined: string;
    lastActivity: string;
    companyAdministrator: string;
    companyUser: string;
    statusLabels: Record<
      "INVITED" | "ACTIVE" | "SUSPENDED" | "ARCHIVED",
      string
    >;
  };
  activity: {
    labels: Record<
      | "company.created"
      | "company.updated"
      | "company.status.updated"
      | "service.assignment.created"
      | "service.assignment.updated"
      | "user.invited"
      | "user.created"
      | "user.status.updated"
      | "user.roles.updated",
      string
    >;
  };
}

export interface NotificationCenterDictionary {
  navigation: string;
  title: string;
  description: string;
  unread: string;
  unreadCount: string;
  markRead: string;
  markAllRead: string;
  emptyTitle: string;
  emptyDescription: string;
  previous: string;
  next: string;
  channels: {
    IN_APP: string;
    EMAIL: string;
    WHATSAPP: string;
  };
  deliveryStatuses: {
    PENDING: string;
    PROCESSING: string;
    SENT: string;
    FAILED: string;
    SKIPPED: string;
  };
}

export interface FrontendTranslations {
  portal: PortalDictionary;
  services: FrontendServicesDictionary;
  invitations: InvitationDictionary;
  workspace: CustomerWorkspaceDictionary;
  content: ContentEditorDictionary;
  notifications: NotificationCenterDictionary;
}
