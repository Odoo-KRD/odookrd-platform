import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/600.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-serif/400.css";
import "@fontsource/noto-serif/500.css";
import "@fontsource/noto-serif/600.css";
import "@fontsource/noto-serif/700.css";
import "@fontsource/noto-sans-arabic/400.css";
import "@fontsource/noto-sans-arabic/500.css";
import "@fontsource/noto-sans-arabic/600.css";
import "@fontsource/noto-sans-arabic/700.css";
import "@fontsource/noto-naskh-arabic/400.css";
import "@fontsource/noto-naskh-arabic/500.css";
import "@fontsource/noto-naskh-arabic/600.css";
import "@fontsource/noto-naskh-arabic/700.css";

import {
  PERMISSIONS,
  type CustomerNotificationPage,
  type NotificationUnreadCount,
} from "@odookrd/types";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminShellHeader } from "@/components/admin/admin-shell-header";
import { buildAdminNavigation } from "@/lib/admin-navigation";
import { apiRequest } from "@/lib/api";
import { hasAdminAccess, hasPermission } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin/server";
import { adminHeaderDictionaries } from "@/lib/i18n/shell/header";
import { getPublicSettings } from "@/lib/public-settings";
import { getSessionToken, requireSession } from "@/lib/session";
import { getUserUiPreferences } from "@/lib/user-ui-preferences";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [
    session,
    { locale, navigation: navLabels, dictionary },
    publicSettings,
    uiPreferences,
  ] = await Promise.all([
    requireSession(),
    getAdminDictionary(),
    getPublicSettings(),
    getUserUiPreferences(),
  ]);

  if (!hasAdminAccess(session)) {
    redirect("/dashboard");
  }

  // The bell only loads an inbox for accounts that own one. Platform accounts
  // without a company scope simply get a header without notifications.
  const canNotifications = hasPermission(
    session,
    PERMISSIONS.NOTIFICATIONS_READ,
  );
  const token = canNotifications ? await getSessionToken() : null;

  const [notificationPage, unread] = await Promise.all([
    token
      ? apiRequest<CustomerNotificationPage>("/notifications?limit=5&offset=0", {
          token,
        }).catch(() => null)
      : Promise.resolve(null),
    token
      ? apiRequest<NotificationUnreadCount>("/notifications/unread-count", {
          token,
        }).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Every sidebar label now lives in one place: navLabels.
  const navigation = buildAdminNavigation(session, {
    dashboard: navLabels.dashboard,
    overview: navLabels.overview,
    companies: navLabels.companies,
    myCompany: navLabels.myCompany,
    users: navLabels.users,
    manageUsers: navLabels.manageUsers,
    manageRoles: navLabels.manageRoles,
    services: navLabels.services,
    manageServices: navLabels.manageServices,
    featureDefinitions: navLabels.featureDefinitions,
    renewalRequests: navLabels.renewalRequests,
    renewalPipeline: navLabels.renewalPipeline,
    training: navLabels.training,
    trainingCourses: navLabels.trainingCourses,
    trainingCategories: navLabels.trainingCategories,
    trainingCertificateTemplates: navLabels.trainingCertificateTemplates,
    trainingCertificates: navLabels.trainingCertificates,
    trainingReports: navLabels.trainingReports,
    helpdesk: navLabels.helpdesk,
    helpdeskQueue: navLabels.helpdeskQueue,
    helpdeskDepartments: navLabels.helpdeskDepartments,
    knowledge: navLabels.knowledge,
    knowledgeCategories: navLabels.knowledgeCategories,
    knowledgeArticles: navLabels.knowledgeArticles,
    notifications: navLabels.notifications,
    deliveryLog: navLabels.deliveryLog,
    notificationsInbox: navLabels.notificationsInbox,
    providerStatus: navLabels.providerStatus,
    testEmail: navLabels.testEmail,
    broadcasts: navLabels.broadcasts,
    settings: navLabels.settings,
  });

  const administrationLabel =
    session.user.accountScope === "PLATFORM"
      ? navLabels.platformAdministration
      : navLabels.companyAdministration;

  return (
    <div className="min-h-screen bg-surface-page lg:flex lg:h-screen lg:overflow-hidden">
      <AdminSidebar
        siteTitle={publicSettings.siteTitle}
        administrationLabel={administrationLabel}
        navigationLabel={navLabels.label}
        entries={navigation}
        initialCollapsed={uiPreferences.sidebarCollapsed}
        collapseLabel={navLabels.collapseSidebar}
        expandLabel={navLabels.expandSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden">
        <AdminShellHeader
          siteTitle={publicSettings.siteTitle}
          workspaceLabel={administrationLabel}
          workspaceName={publicSettings.siteTitle}
          navigationLabel={navLabels.label}
          navigation={navigation}
          locale={locale}
          languageLabel={dictionary.common.language}
          labels={adminHeaderDictionaries[locale]}
          email={session.user.email}
          displayName={null}
          unreadCount={unread?.unread ?? 0}
          notifications={notificationPage?.items ?? []}
          canNotifications={canNotifications}
          canSettings={hasPermission(session, PERMISSIONS.SETTINGS_READ)}
          canCustomerPortal={session.user.accountScope === "COMPANY"}
          settingsLabel={navLabels.settings}
          customerPortalLabel={navLabels.dashboard}
        />

        <main className="w-full min-w-0 flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}
