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

import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminNavigation } from "@/components/admin/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { LanguageSwitcher } from "@/components/preferences/language-switcher";
import { buildAdminNavigation } from "@/lib/admin-navigation";
import { hasAdminAccess } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin-server";
import { notificationAdministrationDictionaries } from "@/lib/i18n/notification-administration";
import { notificationBroadcastDictionaries } from "@/lib/i18n/notification-broadcast";
import { portalDictionaries } from "@/lib/i18n/portal";
import { serviceFeatureDictionaries } from "@/lib/i18n/service-features";
import { servicesDictionaries } from "@/lib/i18n/services";
import { settingsDictionaries } from "@/lib/i18n/settings";
import { trainingDictionaries } from "@/lib/i18n/training";
import { trainingCertificateDictionaries } from "@/lib/i18n/training-certificates";
import { getPublicSettings } from "@/lib/public-settings";
import { requireSession } from "@/lib/session";
import { getUserUiPreferences } from "@/lib/user-ui-preferences";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [
    session,
    { locale, dictionary, admin },
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

  const notificationLabels = notificationAdministrationDictionaries[locale];
  const broadcastLabels = notificationBroadcastDictionaries[locale];

  const navigation = buildAdminNavigation(session, {
    dashboard: portalDictionaries[locale].navigation.dashboard,
    overview: admin.navigation.overview,
    companies: admin.navigation.companies,
    myCompany: admin.navigation.myCompany,
    users: admin.navigation.users,
    manageUsers: admin.navigation.manageUsers,
    manageRoles: admin.navigation.manageRoles,
    services: servicesDictionaries[locale].title,
    manageServices: serviceFeatureDictionaries[locale].manageServices,
    featureDefinitions: serviceFeatureDictionaries[locale].featureDefinitions,
    training: trainingDictionaries[locale].navigation,
    trainingCourses: trainingDictionaries[locale].coursesNavigation,
    trainingCategories: trainingDictionaries[locale].categoriesNavigation,
    trainingCertificateTemplates:
      trainingCertificateDictionaries[locale].templatesNavigation,
    trainingCertificates:
      trainingCertificateDictionaries[locale].administrationNavigation,
    notifications: notificationLabels.navigation,
    deliveryLog: notificationLabels.deliveryLog,
    providerStatus: notificationLabels.providerStatus,
    testEmail: notificationLabels.testEmail,
    broadcasts: broadcastLabels.logType,
    settings: settingsDictionaries[locale].title,
  });

  const administrationLabel =
    session.user.accountScope === "PLATFORM"
      ? admin.navigation.platformAdministration
      : admin.navigation.companyAdministration;

  return (
    <div className="min-h-screen bg-surface-page lg:flex lg:h-screen lg:overflow-hidden">
      <AdminSidebar
        siteTitle={publicSettings.siteTitle}
        administrationLabel={administrationLabel}
        navigationLabel={admin.navigation.label}
        entries={navigation}
        signedInAsLabel={dictionary.workspace.signedInAs}
        email={session.user.email}
        initialCollapsed={uiPreferences.sidebarCollapsed}
        collapseLabel={admin.navigation.collapseSidebar}
        expandLabel={admin.navigation.expandSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden">
        <header className="shrink-0 border-b border-line bg-surface-panel px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content lg:hidden">
                {publicSettings.siteTitle}
              </p>
              <p className="mt-1 text-xs text-muted lg:mt-0">
                {administrationLabel}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <LanguageSwitcher
                locale={locale}
                label={dictionary.common.language}
              />
              <LogoutButton
                label={dictionary.workspace.signOut}
                pendingLabel={dictionary.workspace.signingOut}
              />
            </div>
          </div>

          <details className="mt-4 border-t border-line pt-3 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium text-content">
              {admin.navigation.label}
            </summary>
            <div className="mt-3">
              <AdminNavigation
                label={admin.navigation.label}
                entries={navigation}
              />
            </div>
          </details>
        </header>

        <main className="w-full min-w-0 flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}
