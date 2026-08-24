import { PERMISSIONS, type Role } from "@odookrd/types";
import { EmptyState, PageHeading } from "@odookrd/ui";

import {
  AdminDataTable,
  type AdminDataTableRow,
} from "@/components/admin/admin-data-table";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { AdminDictionary } from "@/lib/i18n/admin";
import { getAdminDictionary } from "@/lib/i18n/admin-server";
import { adminTableDictionaries } from "@/lib/i18n/admin-table";

function translatedRole(role: Role, dictionary: AdminDictionary): string {
  if (role.key === "platform_admin") return dictionary.roles.platformAdmin;
  if (role.key === "company_admin") return dictionary.roles.companyAdmin;
  if (role.key === "company_user") return dictionary.roles.companyUser;
  return role.name;
}

export default async function RolesPage() {
  const [{ token }, { locale, admin }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.ROLES_READ),
    getAdminDictionary(),
  ]);

  const roles = await apiRequest<Role[]>("/roles", { token });
  const tableLabels = adminTableDictionaries[locale];

  const rows: AdminDataTableRow[] = roles.map((role): AdminDataTableRow => ({
    id: role.id,
    searchText: `${translatedRole(role, admin)} ${role.key} ${role.scope} ${role.permissions.join(" ")}`,
    cells: {
      name: {
        type: "text",
        value: translatedRole(role, admin),
        emphasis: true,
      },
      key: { type: "text", value: role.key, dir: "ltr", muted: true },
      scope: {
        type: "badge",
        label:
          role.scope === "PLATFORM"
            ? admin.roles.platform
            : admin.roles.company,
        tone: role.scope === "PLATFORM" ? "accent" : "neutral",
      },
      permissions: {
        type: "badges",
        items: role.permissions.map((permission) => ({
          key: permission,
          label: permission,
          dir: "ltr" as const,
        })),
      },
    },
  }));

  return (
    <div className="grid gap-7">
      <PageHeading
        title={admin.roles.title}
        description={admin.roles.description}
      />

      <div className="rounded-md border border-line bg-surface-panel px-4 py-3 text-sm text-muted">
        {admin.roles.readOnly}
      </div>

      <AdminDataTable
        columns={[
          { key: "name", label: admin.roles.name },
          { key: "key", label: "Key" },
          { key: "scope", label: admin.roles.scope },
          { key: "permissions", label: admin.roles.permissions },
        ]}
        rows={rows}
        labels={tableLabels}
        selectable
        empty={
          <EmptyState
            title={admin.roles.emptyTitle}
            description={admin.roles.emptyDescription}
          />
        }
        minWidthClassName="min-w-[860px]"
      />
    </div>
  );
}
