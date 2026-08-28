import { PERMISSIONS, type CustomerAccountProfile } from "@odookrd/types";
import { Badge, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { getCustomerApiContext, hasAdminAccess } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getFrontendDictionary } from "@/lib/i18n/frontend-server";

export default async function CustomerProfilePage() {
  const [{ session, token }, { locale, workspace }] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.COMPANIES_READ),
    getFrontendDictionary(),
  ]);
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

  return (
    <div className="grid gap-7">
      <PageHeading
        title={workspace.profile.title}
        description={workspace.profile.description}
      />

      <Panel className="p-6 sm:p-8">
        <dl className="grid gap-7 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500">
              {workspace.profile.email}
            </dt>
            <dd
              dir="ltr"
              className="mt-2 break-all text-sm font-medium text-slate-900"
            >
              {profile.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">
              {workspace.profile.company}
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-900">
              <Link href="/dashboard/company" className="hover:text-[#714b67]">
                {profile.company.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">
              {workspace.profile.role}
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-900">
              {hasAdminAccess(session)
                ? workspace.profile.companyAdministrator
                : workspace.profile.companyUser}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">
              {workspace.profile.accountStatus}
            </dt>
            <dd className="mt-2">
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
          <div>
            <dt className="text-xs font-medium text-slate-500">
              {workspace.profile.emailVerification}
            </dt>
            <dd className="mt-2">
              <Badge tone={profile.emailVerifiedAt ? "success" : "neutral"}>
                {profile.emailVerifiedAt
                  ? workspace.profile.verified
                  : workspace.profile.notVerified}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">
              {workspace.profile.joined}
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-900">
              {formatDate(profile.createdAt, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">
              {workspace.profile.lastActivity}
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-900">
              {profile.lastSeenAt
                ? formatDate(profile.lastSeenAt, locale)
                : "—"}
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
