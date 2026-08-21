import { PERMISSIONS } from "@odookrd/types";
import { Badge, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { hasAdminAccess, hasPermission } from "@/lib/authorization";
import { getPortalDictionary } from "@/lib/i18n/portal-server";
import { servicesDictionaries } from "@/lib/i18n/services";
import { requireSession } from "@/lib/session";

export default async function CustomerDashboardPage() {
  const [session, { locale, portal }] = await Promise.all([
    requireSession(),
    getPortalDictionary(),
  ]);
  const isCompanyAdministrator = hasAdminAccess(session);

  return (
    <div className="grid gap-8">
      <PageHeading
        title={portal.dashboard.title}
        description={portal.dashboard.description}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-6 sm:p-7">
          <h2 className="text-base font-semibold text-slate-900">
            {portal.dashboard.accountTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {portal.dashboard.accountDescription}
          </p>

          <dl className="mt-6 grid gap-5">
            <div>
              <dt className="text-xs font-medium text-slate-500">
                {portal.dashboard.email}
              </dt>
              <dd dir="ltr" className="mt-1 text-sm font-medium text-slate-900">
                {session.user.email}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-500">
                {portal.dashboard.status}
              </dt>
              <dd className="mt-2">
                <Badge tone="success">{portal.dashboard.active}</Badge>
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-500">
                {portal.dashboard.accountType}
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {isCompanyAdministrator
                  ? portal.dashboard.companyAdministrator
                  : portal.dashboard.companyUser}
              </dd>
            </div>
          </dl>
        </Panel>

        {hasPermission(session, PERMISSIONS.SERVICES_READ) ? (
          <Panel className="p-6 sm:p-7">
            <h2 className="text-base font-semibold text-slate-900">
              {servicesDictionaries[locale].customerTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {servicesDictionaries[locale].customerSummary}
            </p>
            <Link
              href="/dashboard/services"
              className="mt-5 inline-flex text-sm font-medium text-[#714b67] hover:text-[#62405a]"
            >
              {servicesDictionaries[locale].view}
            </Link>
          </Panel>
        ) : null}

        {isCompanyAdministrator ? (
          <Panel className="p-6 sm:p-7">
            <h2 className="text-base font-semibold text-slate-900">
              {portal.dashboard.administrationTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {portal.dashboard.administrationDescription}
            </p>
            <Link
              href="/admin"
              className="mt-5 inline-flex text-sm font-medium text-[#714b67] hover:text-[#62405a]"
            >
              {portal.dashboard.openAdministration}
            </Link>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
