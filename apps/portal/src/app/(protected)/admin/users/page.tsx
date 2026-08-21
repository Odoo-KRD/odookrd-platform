import {
  PERMISSIONS,
  type Company,
  type ManagedUser,
  type PaginatedResult,
  type UserStatus,
} from "@odookrd/types";
import { Badge, DataTable, EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { CompanyFilter } from "@/components/users/company-filter";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getUsersDictionary } from "@/lib/i18n/users-server";

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const statuses: UserStatus[] = ["INVITED", "ACTIVE", "SUSPENDED"];
const pageSize = 20;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function selectedStatus(value: string | string[] | undefined): UserStatus | null {
  return typeof value === "string" && statuses.includes(value as UserStatus)
    ? (value as UserStatus)
    : null;
}

function selectedCompany(value: string | string[] | undefined): string | null {
  return typeof value === "string" && uuidPattern.test(value) ? value : null;
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

function usersHref(
  status: UserStatus | null,
  companyId: string | null,
  offset: number,
): string {
  const parameters = new URLSearchParams();

  if (status) {
    parameters.set("status", status);
  }

  if (companyId) {
    parameters.set("companyId", companyId);
  }

  if (offset > 0) {
    parameters.set("offset", String(offset));
  }

  const query = parameters.toString();

  return query ? `/admin/users?${query}` : "/admin/users";
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const [{ session, token }, { locale, users }, parameters] = await Promise.all([
    getAdminApiContext(PERMISSIONS.USERS_READ),
    getUsersDictionary(),
    searchParams,
  ]);

  const isPlatform = session.user.accountScope === "PLATFORM";
  const status = selectedStatus(parameters.status);
  const companyId = isPlatform ? selectedCompany(parameters.companyId) : null;
  const offset = selectedOffset(parameters.offset);
  const query = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });

  if (status) {
    query.set("status", status);
  }

  if (companyId) {
    query.set("companyId", companyId);
  }

  const shouldLoadCompanies =
    isPlatform && hasPermission(session, PERMISSIONS.COMPANIES_READ);

  const [result, companiesResult] = await Promise.all([
    apiRequest<PaginatedResult<ManagedUser>>(`/users?${query.toString()}`, {
      token,
    }),
    shouldLoadCompanies
      ? apiRequest<PaginatedResult<Company>>("/companies?limit=100&offset=0", {
          token,
        })
      : Promise.resolve(null),
  ]);

  const companies = companiesResult?.items ?? [];
  const companyNames = new Map(companies.map((company) => [company.id, company.name]));
  const canInvite = hasPermission(session, PERMISSIONS.USERS_MANAGE);

  const inviteUser = canInvite ? (
    <Link
      href="/admin/users/invite"
      className="inline-flex h-10 items-center rounded-md bg-[#714b67] px-4 text-sm font-medium text-white hover:bg-[#62405a]"
    >
      {users.invite}
    </Link>
  ) : undefined;

  return (
    <div className="grid gap-7">
      <PageHeading
        title={users.title}
        description={isPlatform ? users.description : users.ownDescription}
        actions={inviteUser}
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href={usersHref(null, companyId, 0)}
            className={`rounded-md border px-3 py-2 text-xs font-medium ${
              status === null
                ? "border-[#714b67]/30 bg-[#714b67]/8 text-[#714b67]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {users.allStatuses}
          </Link>

          {statuses.map((filter) => (
            <Link
              key={filter}
              href={usersHref(filter, companyId, 0)}
              className={`rounded-md border px-3 py-2 text-xs font-medium ${
                status === filter
                  ? "border-[#714b67]/30 bg-[#714b67]/8 text-[#714b67]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {filter === "INVITED"
                ? users.statusInvited
                : filter === "ACTIVE"
                  ? users.statusActive
                  : users.statusSuspended}
            </Link>
          ))}
        </div>

        {isPlatform && companies.length > 0 ? (
          <CompanyFilter
            companies={companies}
            value={companyId}
            allCompanies={users.allCompanies}
            label={users.company}
          />
        ) : null}
      </div>

      <Panel>
        {result.items.length === 0 ? (
          <EmptyState
            title={users.emptyTitle}
            description={users.emptyDescription}
            action={inviteUser}
          />
        ) : (
          <DataTable
            headings={[
              users.email,
              users.status,
              ...(isPlatform ? [users.company] : []),
              users.roles,
              users.created,
              users.actions,
            ]}
          >
            {result.items.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/70">
                <td
                  dir="ltr"
                  className="border-b border-slate-100 px-5 py-4 font-medium text-slate-900"
                >
                  {user.email}
                </td>
                <td className="border-b border-slate-100 px-5 py-4">
                  <UserStatusBadge status={user.status} labels={users} />
                </td>

                {isPlatform ? (
                  <td className="border-b border-slate-100 px-5 py-4 text-slate-600">
                    {user.accountScope === "PLATFORM"
                      ? users.platform
                      : companyNames.get(user.companyId ?? "") ?? "—"}
                  </td>
                ) : null}

                <td className="border-b border-slate-100 px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.map((role) => (
                      <Badge key={role} dir="ltr">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="border-b border-slate-100 px-5 py-4 text-slate-600">
                  {formatDate(user.createdAt, locale)}
                </td>
                <td className="border-b border-slate-100 px-5 py-4">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-sm font-medium text-[#714b67] hover:text-[#62405a]"
                  >
                    {users.view}
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {result.pagination.total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
            <p className="text-xs text-slate-500">
              {result.pagination.total} {users.records}
            </p>

            <div className="flex items-center gap-2">
              {result.pagination.offset > 0 ? (
                <Link
                  href={usersHref(
                    status,
                    companyId,
                    Math.max(0, result.pagination.offset - result.pagination.limit),
                  )}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {users.previous}
                </Link>
              ) : null}

              {result.pagination.offset + result.items.length <
              result.pagination.total ? (
                <Link
                  href={usersHref(
                    status,
                    companyId,
                    result.pagination.offset + result.pagination.limit,
                  )}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {users.next}
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
