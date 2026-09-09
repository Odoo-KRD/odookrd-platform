import { PERMISSIONS, type PermissionDefinition } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { RoleEditorForm } from "@/components/roles/role-editor-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin/server";
import { roleAdministrationDictionaries } from "@/lib/i18n/users/roles";

import { createRoleAction } from "../actions";

export default async function NewRolePage() {
  const [{ session, token }, { locale }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.ROLES_MANAGE),
    getAdminDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    return null;
  }

  const permissions = await apiRequest<PermissionDefinition[]>(
    "/roles/permissions",
    { token },
  );
  const labels = roleAdministrationDictionaries[locale];

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.createTitle}
        description={labels.createDescription}
        actions={
          <Link
            href="/admin/roles"
            className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-slate-50"
          >
            {labels.back}
          </Link>
        }
      />

      <Panel className="p-5 sm:p-7">
        <RoleEditorForm
          action={createRoleAction}
          mode="create"
          permissions={permissions}
          labels={labels}
        />
      </Panel>
    </div>
  );
}
