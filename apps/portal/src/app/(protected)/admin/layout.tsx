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
import { getAdminDictionary } from "@/lib/i18n/admin/server";
import { getPublicSettings } from "@/lib/public-settings";
import { requireSession } from "@/lib/session";
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
    notifications: navLabels.notifications,
    deliveryLog: navLabels.deliveryLog,
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
        signedInAsLabel={dictionary.workspace.signedInAs}
        email={session.user.email}
        initialCollapsed={uiPreferences.sidebarCollapsed}
        collapseLabel={navLabels.collapseSidebar}
        expandLabel={navLabels.expandSidebar}
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
              {navLabels.label}
            </summary>
            <div className="mt-3">
              <AdminNavigation label={navLabels.label} entries={navigation} />
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
