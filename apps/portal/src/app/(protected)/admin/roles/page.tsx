import { PERMISSIONS, type Role } from "@odookrd/types";
import { Badge, EmptyState, PageHeading, Panel } from "@odookrd/ui";

import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { AdminDictionary } from "@/lib/i18n/admin";
import { getAdminDictionary } from "@/lib/i18n/admin-server";

function translatedRole(role: Role, dictionary: AdminDictionary): string {
  if (role.key === "platform_admin") {
    return dictionary.roles.platformAdmin;
  }

  if (role.key === "company_admin") {
    return dictionary.roles.companyAdmin;
  }

  if (role.key === "company_user") {
    return dictionary.roles.companyUser;
  }

  return role.name;
}

export default async function RolesPage() {
  const [{ token }, { admin }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.ROLES_READ),
    getAdminDictionary(),
  ]);

  const roles = await apiRequest<Role[]>("/roles", { token });

  return (
    <div className="grid gap-7">
      <PageHeading title={admin.roles.title} description={admin.roles.description} />

      <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        {admin.roles.readOnly}
      </div>

      {roles.length === 0 ? (
        <Panel>
          <EmptyState
            title={admin.roles.emptyTitle}
            description={admin.roles.emptyDescription}
          />
        </Panel>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => (
            <Panel key={role.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900">
                    {translatedRole(role, admin)}
                  </h2>
                  <p dir="ltr" className="mt-1 w-fit text-xs text-slate-500">
                    {role.key}
                  </p>
                </div>

                <Badge tone={role.scope === "PLATFORM" ? "accent" : "neutral"}>
                  {role.scope === "PLATFORM"
                    ? admin.roles.platform
                    : admin.roles.company}
                </Badge>
              </div>

              {role.description ? (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {role.description}
                </p>
              ) : null}

              <div className="mt-5 border-t border-slate-200 pt-5">
                <p className="text-xs font-medium text-slate-500">
                  {admin.roles.permissions}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {role.permissions.length > 0 ? (
                    role.permissions.map((permission) => (
                      <Badge key={permission} dir="ltr">
                        {permission}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      {admin.roles.noPermissions}
                    </span>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
