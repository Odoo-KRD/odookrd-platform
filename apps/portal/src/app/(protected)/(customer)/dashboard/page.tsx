import { PERMISSIONS, type CustomerWorkspaceOverview } from "@odookrd/types";
import { Badge, EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { AssignmentStatusBadge } from "@/components/services/service-status-badge";
import { apiRequest } from "@/lib/api";
import { getCustomerApiContext, hasAdminAccess } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getFrontendDictionary } from "@/lib/i18n/frontend-server";

export default async function CustomerDashboardPage() {
  const [{ session, token }, { locale, portal, services, workspace }] =
    await Promise.all([
      getCustomerApiContext(PERMISSIONS.SERVICES_READ),
      getFrontendDictionary(),
    ]);
  const overview = await apiRequest<CustomerWorkspaceOverview>(
    "/workspace/overview",
    { token },
  );
  const isCompanyAdministrator = hasAdminAccess(session);

  const summaryCards = [
    { label: workspace.dashboard.totalServices, value: overview.summary.total },
    {
      label: workspace.dashboard.activeServices,
      value: overview.summary.active,
    },
    {
      label: workspace.dashboard.provisioningServices,
      value: overview.summary.provisioning,
    },
    {
      label: workspace.dashboard.attentionServices,
      value: overview.summary.suspended + overview.summary.expired,
    },
  ];

  return (
    <div className="grid gap-8">
      <PageHeading
        title={portal.dashboard.title}
        description={portal.dashboard.description}
        actions={
          <Link
            href="/dashboard/profile"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {workspace.dashboard.openProfile}
          </Link>
        }
      />

      <section aria-label={workspace.dashboard.serviceOverview}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Panel key={card.label} className="p-5 sm:p-6">
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {card.value}
              </p>
            </Panel>
          ))}
        </div>

        {overview.summary.expiringSoon > 0 ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {workspace.dashboard.expiringSoon}: {overview.summary.expiringSoon}{" "}
            · {workspace.dashboard.nextThirtyDays}
          </p>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-900">
              {workspace.dashboard.recentServices}
            </h2>
            <Link
              href="/dashboard/services"
              className="text-sm font-medium text-[#714b67] hover:text-[#62405a]"
            >
              {workspace.dashboard.viewAllServices}
            </Link>
          </div>

          {overview.recentServices.length === 0 ? (
            <EmptyState
              title={workspace.dashboard.noRecentServices}
              description={services.customerEmptyDescription}
            />
          ) : (
            <ul className="divide-y divide-slate-200">
              {overview.recentServices.map((assignment) => (
                <li key={assignment.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">
                        {services.categoryLabels[assignment.service.category]}
                      </p>
                      <Link
                        href={`/dashboard/services/${assignment.id}`}
                        className="mt-1 inline-block text-sm font-semibold text-slate-900 hover:text-[#714b67]"
                      >
                        {assignment.displayName ?? assignment.service.name}
                      </Link>
                      {assignment.expiresAt ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {services.expiresAt}:{" "}
                          {formatDate(assignment.expiresAt, locale)}
                        </p>
                      ) : null}
                    </div>
                    <AssignmentStatusBadge
                      status={assignment.status}
                      labels={services}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid gap-5">
          <Panel className="p-6">
            <h2 className="text-base font-semibold text-slate-900">
              {workspace.dashboard.companyOverview}
            </h2>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {overview.company.name}
            </p>
            <dl className="mt-5 grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-slate-500">
                  {workspace.dashboard.companyStatus}
                </dt>
                <dd>
                  <Badge
                    tone={
                      overview.company.status === "ACTIVE"
                        ? "success"
                        : "warning"
                    }
                  >
                    {workspace.company.statusLabels[overview.company.status]}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-slate-500">
                  {workspace.dashboard.teamMembers}
                </dt>
                <dd className="text-sm font-medium text-slate-900">
                  {overview.teamMembers}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-slate-500">
                  {workspace.dashboard.memberSince}
                </dt>
                <dd className="text-sm font-medium text-slate-900">
                  {formatDate(overview.company.createdAt, locale)}
                </dd>
              </div>
            </dl>
            <Link
              href="/dashboard/company"
              className="mt-6 inline-flex text-sm font-medium text-[#714b67] hover:text-[#62405a]"
            >
              {workspace.dashboard.openCompany}
            </Link>
            {isCompanyAdministrator ? (
              <Link
                href="/admin"
                className="ms-4 mt-6 inline-flex text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                {portal.dashboard.openAdministration}
              </Link>
            ) : null}
          </Panel>

          <Panel className="overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-base font-semibold text-slate-900">
                {workspace.dashboard.recentActivity}
              </h2>
            </div>
            {overview.recentActivity.length === 0 ? (
              <p className="px-6 py-7 text-sm text-slate-500">
                {workspace.dashboard.noRecentActivity}
              </p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {overview.recentActivity.map((entry) => (
                  <li key={entry.id} className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">
                      {workspace.activity.labels[entry.action]}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(entry.createdAt, locale)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
