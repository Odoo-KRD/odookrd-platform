import {
  PERMISSIONS,
  type Company,
  type ManagedUser,
  type Role,
  type UserAdministrationDetails,
} from "@odookrd/types";
import { Badge, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { InvitationAdministrationPanel } from "@/components/users/invitation-administration-panel";
import { UserRolesForm } from "@/components/users/user-roles-form";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { UserStatusForm } from "@/components/users/user-status-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { roleAdministrationDictionaries } from "@/lib/i18n/users/roles";
import { getUsersDictionary } from "@/lib/i18n/users/server";
import { userInvitationAdminDictionaries } from "@/lib/i18n/users/invitations";

import { updateUserRolesAction, updateUserStatusAction } from "../actions";
import {
  regenerateInvitationAction,
  resendInvitationAction,
} from "../invitation-actions";

interface UserDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailsPage({
  params,
}: UserDetailsPageProps) {
  const [{ session, token }, { locale, admin, users }, { id }] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.USERS_READ),
      getUsersDictionary(),
      params,
    ]);

  const user = await apiRequest<ManagedUser>(
    `/users/${encodeURIComponent(id)}`,
    { token },
  );

  const canManage = hasPermission(session, PERMISSIONS.USERS_MANAGE);
  const canReadRoles = hasPermission(session, PERMISSIONS.ROLES_READ);
  const canReadCompanies = hasPermission(session, PERMISSIONS.COMPANIES_READ);

  const [roles, company, administration] = await Promise.all([
    canManage && canReadRoles
      ? apiRequest<Role[]>("/roles", { token })
      : Promise.resolve([]),
    user.companyId && canReadCompanies
      ? apiRequest<Company>(
          `/companies/${encodeURIComponent(user.companyId)}`,
          { token },
        )
      : Promise.resolve(null),
    canManage
      ? apiRequest<UserAdministrationDetails>(
          `/users/${encodeURIComponent(user.id)}/administration`,
          { token },
        )
      : Promise.resolve(null),
  ]);

  const allowedRoles = roles.filter((role) => role.scope === user.accountScope);
  const invitationLabels = userInvitationAdminDictionaries[locale];
  const roleAdministrationLabels = roleAdministrationDictionaries[locale];
  const roleLabels: Record<string, string> = {
    platform_admin: admin.roles.platformAdmin,
    company_admin: admin.roles.companyAdmin,
    company_user: admin.roles.companyUser,
  };

  return (
    <div className="grid gap-7">
      <PageHeading
        title={user.email}
        description={users.detailsTitle}
        actions={
          <Link
            href="/admin/users"
            className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-slate-50"
          >
            {users.cancel}
          </Link>
        }
      />

      <Panel className="p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-muted">{users.status}</p>
            <div className="mt-3">
              <UserStatusBadge status={user.status} labels={users} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted">
              {users.accountScope}
            </p>
            <p className="mt-3 text-sm font-medium text-content">
              {user.accountScope === "PLATFORM"
                ? users.platformAccount
                : users.companyAccount}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted">{users.company}</p>
            <p className="mt-3 text-sm font-medium text-content">
              {company?.name ?? users.platform}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted">{users.created}</p>
            <p className="mt-3 text-sm font-medium text-content">
              {formatDate(user.createdAt, locale)}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <p className="text-xs font-medium text-muted">{users.roles}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Badge key={role}>{roleLabels[role] ?? role}</Badge>
            ))}
          </div>
        </div>
      </Panel>

      {user.status === "INVITED" ? (
        <div className="rounded-md border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-brand">
          {users.invitationPending}
        </div>
      ) : null}

      {user.status === "INVITED" && canManage && administration ? (
        <Panel className="p-6 sm:p-8">
          <InvitationAdministrationPanel
            locale={locale}
            details={administration}
            resendAction={resendInvitationAction.bind(null, user.id)}
            regenerateAction={regenerateInvitationAction.bind(null, user.id)}
          />
        </Panel>
      ) : null}

      {canManage && allowedRoles.length > 0 ? (
        <Panel className="p-6 sm:p-8">
          <h2 className="mb-6 text-base font-semibold text-content">
            {users.roles}
          </h2>
          <UserRolesForm
            action={updateUserRolesAction.bind(null, user.id)}
            roles={allowedRoles}
            assignedRoles={user.roles}
            labels={users}
            roleLabels={admin.roles}
            administrationLabels={roleAdministrationLabels}
            lockedRoleKeys={
              administration && !administration.canRemoveAdminRole
                ? user.roles.includes("company_admin")
                  ? ["company_admin"]
                  : user.roles.includes("platform_admin")
                    ? ["platform_admin"]
                    : []
                : []
            }
            lockedReason={
              administration && !administration.canRemoveAdminRole
                ? invitationLabels.finalAdminDescription
                : null
            }
          />
        </Panel>
      ) : null}

      {canManage && user.status !== "INVITED" ? (
        <Panel className="p-6 sm:p-8">
          <h2 className="mb-6 text-base font-semibold text-content">
            {users.updateStatus}
          </h2>
          <UserStatusForm
            action={updateUserStatusAction.bind(null, user.id)}
            status={user.status}
            labels={users}
          />
        </Panel>
      ) : null}
    </div>
  );
}
