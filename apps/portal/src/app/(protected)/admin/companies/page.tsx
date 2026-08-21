import {
  PERMISSIONS,
  type Company,
  type CompanyStatus,
  type PaginatedResult,
} from "@odookrd/types";
import { DataTable, EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { CompanyStatusBadge } from "@/components/companies/company-status-badge";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getAdminDictionary } from "@/lib/i18n/admin-server";

interface CompaniesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const statuses: CompanyStatus[] = ["ACTIVE", "SUSPENDED", "ARCHIVED"];
const pageSize = 20;

function selectedStatus(value: string | string[] | undefined): CompanyStatus | null {
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

  if (status) {
    parameters.set("status", status);
  }

  if (offset > 0) {
    parameters.set("offset", String(offset));
  }

  const query = parameters.toString();

  return query ? `/admin/companies?${query}` : "/admin/companies";
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const [{ session, token }, { locale, admin }, parameters] = await Promise.all([
    getAdminApiContext(PERMISSIONS.COMPANIES_READ),
    getAdminDictionary(),
    searchParams,
  ]);

  const status = selectedStatus(parameters.status);
  const offset = selectedOffset(parameters.offset);
  const query = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });

  if (status) {
    query.set("status", status);
  }

  const result = await apiRequest<PaginatedResult<Company>>(
    `/companies?${query.toString()}`,
    { token },
  );

  const isPlatform = session.user.accountScope === "PLATFORM";
  const canCreate =
    isPlatform && hasPermission(session, PERMISSIONS.COMPANIES_MANAGE);

  const addCompany = canCreate ? (
    <Link
      href="/admin/companies/new"
      className="inline-flex h-10 items-center rounded-md bg-[#714b67] px-4 text-sm font-medium text-white hover:bg-[#62405a]"
    >
      {admin.companies.create}
    </Link>
  ) : undefined;

  return (
    <div className="grid gap-7">
      <PageHeading
        title={isPlatform ? admin.companies.title : admin.navigation.myCompany}
        description={
          isPlatform ? admin.companies.description : admin.companies.ownDescription
        }
        actions={addCompany}
      />

      {isPlatform ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href={companiesHref(null, 0)}
            className={`rounded-md border px-3 py-2 text-xs font-medium ${
              status === null
                ? "border-[#714b67]/30 bg-[#714b67]/8 text-[#714b67]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
                  ? "border-[#714b67]/30 bg-[#714b67]/8 text-[#714b67]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
      ) : null}

      <Panel>
        {result.items.length === 0 ? (
          <EmptyState
            title={admin.companies.emptyTitle}
            description={admin.companies.emptyDescription}
            action={addCompany}
          />
        ) : (
          <DataTable
            headings={[
              admin.companies.name,
              admin.companies.status,
              admin.companies.created,
              admin.companies.actions,
            ]}
          >
            {result.items.map((company) => (
              <tr key={company.id} className="hover:bg-slate-50/70">
                <td className="border-b border-slate-100 px-5 py-4 font-medium text-slate-900">
                  {company.name}
                </td>
                <td className="border-b border-slate-100 px-5 py-4">
                  <CompanyStatusBadge
                    status={company.status}
                    labels={admin.companies}
                  />
                </td>
                <td className="border-b border-slate-100 px-5 py-4 text-slate-600">
                  {formatDate(company.createdAt, locale)}
                </td>
                <td className="border-b border-slate-100 px-5 py-4">
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="text-sm font-medium text-[#714b67] hover:text-[#62405a]"
                  >
                    {admin.companies.view}
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {result.pagination.total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
            <p className="text-xs text-slate-500">
              {result.pagination.total} {admin.companies.records}
            </p>

            <div className="flex items-center gap-2">
              {result.pagination.offset > 0 ? (
                <Link
                  href={companiesHref(
                    status,
                    Math.max(0, result.pagination.offset - result.pagination.limit),
                  )}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {admin.companies.next}
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
