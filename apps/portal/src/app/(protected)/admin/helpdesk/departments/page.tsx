import { PERMISSIONS } from "@odookrd/types";
import { EmptyState, PageHeading } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AdminDataTable,
  type AdminDataTableRow,
} from "@/components/admin/admin-data-table";
import { AdminLifecycleRowActions } from "@/components/admin/admin-lifecycle-row-actions";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { adminLifecycleDictionaries } from "@/lib/i18n/companies/lifecycle";
import { helpdeskAdminDictionaries } from "@/lib/i18n/helpdesk-admin";
import { getLocale } from "@/lib/i18n/server";

import {
  archiveDepartmentRowAction,
  deleteDepartmentRowAction,
  restoreDepartmentRowAction,
} from "./actions";
import type { AdminDepartment } from "./types";

export default async function HelpdeskDepartmentsPage() {
  const [{ session, token }, locale] = await Promise.all([
    getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE),
    getLocale(),
  ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const labels = helpdeskAdminDictionaries[locale];
  const lifecycle = adminLifecycleDictionaries[locale];
  const departments = await apiRequest<AdminDepartment[]>(
    "/helpdesk/admin/departments",
    { token },
  );

  const rows: AdminDataTableRow[] = departments.map((department) => ({
    id: department.id,
    searchText: `${department.name} ${department.slug}`,
    cells: {
      name: {
        type: "node",
        value: (
          <div className="min-w-0 max-w-md">
            <Link
              href={`/admin/helpdesk/departments/${department.id}`}
              className="text-[15px] font-semibold text-content hover:text-brand"
            >
              {department.name}
            </Link>
            {department.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {department.description}
              </p>
            ) : null}
          </div>
        ),
      },
      slug: { type: "text", value: department.slug, dir: "ltr", muted: true },
      status: {
        type: "badge",
        label: department.status === "ACTIVE" ? labels.active : labels.archived,
        tone: department.status === "ACTIVE" ? "success" : "neutral",
      },
      sortOrder: { type: "text", value: String(department.sortOrder) },
      tickets: { type: "text", value: String(department._count.tickets) },
      actions: {
        type: "node",
        value: (
          <AdminLifecycleRowActions
            id={department.id}
            name={department.name}
            status={department.status}
            editHref={`/admin/helpdesk/departments/${department.id}`}
            labels={lifecycle}
            archiveAction={archiveDepartmentRowAction}
            restoreAction={restoreDepartmentRowAction}
            deleteAction={deleteDepartmentRowAction}
          />
        ),
      },
    },
  }));

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.departmentsTitle}
        description={labels.departmentsDescription}
        actions={
          <Link
            href="/admin/helpdesk/departments/new"
            className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            {labels.addDepartment}
          </Link>
        }
      />

      <AdminDataTable
        locale={locale}
        columns={[
          { key: "name", label: labels.departmentName },
          { key: "slug", label: labels.slug },
          { key: "status", label: labels.status },
          { key: "sortOrder", label: labels.sortOrder },
          { key: "tickets", label: labels.tickets },
          { key: "actions", label: labels.columnActions },
        ]}
        rows={rows}
        labels={adminTableDictionaries[locale]}
        empty={
          <EmptyState
            title={labels.departmentsEmptyTitle}
            description={labels.departmentsEmptyDescription}
          />
        }
      />
    </div>
  );
}
