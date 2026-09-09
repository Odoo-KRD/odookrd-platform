import {
  PERMISSIONS,
  type CustomerAccountProfile,
  type CustomerNotificationPage,
  type NotificationUnreadCount,
  type TrainingCatalogStatus,
} from "@odookrd/types";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import type {
  AdminNavigationEntry,
  AdminNavigationItem,
} from "@/components/admin/navigation";
import { CustomerShellHeader } from "@/components/customer/customer-shell-header";
import { apiRequest } from "@/lib/api";
import { hasAdminAccess, hasPermission } from "@/lib/authorization";
import { customerDashboardV2Dictionaries } from "@/lib/i18n/customer/dashboard";
import { frontendTranslations } from "@/lib/i18n/public/translations";
import { getPortalDictionary } from "@/lib/i18n/customer/server";
import { getPublicSettings } from "@/lib/public-settings";
import { getSessionToken, requireSession } from "@/lib/session";
import { getUserUiPreferences } from "@/lib/user-ui-preferences";

export default async function ProtectedCustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [
    session,
    { locale, dictionary, portal },
    publicSettings,
    uiPreferences,
  ] = await Promise.all([
    requireSession(),
    getPortalDictionary(),
    getPublicSettings(),
    getUserUiPreferences(),
  ]);

  if (session.user.accountScope !== "COMPANY" || !session.user.companyId) {
    redirect("/admin");
  }

  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  const labels = customerDashboardV2Dictionaries[locale];
  const canServices = hasPermission(session, PERMISSIONS.SERVICES_READ);
  const canTraining = hasPermission(session, PERMISSIONS.TRAINING_READ);
  const canCompany = hasPermission(session, PERMISSIONS.COMPANIES_READ);
  const canNotifications = hasPermission(
    session,
    PERMISSIONS.NOTIFICATIONS_READ,
  );
  const canAdministration = hasAdminAccess(session);

  const [profile, trainingStatus, notificationPage, unread] = await Promise.all(
    [
      apiRequest<CustomerAccountProfile>("/workspace/profile", { token }),
      canTraining
        ? apiRequest<TrainingCatalogStatus>("/training/catalog/status", {
            token,
          }).catch(() => ({ enabled: false }))
        : Promise.resolve({ enabled: false }),
      canNotifications
        ? apiRequest<CustomerNotificationPage>(
            "/notifications?limit=5&offset=0",
            {
              token,
            },
          ).catch(() => ({
            items: [],
            pagination: { limit: 5, offset: 0, total: 0 },
          }))
        : Promise.resolve(null),
      canNotifications
        ? apiRequest<NotificationUnreadCount>("/notifications/unread-count", {
            token,
          }).catch(() => ({ unread: 0 }))
        : Promise.resolve(null),
    ],
  );
  const trainingEnabled = trainingStatus.enabled;

  const navigation: AdminNavigationEntry[] = [
    {
      kind: "item",
      href: "/dashboard",
      label: portal.navigation.dashboard,
      icon: "dashboard",
    },
  ];

  if (canServices) {
    navigation.push({
      kind: "item",
      href: "/dashboard/services",
      label: frontendTranslations[locale].services.title,
      icon: "services",
    });
  }

  const learningChildren: AdminNavigationItem[] = [];
  if (canTraining && trainingEnabled) {
    learningChildren.push({
      kind: "item",
      href: "/dashboard/training",
      label: labels.navigation.myCourses,
    });
  }
  if (canTraining) {
    learningChildren.push({
      kind: "item",
      href: "/dashboard/training/certificates",
      label: labels.navigation.myCertificates,
    });
  }
  if (learningChildren.length > 0) {
    navigation.push({
      kind: "group",
      id: "customer-learning",
      label: labels.navigation.learning,
      icon: "training",
      children: learningChildren,
    });
  }

  const accountChildren: AdminNavigationItem[] = [];
  if (canCompany) {
    accountChildren.push({
      kind: "item",
      href: "/dashboard/company",
      label: labels.navigation.companyProfile,
    });
  }
  accountChildren.push({
    kind: "item",
    href: "/dashboard/profile",
    label: labels.navigation.myProfile,
  });
  navigation.push({
    kind: "group",
    id: "customer-company-account",
    label: labels.navigation.companyAccount,
    icon: "users",
    children: accountChildren,
  });

  if (canNotifications) {
    navigation.push({
      kind: "item",
      href: "/dashboard/notifications",
      label: frontendTranslations[locale].notifications.navigation,
      icon: "notifications",
    });
  }

  if (canAdministration) {
    navigation.push({
      kind: "item",
      href: "/admin",
      label: portal.navigation.administration,
      icon: "overview",
    });
  }

  return (
    <div className="min-h-screen bg-surface-page lg:flex lg:h-screen lg:overflow-hidden">
      <AdminSidebar
        siteTitle={publicSettings.siteTitle}
        administrationLabel={portal.navigation.portal}
        navigationLabel={portal.navigation.label}
        entries={navigation}
        signedInAsLabel={dictionary.workspace.signedInAs}
        email={session.user.email}
        initialCollapsed={uiPreferences.sidebarCollapsed}
        collapseLabel={portal.navigation.collapseSidebar}
        expandLabel={portal.navigation.expandSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden">
        <CustomerShellHeader
          siteTitle={publicSettings.siteTitle}
          navigationLabel={portal.navigation.label}
          navigation={navigation}
          locale={locale}
          languageLabel={dictionary.common.language}
          labels={labels.header}
          email={profile.email}
          displayName={profile.displayName ?? profile.certificateName}
          companyName={profile.company.name}
          hasAvatar={profile.hasAvatar}
          avatarFileAssetId={profile.avatarFileAssetId}
          unreadCount={unread?.unread ?? 0}
          notifications={notificationPage?.items ?? []}
          canCompany={canCompany}
          canTraining={canTraining}
          trainingEnabled={trainingEnabled}
          canNotifications={canNotifications}
          canAdministration={canAdministration}
        />

        <main className="customer-shell-main w-full min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
