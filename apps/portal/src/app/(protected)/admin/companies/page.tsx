import {
  PERMISSIONS,
  type Company,
  type CompanyStatus,
  type PaginatedResult,
} from "@odookrd/types";
import { EmptyState, PageHeading } from "@odookrd/ui";
import Link from "next/link";

import {
  AdminDataTable,
  type AdminDataTableRow,
  type AdminTableTone,
} from "@/components/admin/admin-data-table";
import { AdminLifecycleRowActions } from "@/components/admin/admin-lifecycle-row-actions";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getAdminDictionary } from "@/lib/i18n/admin/server";
import { adminLifecycleDictionaries } from "@/lib/i18n/companies/lifecycle";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";

import {
  archiveCompanyRowAction,
  batchCompanyStatusAction,
  deleteCompanyRowAction,
  restoreCompanyRowAction,
} from "./actions";

interface CompaniesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const statuses: CompanyStatus[] = ["ACTIVE", "SUSPENDED", "ARCHIVED"];
const pageSize = 20;

function selectedStatus(
  value: string | string[] | undefined,
): CompanyStatus | null {
  return typeof value === "string" && statuses.includes(value as CompanyStatus)
    ? (value as CompanyStatus)
    : null;
}

function selectedOffset(value: string | string[] | undefined): number {
  if (typeof value !== "string") {
    return 0;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? parsed
    : 0;
}

function companiesHref(status: CompanyStatus | null, offset: number): string {
  const parameters = new URLSearchParams();

  if (status) parameters.set("status", status);
  if (offset > 0) parameters.set("offset", String(offset));

  const query = parameters.toString();
  return query ? `/admin/companies?${query}` : "/admin/companies";
}

function statusTone(status: CompanyStatus): AdminTableTone {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  return "neutral";
}

export default async function CompaniesPage({
  searchParams,
}: CompaniesPageProps) {
  const [{ session, token }, { locale, admin }, parameters] = await Promise.all(
    [
      getAdminApiContext(PERMISSIONS.COMPANIES_READ),
      getAdminDictionary(),
      searchParams,
    ],
  );

  const status = selectedStatus(parameters.status);
  const offset = selectedOffset(parameters.offset);
  const query = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });

  if (status) query.set("status", status);

  const result = await apiRequest<PaginatedResult<Company>>(
    `/companies?${query.toString()}`,
    { token },
  );

  const isPlatform = session.user.accountScope === "PLATFORM";
  const canCreate =
    isPlatform && hasPermission(session, PERMISSIONS.COMPANIES_MANAGE);

  const lifecycle = adminLifecycleDictionaries[locale];

  const addCompany = canCreate ? (
    <Link
      href="/admin/companies/new"
      className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
    >
      {admin.companies.create}
    </Link>
  ) : undefined;

  const rows: AdminDataTableRow[] = result.items.map(
    (company): AdminDataTableRow => ({
      id: company.id,
      searchText: company.name,
      cells: {
        name: { type: "text", value: company.name, emphasis: true },
        status: {
          type: "badge",
          label:
            company.status === "ACTIVE"
              ? admin.companies.statusActive
              : company.status === "SUSPENDED"
                ? admin.companies.statusSuspended
                : admin.companies.statusArchived,
          tone: statusTone(company.status),
        },
        created: {
          type: "text",
          value: formatDate(company.createdAt, locale),
          muted: true,
        },
        actions: canCreate
          ? {
              type: "node",
              value: (
                <AdminLifecycleRowActions
                  id={company.id}
                  name={company.name}
                  status={company.status}
                  editHref={`/admin/companies/${company.id}`}
                  labels={lifecycle}
                  archiveAction={archiveCompanyRowAction}
                  restoreAction={restoreCompanyRowAction}
                  deleteAction={deleteCompanyRowAction}
                />
              ),
            }
          : {
              type: "link",
              label: admin.companies.view,
              href: `/admin/companies/${company.id}`,
            },
      },
    }),
  );

  const tableLabels = adminTableDictionaries[locale];

  const toolbar = isPlatform ? (
    <div className="flex flex-wrap gap-2">
      <Link
        href={companiesHref(null, 0)}
        className={`rounded-md border px-3 py-2 text-xs font-medium ${
          status === null
            ? "border-brand/30 bg-brand-soft text-brand"
            : "border-line bg-white text-muted hover:bg-slate-50"
        }`}
      >
        {admin.companies.allStatuses}
      </Link>

      {statuses.map((filter) => (
        <Link
          key={filter}
          href={companiesHref(filter, 0)}
          className={`rounded-md border px-3 py-2 text-xs font-medium ${
            status === filter
              ? "border-brand/30 bg-brand-soft text-brand"
              : "border-line bg-white text-muted hover:bg-slate-50"
          }`}
        >
          {filter === "ACTIVE"
            ? admin.companies.statusActive
            : filter === "SUSPENDED"
              ? admin.companies.statusSuspended
              : admin.companies.statusArchived}
        </Link>
      ))}
    </div>
  ) : undefined;

  const footer =
    result.pagination.total > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {result.pagination.total} {admin.companies.records}
        </p>

        <div className="flex items-center gap-2">
          {result.pagination.offset > 0 ? (
            <Link
              href={companiesHref(
                status,
                Math.max(0, result.pagination.offset - result.pagination.limit),
              )}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-content hover:bg-slate-50"
            >
              {admin.companies.previous}
            </Link>
          ) : null}

          {result.pagination.offset + result.items.length <
          result.pagination.total ? (
            <Link
              href={companiesHref(
                status,
                result.pagination.offset + result.pagination.limit,
              )}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-content hover:bg-slate-50"
            >
              {admin.companies.next}
            </Link>
          ) : null}
        </div>
      </div>
    ) : undefined;

  return (
    <div className="grid gap-7">
      <PageHeading
        title={isPlatform ? admin.companies.title : admin.navigation.myCompany}
        description={
          isPlatform
            ? admin.companies.description
            : admin.companies.ownDescription
        }
        actions={addCompany}
      />

      <AdminDataTable
        columns={[
          { key: "name", label: admin.companies.name },
          { key: "status", label: admin.companies.status },
          { key: "created", label: admin.companies.created },
          { key: "actions", label: admin.companies.actions },
        ]}
        rows={rows}
        labels={tableLabels}
        selectable={canCreate}
        batchAction={canCreate ? batchCompanyStatusAction : undefined}
        batchActions={
          canCreate
            ? [
                { value: "ACTIVE", label: admin.companies.statusActive },
                {
                  value: "SUSPENDED",
                  label: admin.companies.statusSuspended,
                  tone: "danger",
                },
                {
                  value: "ARCHIVED",
                  label: admin.companies.statusArchived,
                  tone: "danger",
                },
                {
                  value: "DELETE",
                  label: lifecycle.delete,
                  tone: "danger",
                },
              ]
            : []
        }
        toolbar={toolbar}
        footer={footer}
        empty={
          <EmptyState
            title={admin.companies.emptyTitle}
            description={admin.companies.emptyDescription}
            action={addCompany}
          />
        }
      />
    </div>
  );
}
