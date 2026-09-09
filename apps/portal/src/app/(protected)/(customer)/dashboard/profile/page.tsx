import { PERMISSIONS, type CustomerAccountProfile } from "@odookrd/types";
import { Badge } from "@odookrd/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerProfileEditor } from "@/components/customer/customer-profile-editor";
import { apiRequest } from "@/lib/api";
import {
  getCustomerAccountApiContext,
  hasAdminAccess,
  hasPermission,
} from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { customerDashboardV2Dictionaries } from "@/lib/i18n/portal/dashboard";
import { getFrontendDictionary } from "@/lib/i18n/frontend/server";

export default async function CustomerProfilePage() {
  const [{ session, token }, { locale, dictionary, workspace }] =
    await Promise.all([getCustomerAccountApiContext(), getFrontendDictionary()]);
  const profile = await apiRequest<CustomerAccountProfile>(
    "/workspace/profile",
    { token },
  );

  if (
    profile.id !== session.user.id ||
    profile.companyId !== session.user.companyId
  ) {
    notFound();
  }

  const labels = customerDashboardV2Dictionaries[locale].profile;
  const canReadCompany = hasPermission(session, PERMISSIONS.COMPANIES_READ);

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
          {labels.description}
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
                {workspace.profile.company}
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-content">
                {canReadCompany ? (
                  <Link href="/dashboard/company" className="hover:text-brand">
                    {profile.company.name}
                  </Link>
                ) : (
                  profile.company.name
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                {workspace.profile.role}
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-content">
                {hasAdminAccess(session)
                  ? workspace.profile.companyAdministrator
                  : workspace.profile.companyUser}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-xs font-medium text-muted">
                {workspace.profile.accountStatus}
              </dt>
              <dd>
                <Badge
                  tone={
                    profile.status === "ACTIVE"
                      ? "success"
                      : profile.status === "ARCHIVED"
                        ? "neutral"
                        : "warning"
                  }
                >
                  {workspace.profile.statusLabels[profile.status]}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-xs font-medium text-muted">
                {workspace.profile.emailVerification}
              </dt>
              <dd>
                <Badge tone={profile.emailVerifiedAt ? "success" : "neutral"}>
                  {profile.emailVerifiedAt
                    ? workspace.profile.verified
                    : workspace.profile.notVerified}
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
