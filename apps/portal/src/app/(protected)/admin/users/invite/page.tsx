import {
  PERMISSIONS,
  type Company,
  type PaginatedResult,
  type Role,
} from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";

import { InviteAndDeliverUserForm } from "@/components/users/invite-and-deliver-user-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { getUsersDictionary } from "@/lib/i18n/users/server";
import { userInvitationAdminDictionaries } from "@/lib/i18n/users/invitations";

import { inviteAndDeliverUserAction } from "../invitation-actions";

export default async function InviteUserPage() {
  const [{ session, token }, { locale, admin, users }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.USERS_MANAGE),
    getUsersDictionary(),
  ]);

  const isPlatform = session.user.accountScope === "PLATFORM";

  const [roles, companiesResult] = await Promise.all([
    hasPermission(session, PERMISSIONS.ROLES_READ)
      ? apiRequest<Role[]>("/roles", { token })
      : Promise.resolve([]),
    isPlatform && hasPermission(session, PERMISSIONS.COMPANIES_READ)
      ? apiRequest<PaginatedResult<Company>>(
          "/companies?limit=100&offset=0&status=ACTIVE",
          { token },
        )
      : Promise.resolve(null),
  ]);

  return (
    <div className="grid gap-7">
      <PageHeading
        title={users.inviteTitle}
        description={userInvitationAdminDictionaries[locale].inviteDescription}
      />

      <Panel className="p-6 sm:p-8">
        <InviteAndDeliverUserForm
          action={inviteAndDeliverUserAction}
          labels={users}
          roleLabels={admin.roles}
          roles={roles}
          companies={companiesResult?.items ?? []}
          isPlatform={isPlatform}
          companyId={session.user.companyId}
          locale={locale}
        />
      </Panel>
    </div>
  );
}
