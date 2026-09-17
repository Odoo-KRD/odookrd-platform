import {
  PERMISSIONS,
  type Company,
  type DashboardSectionKey,
  type ManagedUser,
  type PaginatedResult,
  type Role,
  type ManagedService,
  type ServiceFeatureDefinition,
  type SubscriptionPipelineReport,
  type SubscriptionRenewalRequest,
  type TrainingCourse,
  type TrainingReportOverview,
} from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import {
  AdminDashboard,
  type AdminDashboardMetric,
  type AdminDashboardSection,
} from "@/components/admin/admin-dashboard";
import { apiRequest } from "@/lib/api";
import { hasPermission } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin/server";
import { adminDashboardDictionaries } from "@/lib/i18n/admin/dashboard";
import { notificationAdministrationDictionaries } from "@/lib/i18n/notifications/administration";
import { servicesDictionaries } from "@/lib/i18n/services";
import { settingsDictionaries } from "@/lib/i18n/settings";
import { getSessionToken, requireSession } from "@/lib/session";
import { getUserUiPreferences } from "@/lib/user-ui-preferences";

/** Dashboard counters must never break the page, so every read can fail. */
function count(result: { pagination: { total: number } } | null): number | null {
  return result?.pagination.total ?? null;
}

function metric(
  label: string,
  value: number | null,
  tone?: AdminDashboardMetric["tone"],
): AdminDashboardMetric {
  return {
    label,
    value: value === null ? "—" : new Intl.NumberFormat("en").format(value),
    tone: value === null || value === 0 ? "neutral" : tone,
  };
}

export default async function AdminOverviewPage() {
  const [session, { locale, navigation, admin }, uiPreferences, token] =
    await Promise.all([
      requireSession(),
      getAdminDictionary(),
      getUserUiPreferences(),
      getSessionToken(),
    ]);

  const dashboardLabels = adminDashboardDictionaries[locale];
  const metricLabels = dashboardLabels.metrics;
  const isPlatform = session.user.accountScope === "PLATFORM";

  const canCompanies = hasPermission(session, PERMISSIONS.COMPANIES_READ);
  const canUsers = hasPermission(session, PERMISSIONS.USERS_READ);
  const canRoles = hasPermission(session, PERMISSIONS.ROLES_READ);
  const canServices =
    isPlatform && hasPermission(session, PERMISSIONS.SERVICES_MANAGE);
  const canTraining =
    isPlatform && hasPermission(session, PERMISSIONS.TRAINING_MANAGE);
  const canReports = hasPermission(session, PERMISSIONS.TRAINING_REPORTS_READ);
  const canNotifications = hasPermission(
    session,
    PERMISSIONS.NOTIFICATIONS_MANAGE,
  );
  const canSettings = hasPermission(session, PERMISSIONS.SETTINGS_READ);

  /** One counter read. A failure returns null and the card shows a dash. */
  function read<T>(enabled: boolean, path: string): Promise<T | null> {
    if (!enabled || !token) return Promise.resolve(null);
    return apiRequest<T>(path, { token }).catch(() => null);
  }

  const [
    companies,
    activeCompanies,
    users,
    invitedUsers,
    roles,
    services,
    features,
    pendingRenewals,
    pipeline,
    courses,
    publishedCourses,
    trainingOverview,
    failedDeliveries,
    pendingDeliveries,
  ] = await Promise.all([
    read<PaginatedResult<Company>>(canCompanies, "/companies?limit=1&offset=0"),
    read<PaginatedResult<Company>>(
      canCompanies,
      "/companies?limit=1&offset=0&status=ACTIVE",
    ),
    read<PaginatedResult<ManagedUser>>(canUsers, "/users?limit=1&offset=0"),
    read<PaginatedResult<ManagedUser>>(
      canUsers,
      "/users?limit=1&offset=0&status=INVITED",
    ),
    read<Role[]>(canRoles, "/roles"),
    read<PaginatedResult<ManagedService>>(canServices, "/services?limit=1&offset=0"),
    read<PaginatedResult<ServiceFeatureDefinition>>(
      canServices,
      "/service-feature-definitions?limit=1&offset=0",
    ),
    read<PaginatedResult<SubscriptionRenewalRequest>>(
      canServices,
      "/subscription-renewal-requests?limit=1&offset=0&status=PENDING",
    ),
    read<SubscriptionPipelineReport>(canServices, "/subscription-reports/pipeline"),
    read<PaginatedResult<TrainingCourse>>(
      canTraining,
      "/training/courses?limit=1&offset=0",
    ),
    read<PaginatedResult<TrainingCourse>>(
      canTraining,
      "/training/courses?limit=1&offset=0&status=PUBLISHED",
    ),
    read<TrainingReportOverview>(canReports, "/training/reports/overview"),
    read<{ pagination: { total: number } }>(
      canNotifications,
      "/notification-administration/deliveries?limit=1&offset=0&status=FAILED",
    ),
    read<{ pagination: { total: number } }>(
      canNotifications,
      "/notification-administration/deliveries?limit=1&offset=0&status=PENDING",
    ),
  ]);

  const sections: AdminDashboardSection[] = [];

  function addSection(
    id: DashboardSectionKey,
    href: string,
    title: string,
    description: string,
    extras: Pick<AdminDashboardSection, "metrics" | "links"> = {},
  ): void {
    sections.push({
      id,
      href,
      title,
      description,
      openLabel: admin.overview.openSection,
      ...extras,
    });
  }

  if (canCompanies) {
    addSection(
      "companies",
      "/admin/companies",
      isPlatform ? navigation.companies : navigation.myCompany,
      isPlatform
        ? admin.overview.companiesDescription
        : admin.overview.companyDescription,
      {
        metrics: [
          metric(metricLabels.total, count(companies)),
          metric(metricLabels.active, count(activeCompanies), "positive"),
        ],
      },
    );
  }

  if (canUsers) {
    addSection(
      "users",
      "/admin/users",
      navigation.users,
      admin.overview.usersDescription,
      {
        metrics: [
          metric(metricLabels.total, count(users)),
          metric(metricLabels.invited, count(invitedUsers), "attention"),
        ],
        links: [{ href: "/admin/users/invite", label: navigation.manageUsers }],
      },
    );
  }

  if (canRoles) {
    addSection(
      "roles",
      "/admin/roles",
      navigation.roles,
      admin.overview.rolesDescription,
      {
        metrics: [metric(metricLabels.total, roles?.length ?? null)],
      },
    );
  }

  if (canServices) {
    const servicesCopy = servicesDictionaries[locale];
    addSection(
      "services",
      "/admin/services",
      servicesCopy.title,
      servicesCopy.description,
      {
        metrics: [metric(metricLabels.total, count(services))],
        links: [
          { href: "/admin/services/assign", label: navigation.manageServices },
        ],
      },
    );
    addSection(
      "features",
      "/admin/services/features",
      navigation.featureDefinitions,
      dashboardLabels.descriptions.features,
      { metrics: [metric(metricLabels.total, count(features))] },
    );
    addSection(
      "renewals",
      "/admin/services/renewals",
      navigation.renewalRequests,
      dashboardLabels.descriptions.renewals,
      {
        metrics: [
          metric(metricLabels.pending, count(pendingRenewals), "attention"),
        ],
      },
    );
    addSection(
      "pipeline",
      "/admin/services/pipeline",
      navigation.renewalPipeline,
      dashboardLabels.descriptions.pipeline,
      {
        metrics: [
          metric(
            metricLabels.needsAttention,
            pipeline?.summary.needsAttention ?? null,
            "attention",
          ),
          metric(
            metricLabels.autoRenewing,
            pipeline?.summary.autoRenewing ?? null,
            "positive",
          ),
        ],
      },
    );
  }

  if (canTraining) {
    addSection(
      "training",
      "/admin/training/courses",
      navigation.trainingCourses,
      dashboardLabels.descriptions.training,
      {
        metrics: [
          metric(metricLabels.total, count(courses)),
          metric(metricLabels.published, count(publishedCourses), "positive"),
        ],
        links: [
          {
            href: "/admin/training/categories",
            label: navigation.trainingCategories,
          },
          {
            href: "/admin/training/certificate-templates",
            label: navigation.trainingCertificateTemplates,
          },
        ],
      },
    );
    addSection(
      "certificates",
      "/admin/training/certificates",
      navigation.trainingCertificates,
      dashboardLabels.descriptions.certificates,
      {
        metrics: [
          metric(
            metricLabels.issuedCertificates,
            trainingOverview?.certificatesIssued ?? null,
          ),
          metric(
            metricLabels.active,
            trainingOverview?.activeCertificates ?? null,
            "positive",
          ),
        ],
      },
    );
  }

  if (canReports) {
    addSection(
      "reports",
      "/admin/training/reports",
      navigation.trainingReports,
      dashboardLabels.descriptions.reports,
      {
        metrics: [
          metric(metricLabels.learners, trainingOverview?.activeLearners ?? null),
          metric(
            metricLabels.completions,
            trainingOverview?.completions ?? null,
            "positive",
          ),
        ],
      },
    );
  }

  if (canNotifications) {
    const notifications = notificationAdministrationDictionaries[locale];
    addSection(
      "notifications",
      "/admin/notifications/deliveries",
      notifications.navigation,
      notifications.description,
      {
        metrics: [
          metric(metricLabels.pending, count(pendingDeliveries), "attention"),
          metric(
            metricLabels.failedDeliveries,
            count(failedDeliveries),
            "attention",
          ),
        ],
        links: isPlatform
          ? [
              {
                href: "/admin/notifications/providers",
                label: navigation.providerStatus,
              },
              {
                href: "/admin/notifications/test-email",
                label: navigation.testEmail,
              },
            ]
          : undefined,
      },
    );
    addSection(
      "broadcasts",
      "/admin/notifications/broadcasts",
      navigation.broadcasts,
      dashboardLabels.descriptions.broadcasts,
      {
        links: [
          {
            href: "/admin/notifications/broadcasts/new",
            label: navigation.broadcasts,
          },
        ],
      },
    );
  }

  if (canSettings) {
    const settings = settingsDictionaries[locale];
    addSection(
      "settings",
      "/admin/settings",
      settings.title,
      settings.description,
    );
  }

  return (
    <div className="grid gap-8">
      <PageHeading
        title={admin.overview.title}
        description={admin.overview.description}
      />

      {isPlatform ? (
        <AdminDashboard
          sections={sections}
          initialPreferences={uiPreferences.dashboardPreferences}
          labels={dashboardLabels}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Panel key={section.id} className="p-6">
              <h2 className="text-base font-semibold text-content">
                {section.title}
              </h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted">
                {section.description}
              </p>
              <Link
                href={section.href}
                className="mt-5 inline-flex text-sm font-medium text-brand hover:text-brand-hover"
              >
                {section.openLabel}
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
