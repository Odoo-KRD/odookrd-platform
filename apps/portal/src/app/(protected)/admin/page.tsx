import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { hasPermission } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin-server";
import { settingsDictionaries } from "@/lib/i18n/settings";
import { requireSession } from "@/lib/session";

export default async function AdminOverviewPage() {
  const [session, { locale, admin }] = await Promise.all([
    requireSession(),
    getAdminDictionary(),
  ]);

  const sections: Array<{ href: string; title: string; description: string }> =
    [];

  if (hasPermission(session, PERMISSIONS.COMPANIES_READ)) {
    sections.push({
      href: "/admin/companies",
      title:
        session.user.accountScope === "COMPANY"
          ? admin.navigation.myCompany
          : admin.navigation.companies,
      description:
        session.user.accountScope === "COMPANY"
          ? admin.overview.companyDescription
          : admin.overview.companiesDescription,
    });
  }

  if (hasPermission(session, PERMISSIONS.USERS_READ)) {
    sections.push({
      href: "/admin/users",
      title: admin.navigation.users,
      description: admin.overview.usersDescription,
    });
  }

  if (hasPermission(session, PERMISSIONS.ROLES_READ)) {
    sections.push({
      href: "/admin/roles",
      title: admin.navigation.roles,
      description: admin.overview.rolesDescription,
    });
  }

  if (hasPermission(session, PERMISSIONS.SETTINGS_READ)) {
    const settings = settingsDictionaries[locale];
    sections.push({
      href: "/admin/settings",
      title: settings.title,
      description: settings.description,
    });
  }

  return (
    <div className="grid gap-8">
      <PageHeading
        title={admin.overview.title}
        description={admin.overview.description}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Panel key={section.href} className="p-6">
            <h2 className="text-base font-semibold text-slate-900">
              {section.title}
            </h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
              {section.description}
            </p>
            <Link
              href={section.href}
              className="mt-5 inline-flex text-sm font-medium text-[#714b67] hover:text-[#62405a]"
            >
              {admin.overview.openSection}
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}
