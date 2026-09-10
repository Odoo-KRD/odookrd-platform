import { PERMISSIONS, type Role } from "@odookrd/types";
import { EmptyState, PageHeading } from "@odookrd/ui";
import Link from "next/link";

import {
  AdminDataTable,
  type AdminDataTableRow,
} from "@/components/admin/admin-data-table";
import { AdminLifecycleRowActions } from "@/components/admin/admin-lifecycle-row-actions";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import type { RoleCatalogDictionary } from "@/lib/i18n/types";
import { getAdminDictionary } from "@/lib/i18n/admin/server";
import { adminLifecycleDictionaries } from "@/lib/i18n/companies/lifecycle";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { roleAdministrationDictionaries } from "@/lib/i18n/users/roles";

import {
  archiveRoleRowAction,
  deleteRoleRowAction,
  restoreRoleRowAction,
} from "./actions";

function translatedRole(role: Role, dictionary: RoleCatalogDictionary): string {
  if (role.key === "platform_admin") return dictionary.platformAdmin;
  if (role.key === "company_admin") return dictionary.companyAdmin;
  if (role.key === "company_user") return dictionary.companyUser;
  return role.name;
}

export default async function RolesPage() {
  const [{ session, token }, { locale, companies, roleCatalog }] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.ROLES_READ),
      getAdminDictionary(),
    ]);

  const roles = await apiRequest<Role[]>("/roles", { token });
  const labels = roleAdministrationDictionaries[locale];
  const tableLabels = adminTableDictionaries[locale];
  const lifecycle = adminLifecycleDictionaries[locale];
  const canManage =
    session.user.accountScope === "PLATFORM" &&
    hasPermission(session, PERMISSIONS.ROLES_MANAGE);

  const createAction = canManage ? (
    <Link
      href="/admin/roles/new"
      className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
    >
      {labels.create}
    </Link>
  ) : undefined;

  const rows: AdminDataTableRow[] = roles.map((role): AdminDataTableRow => ({
    id: role.id,
    searchText: `${translatedRole(role, roleCatalog)} ${role.key} ${role.scope} ${
      role.isSystem ? labels.system : labels.custom
    } ${role.permissions.join(" ")}`,
    cells: {
      name: {
        type: "link",
        label: translatedRole(role, roleCatalog),
        href: `/admin/roles/${role.id}`,
      },
      key: { type: "text", value: role.key, dir: "ltr", muted: true },
      scope: {
        type: "badge",
        label: role.scope === "PLATFORM" ? labels.platform : labels.company,
        tone: role.scope === "PLATFORM" ? "accent" : "neutral",
      },
      type: {
        type: "badge",
        label: role.isSystem ? labels.system : labels.custom,
        tone: role.isSystem ? "neutral" : "success",
      },
      status: {
        type: "badge",
        label: role.archivedAt ? labels.archived : labels.active,
        tone: role.archivedAt ? "neutral" : "success",
      },
      permissions: {
        type: "text",
        value: String(role.permissions.length),
      },
      assigned: {
        type: "text",
        value: String(role.assignmentCount),
      },
      actions:
        canManage && !role.isSystem
          ? {
              type: "node",
              value: (
                <AdminLifecycleRowActions
                  id={role.id}
                  name={translatedRole(role, roleCatalog)}
                  status={role.archivedAt ? "ARCHIVED" : "ACTIVE"}
                  editHref={`/admin/roles/${role.id}`}
                  labels={lifecycle}
                  archiveAction={archiveRoleRowAction}
                  restoreAction={restoreRoleRowAction}
                  deleteAction={deleteRoleRowAction}
                />
              ),
            }
          : {
              type: "actions",
              items: [
                {
                  key: "view",
                  label: labels.view,
                  href: `/admin/roles/${role.id}`,
                },
              ],
            },
    },
  }));

  return (
    <div className="grid gap-7">
      <PageHeading
        title={roleCatalog.title}
        description={roleCatalog.description}
        actions={createAction}
      />

      <AdminDataTable
        locale={locale}
        columns={[
          { key: "name", label: labels.name },
          { key: "key", label: labels.key },
          { key: "scope", label: labels.scope },
          { key: "type", label: labels.type },
          { key: "status", label: labels.status },
          { key: "permissions", label: labels.permissions },
          { key: "assigned", label: labels.assignedUsers },
          { key: "actions", label: companies.actions },
        ]}
        rows={rows}
        labels={tableLabels}
        empty={
          <EmptyState
            title={roleCatalog.emptyTitle}
            description={roleCatalog.emptyDescription}
            action={createAction}
          />
        }
        minWidthClassName="min-w-[980px]"
      />
    </div>
  );
}
