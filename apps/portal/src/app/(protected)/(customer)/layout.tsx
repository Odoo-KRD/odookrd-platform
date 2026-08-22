import { PERMISSIONS } from "@odookrd/types";
import { redirect } from "next/navigation";

import {
  AdminNavigation,
  type AdminNavigationItem,
} from "@/components/admin/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { LanguageSwitcher } from "@/components/preferences/language-switcher";
import { hasAdminAccess, hasPermission } from "@/lib/authorization";
import { getPortalDictionary } from "@/lib/i18n/portal-server";
import { frontendTranslations } from "@/lib/i18n/frontend";
import { getPublicSettings } from "@/lib/public-settings";
import { requireSession } from "@/lib/session";

export default async function ProtectedCustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [session, { locale, dictionary, portal }, publicSettings] =
    await Promise.all([
      requireSession(),
      getPortalDictionary(),
      getPublicSettings(),
    ]);

  if (session.user.accountScope !== "COMPANY") {
    redirect("/admin");
  }

  const navigation: AdminNavigationItem[] = [
    { href: "/dashboard", label: portal.navigation.dashboard },
  ];

  if (hasPermission(session, PERMISSIONS.SERVICES_READ)) {
    navigation.push({
      href: "/dashboard/services",
      label: frontendTranslations[locale].services.title,
    });
  }

  navigation.push(
    {
      href: "/dashboard/company",
      label: frontendTranslations[locale].workspace.navigation.company,
    },
    {
      href: "/dashboard/profile",
      label: frontendTranslations[locale].workspace.navigation.profile,
    },
  );

  if (hasPermission(session, PERMISSIONS.NOTIFICATIONS_READ)) {
    navigation.push({
      href: "/dashboard/notifications",
      label: frontendTranslations[locale].notifications.navigation,
    });
  }

  if (hasAdminAccess(session)) {
    navigation.push({
      href: "/admin",
      label: portal.navigation.administration,
    });
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-e border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-200 px-6 py-6">
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            {publicSettings.siteTitle}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {portal.navigation.portal}
          </p>
        </div>

        <div className="flex-1 px-3 py-5">
          <AdminNavigation label={portal.navigation.label} items={navigation} />
        </div>

        <div className="border-t border-slate-200 px-5 py-5">
          <p className="text-xs text-slate-500">
            {dictionary.workspace.signedInAs}
          </p>
          <p
            dir="ltr"
            className="mt-2 truncate text-sm font-medium text-slate-800"
          >
            {session.user.email}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 lg:hidden">
                {publicSettings.siteTitle}
              </p>
              <p className="mt-1 text-xs text-slate-500 lg:mt-0">
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

          <details className="mt-4 border-t border-slate-200 pt-3 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              {portal.navigation.label}
            </summary>
            <div className="mt-3">
              <AdminNavigation
                label={portal.navigation.label}
                items={navigation}
              />
            </div>
          </details>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
