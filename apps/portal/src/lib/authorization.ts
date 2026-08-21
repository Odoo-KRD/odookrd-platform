import {
  PERMISSIONS,
  type CurrentSession,
  type PermissionKey,
} from "@odookrd/types";
import { redirect } from "next/navigation";

import { getSessionToken, requireSession } from "@/lib/session";

const administrativePermissions = new Set<string>([
  PERMISSIONS.COMPANIES_MANAGE,
  PERMISSIONS.USERS_MANAGE,
  PERMISSIONS.ROLES_MANAGE,
]);

export function hasPermission(
  session: CurrentSession,
  permission: PermissionKey,
): boolean {
  return session.authorization.permissions.includes(permission);
}

export function hasAdminAccess(session: CurrentSession): boolean {
  return session.authorization.permissions.some((permission) =>
    administrativePermissions.has(permission),
  );
}

export async function requireAdminPermission(
  permission: PermissionKey,
): Promise<CurrentSession> {
  const session = await requireSession();

  if (!hasAdminAccess(session) || !hasPermission(session, permission)) {
    redirect("/admin");
  }

  return session;
}

export async function getAdminApiContext(permission: PermissionKey): Promise<{
  session: CurrentSession;
  token: string;
}> {
  const session = await requireAdminPermission(permission);
  const token = await getSessionToken();

  if (!token) {
    redirect("/login");
  }

  return { session, token };
}
