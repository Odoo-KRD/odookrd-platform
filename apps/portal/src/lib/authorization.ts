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
  PERMISSIONS.SERVICES_MANAGE,
  PERMISSIONS.NOTIFICATIONS_MANAGE,
  PERMISSIONS.SETTINGS_READ,
  PERMISSIONS.SETTINGS_MANAGE,
  PERMISSIONS.TRAINING_MANAGE,
  PERMISSIONS.TRAINING_ASSIGN,
  PERMISSIONS.TRAINING_PROGRESS_READ,
  PERMISSIONS.TRAINING_REPORTS_READ,
  PERMISSIONS.KNOWLEDGE_MANAGE,
  PERMISSIONS.HELPDESK_MANAGE,
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

export function getDefaultAuthenticatedPath(
  session: CurrentSession,
): "/admin" | "/dashboard" {
  return session.user.accountScope === "PLATFORM" ? "/admin" : "/dashboard";
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

export async function getCustomerAccountApiContext(): Promise<{
  session: CurrentSession;
  token: string;
}> {
  const session = await requireSession();

  if (session.user.accountScope !== "COMPANY" || !session.user.companyId) {
    redirect(
      session.user.accountScope === "PLATFORM" ? "/admin" : "/dashboard",
    );
  }

  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  return { session, token };
}

/**
 * Inbox pages and actions are shared: a company user reads their company inbox,
 * a platform admin reads the platform inbox. Both need a token and the
 * permission; only the company case needs a company.
 */
export async function getNotificationApiContext(
  permission: PermissionKey,
): Promise<{
  session: CurrentSession;
  token: string;
}> {
  const session = await requireSession();
  const isPlatform = session.user.accountScope === "PLATFORM";

  if (
    !hasPermission(session, permission) ||
    (!isPlatform && !session.user.companyId)
  ) {
    redirect(isPlatform ? "/admin" : "/dashboard");
  }

  const token = await getSessionToken();

  if (!token) {
    redirect("/login");
  }

  return { session, token };
}

export async function getCustomerApiContext(
  permission: PermissionKey,
): Promise<{
  session: CurrentSession;
  token: string;
}> {
  const session = await requireSession();

  if (
    session.user.accountScope !== "COMPANY" ||
    !session.user.companyId ||
    !hasPermission(session, permission)
  ) {
    redirect(
      session.user.accountScope === "PLATFORM" ? "/admin" : "/dashboard",
    );
  }

  const token = await getSessionToken();

  if (!token) {
    redirect("/login");
  }

  return { session, token };
}
