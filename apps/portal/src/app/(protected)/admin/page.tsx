import { PERMISSIONS, type DashboardSectionKey } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import {
  AdminDashboard,
  type AdminDashboardSection,
} from "@/components/admin/admin-dashboard";
import { hasPermission } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin-server";
import { adminDashboardDictionaries } from "@/lib/i18n/admin-dashboard";
import { notificationAdministrationDictionaries } from "@/lib/i18n/notification-administration";
import { servicesDictionaries } from "@/lib/i18n/services";
import { settingsDictionaries } from "@/lib/i18n/settings";
import { requireSession } from "@/lib/session";
import { getUserUiPreferences } from "@/lib/user-ui-preferences";

export default async function AdminOverviewPage() {
  const [session, { locale, admin }, uiPreferences] = await Promise.all([
    requireSession(),
    getAdminDictionary(),
    getUserUiPreferences(),
  ]);

  const sections: AdminDashboardSection[] = [];

  function addSection(
    id: DashboardSectionKey,
    href: string,
    title: string,
    description: string,
  ): void {
    sections.push({
      id,
      href,
      title,
      description,
      openLabel: admin.overview.openSection,
    });
  }

  if (hasPermission(session, PERMISSIONS.COMPANIES_READ)) {
    addSection(
      "companies",
      "/admin/companies",
      session.user.accountScope === "COMPANY"
        ? admin.navigation.myCompany
        : admin.navigation.companies,
      session.user.accountScope === "COMPANY"
        ? admin.overview.companyDescription
        : admin.overview.companiesDescription,
    );
  }

  if (hasPermission(session, PERMISSIONS.USERS_READ)) {
    addSection(
      "users",
      "/admin/users",
      admin.navigation.users,
      admin.overview.usersDescription,
    );
  }

  if (hasPermission(session, PERMISSIONS.ROLES_READ)) {
    addSection(
      "roles",
      "/admin/roles",
      admin.navigation.roles,
      admin.overview.rolesDescription,
    );
  }

  if (
    session.user.accountScope === "PLATFORM" &&
    hasPermission(session, PERMISSIONS.SERVICES_MANAGE)
  ) {
    const services = servicesDictionaries[locale];
    addSection(
      "services",
      "/admin/services",
      services.title,
      services.description,
    );
  }

  if (hasPermission(session, PERMISSIONS.NOTIFICATIONS_MANAGE)) {
    const notifications = notificationAdministrationDictionaries[locale];
    addSection(
      "notifications",
      "/admin/notifications/deliveries",
      notifications.navigation,
      notifications.description,
    );
  }

  if (hasPermission(session, PERMISSIONS.SETTINGS_READ)) {
    const settings = settingsDictionaries[locale];
    addSection(
      "settings",
      "/admin/settings",
      settings.title,
      settings.description,
    );
  }

  return (
    <div className="grid gap-8">
      <PageHeading
        title={admin.overview.title}
        description={admin.overview.description}
      />

      {session.user.accountScope === "PLATFORM" ? (
        <AdminDashboard
          sections={sections}
          initialPreferences={uiPreferences.dashboardPreferences}
          labels={adminDashboardDictionaries[locale]}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Panel key={section.id} className="p-6">
              <h2 className="text-base font-semibold text-content">
                {section.title}
              </h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted">
                {section.description}
              </p>
              <Link
                href={section.href}
                className="mt-5 inline-flex text-sm font-medium text-brand hover:text-brand-hover"
              >
                {section.openLabel}
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
