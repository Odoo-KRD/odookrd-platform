import type { PlatformAccountProfile } from "@odookrd/types";
import { Badge } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { CustomerProfileEditor } from "@/components/customer/customer-profile-editor";
import { apiRequest } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { customerDashboardV2Dictionaries } from "@/lib/i18n/customer/dashboard";
import { getFrontendDictionary } from "@/lib/i18n/public/server";
import { roleCatalogDictionaries } from "@/lib/i18n/users/role-catalog";
import { userProfileEditDictionaries } from "@/lib/i18n/users/profile-edit";
import { getSessionToken, requireSession } from "@/lib/session";

/** A platform administrator's own profile. Company accounts use /dashboard/profile. */
export default async function AdminProfilePage() {
  const [session, { locale, dictionary, workspace }] = await Promise.all([
    requireSession(),
    getFrontendDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard/profile");
  }

  const token = await getSessionToken();
  if (!token) redirect("/login");

  const profile = await apiRequest<PlatformAccountProfile>(
    "/workspace/profile",
    { token },
  );

  const labels = customerDashboardV2Dictionaries[locale].profile;
  const adminLabels = userProfileEditDictionaries[locale];
  const roleCatalog = roleCatalogDictionaries[locale];
  const roleLabels: Record<string, string> = {
    platform_admin: roleCatalog.platformAdmin,
    company_admin: roleCatalog.companyAdmin,
    company_user: roleCatalog.companyUser,
  };

  return (
    <div className="grid gap-6 sm:gap-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
          {labels.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-content sm:text-3xl">
          {labels.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">
          {adminLabels.adminProfileDescription}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <CustomerProfileEditor
          initialProfile={profile}
          locale={locale}
          languageLabel={dictionary.common.language}
          labels={labels}
        />

        <aside className="h-fit rounded-xl border border-line bg-surface-panel p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-content">
            {labels.accountInformation}
          </h2>
          <dl className="mt-5 grid gap-5">
            <div>
              <dt className="text-xs font-medium text-muted">
                {adminLabels.accountType}
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-content">
                {adminLabels.platformAccount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                {adminLabels.roles}
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-2">
                {profile.roles.map((role) => (
                  <Badge key={role}>{roleLabels[role] ?? role}</Badge>
                ))}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-xs font-medium text-muted">
                {workspace.profile.accountStatus}
              </dt>
              <dd>
                <Badge tone={profile.status === "ACTIVE" ? "success" : "warning"}>
                  {workspace.profile.statusLabels[profile.status]}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                {workspace.profile.joined}
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-content">
                {formatDate(profile.createdAt, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                {workspace.profile.lastActivity}
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-content">
                {profile.lastSeenAt
                  ? formatDate(profile.lastSeenAt, locale)
                  : "—"}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
