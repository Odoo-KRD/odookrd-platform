import {
  PERMISSIONS,
  type PermissionDefinition,
  type Role,
} from "@odookrd/types";
import { Badge, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { DeleteRoleForm } from "@/components/roles/delete-role-form";
import { RoleEditorForm } from "@/components/roles/role-editor-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin-server";
import { roleAdministrationDictionaries } from "@/lib/i18n/role-administration";

import { deleteRoleAction, updateRoleAction } from "../actions";

interface RoleDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoleDetailsPage({
  params,
}: RoleDetailsPageProps) {
  const [{ session, token }, { locale }, { id }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.ROLES_READ),
    getAdminDictionary(),
    params,
  ]);

  const role = await apiRequest<Role>(`/roles/${encodeURIComponent(id)}`, {
    token,
  });
  const labels = roleAdministrationDictionaries[locale];
  const canManage =
    session.user.accountScope === "PLATFORM" &&
    hasPermission(session, PERMISSIONS.ROLES_MANAGE);

  const permissions =
    canManage && !role.isSystem
      ? await apiRequest<PermissionDefinition[]>("/roles/permissions", {
          token,
        })
      : [];

  return (
    <div className="grid gap-7">
      <PageHeading
        title={role.name}
        description={role.description ?? labels.details}
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
        <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="text-xs font-medium text-muted">{labels.key}</dt>
            <dd dir="ltr" className="mt-2 text-sm font-semibold text-content">
              {role.key}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">{labels.scope}</dt>
            <dd className="mt-2">
              <Badge tone={role.scope === "PLATFORM" ? "accent" : "neutral"}>
                {role.scope === "PLATFORM" ? labels.platform : labels.company}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">{labels.type}</dt>
            <dd className="mt-2">
              <Badge tone={role.isSystem ? "neutral" : "success"}>
                {role.isSystem ? labels.system : labels.custom}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">
              {labels.assignedUsers}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-content">
              {role.assignmentCount}
            </dd>
          </div>
        </dl>

        {role.isSystem ? (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {labels.systemProtected}
          </div>
        ) : null}

        <div className="mt-6 border-t border-line pt-6">
          <p className="text-xs font-medium text-muted">{labels.permissions}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {role.permissions.map((permission) => (
              <Badge key={permission} dir="ltr">
                {permission}
              </Badge>
            ))}
          </div>
        </div>
      </Panel>

      {canManage && !role.isSystem ? (
        <>
          <Panel className="p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-content">
                {labels.editTitle}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {labels.editDescription}
              </p>
            </div>

            <RoleEditorForm
              action={updateRoleAction.bind(null, role.id)}
              mode="edit"
              role={role}
              permissions={permissions}
              labels={labels}
            />
          </Panel>

          <Panel className="border-red-200 p-5 sm:p-7">
            <DeleteRoleForm
              action={deleteRoleAction.bind(null, role.id)}
              labels={labels}
            />
          </Panel>
        </>
      ) : null}
    </div>
  );
}
