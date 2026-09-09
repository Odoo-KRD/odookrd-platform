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
  manageServices: string;
  featureDefinitions: string;
  renewalRequests: string;
  training: string;
  trainingCourses: string;
  trainingCategories: string;
  trainingCertificateTemplates: string;
  trainingCertificates: string;
  trainingReports: string;
  notifications: string;
  deliveryLog: string;
  providerStatus: string;
  testEmail: string;
  broadcasts: string;
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
    });
  }

  if (hasPermission(session, PERMISSIONS.ROLES_READ)) {
    userChildren.push({
      kind: "item",
      href: "/admin/roles",
      label: labels.manageRoles,
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
      kind: "group",
      id: "services",
      label: labels.services,
      icon: "services",
      children: [
        {
          kind: "item",
          href: "/admin/services",
          label: labels.manageServices,
        },
        {
          kind: "item",
          href: "/admin/services/features",
          label: labels.featureDefinitions,
        },
        {
          kind: "item",
          href: "/admin/services/renewals",
          label: labels.renewalRequests,
        },
      ],
    });
  }

  const trainingChildren: AdminNavigationEntry[] = [];

  if (
    session.user.accountScope === "PLATFORM" &&
    hasPermission(session, PERMISSIONS.TRAINING_MANAGE)
  ) {
    trainingChildren.push(
      {
        kind: "item",
        href: "/admin/training/courses",
        label: labels.trainingCourses,
      },
      {
        kind: "item",
        href: "/admin/training/categories",
        label: labels.trainingCategories,
      },
      {
        kind: "item",
        href: "/admin/training/certificate-templates",
        label: labels.trainingCertificateTemplates,
      },
      {
        kind: "item",
        href: "/admin/training/certificates",
        label: labels.trainingCertificates,
      },
    );
  }

  if (hasPermission(session, PERMISSIONS.TRAINING_REPORTS_READ)) {
    trainingChildren.push({
      kind: "item",
      href: "/admin/training/reports",
      label: labels.trainingReports,
    });
  }

  if (trainingChildren.length > 0) {
    entries.push({
      kind: "group",
      id: "training",
      label: labels.training,
      icon: "training",
      children: trainingChildren,
    });
  }

  if (hasPermission(session, PERMISSIONS.NOTIFICATIONS_MANAGE)) {
    const notificationChildren: AdminNavigationEntry[] = [
      {
        kind: "item",
        href: "/admin/notifications/deliveries",
        label: labels.deliveryLog,
      },
    ];

    if (session.user.accountScope === "PLATFORM") {
      notificationChildren.push(
        {
          kind: "item",
          href: "/admin/notifications/providers",
          label: labels.providerStatus,
        },
        {
          kind: "item",
          href: "/admin/notifications/test-email",
          label: labels.testEmail,
        },
      );
    }

    notificationChildren.push({
      kind: "item",
      href: "/admin/notifications/broadcasts",
      label: labels.broadcasts,
    });

    entries.push({
      kind: "group",
      id: "notifications",
      label: labels.notifications,
      icon: "notifications",
      children: notificationChildren,
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
