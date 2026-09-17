"use client";

import type { CustomerNotification, Locale } from "@odookrd/types";

import type { AdminNavigationEntry } from "@/components/admin/navigation";
import {
  ShellHeader,
  type ShellHeaderAccountLink,
} from "@/components/shell/shell-header";
import type { CustomerDashboardV2Dictionary } from "@/lib/i18n/customer/dashboard";

interface CustomerShellHeaderProps {
  siteTitle: string;
  navigationLabel: string;
  navigation: AdminNavigationEntry[];
  locale: Locale;
  languageLabel: string;
  labels: CustomerDashboardV2Dictionary["header"];
  email: string;
  displayName: string | null;
  companyName: string | null;
  hasAvatar: boolean;
  avatarFileAssetId: string | null;
  unreadCount: number;
  notifications: CustomerNotification[];
  canCompany: boolean;
  canTraining: boolean;
  trainingEnabled: boolean;
  canNotifications: boolean;
  canAdministration: boolean;
}

/** The customer portal header: shared shell, customer account menu. */
export function CustomerShellHeader({
  siteTitle,
  navigationLabel,
  navigation,
  locale,
  languageLabel,
  labels,
  email,
  displayName,
  companyName,
  hasAvatar,
  avatarFileAssetId,
  unreadCount,
  notifications,
  canCompany,
  canTraining,
  trainingEnabled,
  canNotifications,
  canAdministration,
}: CustomerShellHeaderProps) {
  const accountLinks: ShellHeaderAccountLink[] = [
    { href: "/dashboard/profile", label: labels.myAccount, emphasis: true },
    { href: "/dashboard/profile", label: labels.editProfile },
  ];

  if (canCompany) {
    accountLinks.push({ href: "/dashboard/company", label: labels.myCompany });
  }
  if (canTraining && trainingEnabled) {
    accountLinks.push({
      href: "/dashboard/training",
      label: labels.myCourses,
    });
  }
  if (canTraining) {
    accountLinks.push({
      href: "/dashboard/training/certificates",
      label: labels.myCertificates,
    });
  }
  if (canNotifications) {
    accountLinks.push({
      href: "/dashboard/notifications",
      label: labels.notifications,
    });
  }
  if (canAdministration) {
    accountLinks.push({ href: "/admin", label: labels.administration });
  }

  return (
    <ShellHeader
      siteTitle={siteTitle}
      workspaceLabel={labels.customerPortal}
      workspaceName={companyName}
      navigationLabel={navigationLabel}
      navigation={navigation}
      locale={locale}
      languageLabel={languageLabel}
      labels={labels}
      email={email}
      displayName={displayName}
      hasAvatar={hasAvatar}
      avatarFileAssetId={avatarFileAssetId}
      unreadCount={unreadCount}
      notifications={notifications}
      notificationsHref="/dashboard/notifications"
      accountLinks={accountLinks}
      canNotifications={canNotifications}
    />
  );
}
