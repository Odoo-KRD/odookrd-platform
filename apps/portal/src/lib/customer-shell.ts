import {
  PERMISSIONS,
  type CustomerAccountProfile,
  type CustomerNotificationPage,
  type NotificationUnreadCount,
  type TrainingCatalogStatus,
} from "@odookrd/types";

import type { AdminNavigationEntry, AdminNavigationItem } from "@/components/admin/navigation";
import { apiRequest } from "@/lib/api";
import { hasAdminAccess, hasPermission } from "@/lib/authorization";
import { customerDashboardV2Dictionaries } from "@/lib/i18n/customer/dashboard";
import { knowledgeDictionaries } from "@/lib/i18n/knowledge";
import { frontendTranslations } from "@/lib/i18n/public/translations";
import { getPortalDictionary } from "@/lib/i18n/customer/server";
import { getPublicSettings } from "@/lib/public-settings";
import { getSessionToken, requireSession } from "@/lib/session";
import { getUserUiPreferences } from "@/lib/user-ui-preferences";

/**
 * Everything the customer chrome needs: session, dictionaries, navigation and
 * the header's data.
 *
 * Extracted from the customer layout so the knowledge base can render the same
 * header without duplicating the fetches. Returns null when the signed-in user
 * is not a company user -- the customer layout redirects on that, while the
 * knowledge base simply falls back to a slim header, since platform admins can
 * read the knowledge base too.
 */
export async function getCustomerShell() {
  const [session, { locale, dictionary, portal }, publicSettings, uiPreferences] =
    await Promise.all([
      requireSession(),
      getPortalDictionary(),
      getPublicSettings(),
      getUserUiPreferences(),
    ]);

  const token = await getSessionToken();

  if (
    session.user.accountScope !== "COMPANY" ||
    !session.user.companyId ||
    !token
  ) {
    return null;
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

  const [profile, trainingStatus, notificationPage, unread] = await Promise.all([
    apiRequest<CustomerAccountProfile>("/workspace/profile", { token }),
    canTraining
      ? apiRequest<TrainingCatalogStatus>("/training/catalog/status", {
          token,
        }).catch(() => ({ enabled: false }))
      : Promise.resolve({ enabled: false }),
    canNotifications
      ? apiRequest<CustomerNotificationPage>("/notifications?limit=5&offset=0", {
          token,
        }).catch(() => ({
          items: [],
          pagination: { limit: 5, offset: 0, total: 0 },
        }))
      : Promise.resolve(null),
    canNotifications
      ? apiRequest<NotificationUnreadCount>("/notifications/unread-count", {
          token,
        }).catch(() => ({ unread: 0 }))
      : Promise.resolve(null),
  ]);
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

  navigation.push({
    kind: "item",
    href: "/kb",
    label: knowledgeDictionaries[locale].navigation,
    icon: "overview",
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

  return {
    session,
    token,
    locale,
    dictionary,
    portal,
    labels,
    publicSettings,
    uiPreferences,
    navigation,
    profile,
    notificationPage,
    unread,
    trainingEnabled,
    canCompany,
    canTraining,
    canNotifications,
    canAdministration,
  };
}

export type CustomerShell = NonNullable<
  Awaited<ReturnType<typeof getCustomerShell>>
>;
