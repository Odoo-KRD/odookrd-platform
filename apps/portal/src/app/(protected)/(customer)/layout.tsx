import { PERMISSIONS, type TrainingCatalogStatus } from "@odookrd/types";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  AdminNavigation,
  type AdminNavigationItem,
} from "@/components/admin/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { LanguageSwitcher } from "@/components/preferences/language-switcher";
import { apiRequest } from "@/lib/api";
import { hasAdminAccess, hasPermission } from "@/lib/authorization";
import { frontendTranslations } from "@/lib/i18n/frontend";
import { getPortalDictionary } from "@/lib/i18n/portal-server";
import { trainingCustomerDictionaries } from "@/lib/i18n/training-customer";
import { getPublicSettings } from "@/lib/public-settings";
import { getSessionToken, requireSession } from "@/lib/session";
import { getUserUiPreferences } from "@/lib/user-ui-preferences";

export default async function ProtectedCustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [
    session,
    { locale, dictionary, portal },
    publicSettings,
    uiPreferences,
  ] = await Promise.all([
    requireSession(),
    getPortalDictionary(),
    getPublicSettings(),
    getUserUiPreferences(),
  ]);

  if (session.user.accountScope !== "COMPANY") {
    redirect("/admin");
  }

  let trainingEnabled = false;

  if (
    session.user.companyId &&
    hasPermission(session, PERMISSIONS.TRAINING_READ)
  ) {
    const token = await getSessionToken();

    if (token) {
      try {
        const status = await apiRequest<TrainingCatalogStatus>(
          "/training/catalog/status",
          { token },
        );
        trainingEnabled = status.enabled;
      } catch {
        trainingEnabled = false;
      }
    }
  }

  const navigation: AdminNavigationItem[] = [
    {
      kind: "item",
      href: "/dashboard",
      label: portal.navigation.dashboard,
      icon: "dashboard",
    },
  ];

  if (hasPermission(session, PERMISSIONS.SERVICES_READ)) {
    navigation.push({
      kind: "item",
      href: "/dashboard/services",
      label: frontendTranslations[locale].services.title,
      icon: "services",
    });
  }

  if (trainingEnabled) {
    navigation.push({
      kind: "item",
      href: "/dashboard/training",
      label: trainingCustomerDictionaries[locale].navigation,
      icon: "training",
    });
  }

  navigation.push(
    {
      kind: "item",
      href: "/dashboard/company",
      label: frontendTranslations[locale].workspace.navigation.company,
      icon: "companies",
    },
    {
      kind: "item",
      href: "/dashboard/profile",
      label: frontendTranslations[locale].workspace.navigation.profile,
      icon: "users",
    },
  );

  if (hasPermission(session, PERMISSIONS.NOTIFICATIONS_READ)) {
    navigation.push({
      kind: "item",
      href: "/dashboard/notifications",
      label: frontendTranslations[locale].notifications.navigation,
      icon: "notifications",
    });
  }

  if (hasAdminAccess(session)) {
    navigation.push({
      kind: "item",
      href: "/admin",
      label: portal.navigation.administration,
      icon: "overview",
    });
  }

  return (
    <div className="min-h-screen bg-surface-page lg:flex lg:h-screen lg:overflow-hidden">
      <AdminSidebar
        siteTitle={publicSettings.siteTitle}
        administrationLabel={portal.navigation.portal}
        navigationLabel={portal.navigation.label}
        entries={navigation}
        signedInAsLabel={dictionary.workspace.signedInAs}
        email={session.user.email}
        initialCollapsed={uiPreferences.sidebarCollapsed}
        collapseLabel={portal.navigation.collapseSidebar}
        expandLabel={portal.navigation.expandSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden">
        <header className="customer-shell-header shrink-0 border-b border-line bg-surface-panel px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content lg:hidden">
                {publicSettings.siteTitle}
              </p>
              <p className="mt-1 text-xs text-muted lg:mt-0">
                {portal.navigation.portal}
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
              {portal.navigation.label}
            </summary>
            <div className="mt-3">
              <AdminNavigation
                label={portal.navigation.label}
                entries={navigation}
              />
            </div>
          </details>
        </header>

        <main className="customer-shell-main w-full min-w-0 flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}
