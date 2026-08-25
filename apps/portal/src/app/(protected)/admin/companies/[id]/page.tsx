import {
  PERMISSIONS,
  type Company,
  type CompanyServiceAssignment,
  type PaginatedResult,
} from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { CompanyForm } from "@/components/companies/company-form";
import { CompanyStatusBadge } from "@/components/companies/company-status-badge";
import { CompanyStatusForm } from "@/components/companies/company-status-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getAdminDictionary } from "@/lib/i18n/admin-server";
import { adminTableDictionaries } from "@/lib/i18n/admin-table";
import { serviceFeatureDictionaries } from "@/lib/i18n/service-features";
import { servicesDictionaries } from "@/lib/i18n/services";

import { updateCompanyAction, updateCompanyStatusAction } from "../actions";

interface CompanyDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailsPage({
  params,
}: CompanyDetailsPageProps) {
  const [{ session, token }, { locale, admin, content }, { id }] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.COMPANIES_READ),
      getAdminDictionary(),
      params,
    ]);

  const canReadServices =
    session.user.accountScope === "PLATFORM" &&
    hasPermission(session, PERMISSIONS.SERVICES_READ);
  const [company, assignments] = await Promise.all([
    apiRequest<Company>(`/companies/${encodeURIComponent(id)}`, { token }),
    canReadServices
      ? apiRequest<PaginatedResult<CompanyServiceAssignment>>(
          `/service-assignments?companyId=${encodeURIComponent(id)}&limit=50&offset=0`,
          { token },
        )
      : Promise.resolve(null),
  ]);

  const canManage = hasPermission(session, PERMISSIONS.COMPANIES_MANAGE);
  const canChangeStatus = canManage && session.user.accountScope === "PLATFORM";
  const canManageServices =
    session.user.accountScope === "PLATFORM" &&
    hasPermission(session, PERMISSIONS.SERVICES_MANAGE);
  const services = servicesDictionaries[locale];
  const serviceFeatures = serviceFeatureDictionaries[locale];
  const assignmentRows: AdminDataTableRow[] = (assignments?.items ?? []).map(
    (assignment): AdminDataTableRow => {
      const tone: AdminTableTone =
        assignment.status === "ACTIVE"
          ? "success"
          : assignment.status === "PROVISIONING"
            ? "warning"
            : assignment.status === "CANCELLED"
              ? "neutral"
              : "danger";

      return {
        id: assignment.id,
        searchText: assignment.displayName ?? assignment.service.name,
        cells: {
          service: {
            type: "text",
            value: assignment.displayName ?? assignment.service.name,
            emphasis: true,
          },
          status: {
            type: "badge",
            label: services.assignmentStatusLabels[assignment.status],
            tone,
          },
          startsAt: {
            type: "text",
            value: assignment.startsAt
              ? formatDate(assignment.startsAt, locale)
              : "—",
            muted: true,
          },
          expiresAt: {
            type: "text",
            value: assignment.expiresAt
              ? formatDate(assignment.expiresAt, locale)
              : "—",
            muted: true,
          },
          actions: {
            type: "link",
            label: services.view,
            href: `/admin/services/assignments/${assignment.id}`,
          },
        },
      };
    },
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={company.name}
        description={admin.companies.detailsTitle}
        actions={
          <Link
            href="/admin/companies"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {admin.companies.cancel}
          </Link>
        }
      />

      <Panel className="p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {admin.companies.status}
            </p>
            <div className="mt-3">
              <CompanyStatusBadge
                status={company.status}
                labels={admin.companies}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              {admin.companies.created}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-800">
              {formatDate(company.createdAt, locale)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              {admin.companies.updated}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-800">
              {formatDate(company.updatedAt, locale)}
            </p>
          </div>
        </div>
      </Panel>

      {assignments ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              {serviceFeatures.companyServices}
            </h2>
            {canManageServices && company.status === "ACTIVE" ? (
              <Link
                href={`/admin/services/assign?companyId=${encodeURIComponent(company.id)}`}
                className="inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand-hover"
              >
                {services.assignService}
              </Link>
            ) : null}
          </div>
          <AdminDataTable
            columns={[
              { key: "service", label: services.service },
              { key: "status", label: services.status },
              { key: "startsAt", label: services.startsAt },
              { key: "expiresAt", label: services.expiresAt },
              { key: "actions", label: services.actions },
            ]}
            rows={assignmentRows}
            labels={adminTableDictionaries[locale]}
            empty={
              <EmptyState
                title={services.emptyAssignmentsTitle}
                description={services.emptyAssignmentsDescription}
              />
            }
          />
        </section>
      ) : null}

      {canManage ? (
        <Panel className="p-6 sm:p-8">
          <h2 className="mb-6 text-base font-semibold text-slate-900">
            {admin.companies.editTitle}
          </h2>
          <CompanyForm
            action={updateCompanyAction.bind(null, company.id)}
            labels={admin.companies}
            content={content}
            initialName={company.name}
            initialTranslations={company.nameTranslations}
            cancelHref="/admin/companies"
          />
        </Panel>
      ) : null}

      {canChangeStatus ? (
        <Panel className="p-6 sm:p-8">
          <h2 className="mb-6 text-base font-semibold text-slate-900">
            {admin.companies.changeStatus}
          </h2>
          <CompanyStatusForm
            action={updateCompanyStatusAction.bind(null, company.id)}
            labels={admin.companies}
            currentStatus={company.status}
          />
        </Panel>
      ) : null}
    </div>
  );
}
import {
  AdminDataTable,
  type AdminDataTableRow,
  type AdminTableTone,
} from "@/components/admin/admin-data-table";
