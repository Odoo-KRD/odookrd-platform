import { PERMISSIONS, type CurrentSession } from "@odookrd/types";

import type { AdminNavigationEntry } from "@/components/admin/navigation";
import { hasPermission } from "@/lib/authorization";

export interface AdminNavigationLabels {
  dashboard: string;
  overview: string;
  companies: string;
  myCompany: string;
  users: string;
  manageUsers: string;
  manageRoles: string;
  services: string;
  notifications: string;
  manageNotifications: string;
  settings: string;
}

export function buildAdminNavigation(
  session: CurrentSession,
  labels: AdminNavigationLabels,
): AdminNavigationEntry[] {
  const entries: AdminNavigationEntry[] = [];

  if (session.user.accountScope === "COMPANY") {
    entries.push({
      kind: "item",
      href: "/dashboard",
      label: labels.dashboard,
      icon: "dashboard",
    });
  }

  entries.push({
    kind: "item",
    href: "/admin",
    label: labels.overview,
    icon: "overview",
  });

  if (hasPermission(session, PERMISSIONS.COMPANIES_READ)) {
    entries.push({
      kind: "item",
      href: "/admin/companies",
      label:
        session.user.accountScope === "COMPANY"
          ? labels.myCompany
          : labels.companies,
      icon: "companies",
    });
  }

  const userChildren: AdminNavigationEntry[] = [];

  if (hasPermission(session, PERMISSIONS.USERS_READ)) {
    userChildren.push({
      kind: "item",
      href: "/admin/users",
      label: labels.manageUsers,
      icon: "users",
    });
  }

  if (hasPermission(session, PERMISSIONS.ROLES_READ)) {
    userChildren.push({
      kind: "item",
      href: "/admin/roles",
      label: labels.manageRoles,
      icon: "roles",
    });
  }

  if (userChildren.length > 0) {
    entries.push({
      kind: "group",
      id: "users",
      label: labels.users,
      icon: "users",
      children: userChildren,
    });
  }

  if (
    session.user.accountScope === "PLATFORM" &&
    hasPermission(session, PERMISSIONS.SERVICES_MANAGE)
  ) {
    entries.push({
      kind: "item",
      href: "/admin/services",
      label: labels.services,
      icon: "services",
    });
  }

  if (hasPermission(session, PERMISSIONS.NOTIFICATIONS_MANAGE)) {
    entries.push({
      kind: "group",
      id: "notifications",
      label: labels.notifications,
      icon: "notifications",
      children: [
        {
          kind: "item",
          href: "/admin/notifications",
          label: labels.manageNotifications,
          icon: "notifications",
        },
      ],
    });
  }

  if (hasPermission(session, PERMISSIONS.SETTINGS_READ)) {
    entries.push({
      kind: "item",
      href: "/admin/settings",
      label: labels.settings,
      icon: "settings",
    });
  }

  return entries;
}
