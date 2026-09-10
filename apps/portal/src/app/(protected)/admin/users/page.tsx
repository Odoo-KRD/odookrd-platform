import {
  PERMISSIONS,
  type Company,
  type ManagedUser,
  type PaginatedResult,
  type UserStatus,
} from "@odookrd/types";
import { EmptyState, PageHeading } from "@odookrd/ui";
import Link from "next/link";

import {
  AdminDataTable,
  type AdminDataTableRow,
  type AdminTableTone,
} from "@/components/admin/admin-data-table";
import { AdminLifecycleRowActions } from "@/components/admin/admin-lifecycle-row-actions";
import { CompanyFilter } from "@/components/users/company-filter";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { adminLifecycleDictionaries } from "@/lib/i18n/companies/lifecycle";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { getUsersDictionary } from "@/lib/i18n/users/server";

import {
  archiveUserRowAction,
  batchUserStatusAction,
  deleteUserRowAction,
  restoreUserRowAction,
} from "./actions";
import { plural } from "@/lib/i18n/plural";
import { recordsPhrase } from "@/lib/i18n/shared/plurals";

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const statuses: UserStatus[] = ["INVITED", "ACTIVE", "SUSPENDED", "ARCHIVED"];
const pageSize = 20;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function selectedStatus(
  value: string | string[] | undefined,
): UserStatus | null {
  return typeof value === "string" && statuses.includes(value as UserStatus)
    ? (value as UserStatus)
    : null;
}

function selectedCompany(value: string | string[] | undefined): string | null {
  return typeof value === "string" && uuidPattern.test(value) ? value : null;
}

function selectedOffset(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 0;

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

  if (status) parameters.set("status", status);
  if (companyId) parameters.set("companyId", companyId);
  if (offset > 0) parameters.set("offset", String(offset));

  const query = parameters.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

function statusTone(status: UserStatus): AdminTableTone {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "danger";
  if (status === "ARCHIVED") return "neutral";
  return "accent";
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const [{ session, token }, { locale, users }, parameters] = await Promise.all(
    [
      getAdminApiContext(PERMISSIONS.USERS_READ),
      getUsersDictionary(),
      searchParams,
    ],
  );

  const isPlatform = session.user.accountScope === "PLATFORM";
  const status = selectedStatus(parameters.status);
  const companyId = isPlatform ? selectedCompany(parameters.companyId) : null;
  const offset = selectedOffset(parameters.offset);
  const query = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });

  if (status) query.set("status", status);
  if (companyId) query.set("companyId", companyId);

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
  const companyNames = new Map(
    companies.map((company) => [company.id, company.name]),
  );
  const canInvite = hasPermission(session, PERMISSIONS.USERS_MANAGE);

  const inviteUser = canInvite ? (
    <Link
      href="/admin/users/invite"
      className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
    >
      {users.invite}
    </Link>
  ) : undefined;

  const tableLabels = adminTableDictionaries[locale];
  const lifecycle = adminLifecycleDictionaries[locale];

  const rows: AdminDataTableRow[] = result.items.map(
    (user): AdminDataTableRow => {
      const companyLabel =
        user.accountScope === "PLATFORM"
          ? users.platform
          : (companyNames.get(user.companyId ?? "") ?? "—");

      return {
        id: user.id,
        searchText: `${user.email} ${companyLabel} ${user.roles.join(" ")}`,
        cells: {
          email: {
            type: "text",
            value: user.email,
            dir: "ltr",
            emphasis: true,
            className: "break-all",
          },
          status: {
            type: "badge",
            label:
              user.status === "INVITED"
                ? users.statusInvited
                : user.status === "ACTIVE"
                  ? users.statusActive
                  : user.status === "SUSPENDED"
                    ? users.statusSuspended
                    : users.statusArchived,
            tone: statusTone(user.status),
          },
          ...(isPlatform
            ? {
                company: {
                  type: "text" as const,
                  value: companyLabel,
                  muted: true,
                },
              }
            : {}),
          roles: {
            type: "badges",
            items: user.roles.map((role) => ({
              key: role,
              label: role,
              dir: "ltr" as const,
            })),
          },
          created: {
            type: "text",
            value: formatDate(user.createdAt, locale),
            muted: true,
          },
          actions: canInvite
            ? {
                type: "node",
                value: (
                  <AdminLifecycleRowActions
                    id={user.id}
                    name={user.email}
                    status={user.status}
                    editHref={`/admin/users/${user.id}`}
                    labels={lifecycle}
                    archiveAction={archiveUserRowAction}
                    restoreAction={restoreUserRowAction}
                    deleteAction={deleteUserRowAction}
                  />
                ),
              }
            : {
                type: "link",
                label: users.view,
                href: `/admin/users/${user.id}`,
              },
        },
      };
    },
  );

  const toolbar = (
    <>
      <div className="flex flex-wrap gap-2">
        <Link
          href={usersHref(null, companyId, 0)}
          className={`inline-flex h-9 items-center rounded-md border px-3 text-xs font-medium ${
            status === null
              ? "border-brand/30 bg-brand-soft text-brand"
              : "border-line bg-white text-muted hover:bg-slate-50"
          }`}
        >
          {users.allStatuses}
        </Link>

        {statuses.map((filter) => (
          <Link
            key={filter}
            href={usersHref(filter, companyId, 0)}
            className={`inline-flex h-9 items-center rounded-md border px-3 text-xs font-medium ${
              status === filter
                ? "border-brand/30 bg-brand-soft text-brand"
                : "border-line bg-white text-muted hover:bg-slate-50"
            }`}
          >
            {filter === "INVITED"
              ? users.statusInvited
              : filter === "ACTIVE"
                ? users.statusActive
                : filter === "SUSPENDED"
                  ? users.statusSuspended
                  : users.statusArchived}
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
    </>
  );

  const footer =
    result.pagination.total > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {plural(recordsPhrase, locale, result.pagination.total)}
        </p>

        <div className="flex items-center gap-2">
          {result.pagination.offset > 0 ? (
            <Link
              href={usersHref(
                status,
                companyId,
                Math.max(0, result.pagination.offset - result.pagination.limit),
              )}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-content hover:bg-slate-50"
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
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-content hover:bg-slate-50"
            >
              {users.next}
            </Link>
          ) : null}
        </div>
      </div>
    ) : undefined;

  return (
    <div className="grid gap-7">
      <PageHeading
        title={users.title}
        description={isPlatform ? users.description : users.ownDescription}
        actions={inviteUser}
      />

      <AdminDataTable
        locale={locale}
        columns={[
          { key: "email", label: users.email },
          { key: "status", label: users.status },
          ...(isPlatform ? [{ key: "company", label: users.company }] : []),
          { key: "roles", label: users.roles },
          { key: "created", label: users.created },
          { key: "actions", label: users.actions },
        ]}
        rows={rows}
        labels={tableLabels}
        selectable={canInvite}
        batchAction={canInvite ? batchUserStatusAction : undefined}
        batchActions={
          canInvite
            ? [
                { value: "ACTIVE", label: users.statusActive },
                {
                  value: "SUSPENDED",
                  label: users.statusSuspended,
                  tone: "danger",
                },
                {
                  value: "ARCHIVED",
                  label: users.statusArchived,
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
            title={users.emptyTitle}
            description={users.emptyDescription}
            action={inviteUser}
          />
        }
        minWidthClassName="min-w-[980px]"
      />
    </div>
  );
}
