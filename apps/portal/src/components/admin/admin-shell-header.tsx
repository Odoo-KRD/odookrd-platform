"use client";

import type { CustomerNotification, Locale } from "@odookrd/types";

import type { AdminNavigationEntry } from "@/components/admin/navigation";
import {
  ShellHeader,
  type ShellHeaderAccountLink,
} from "@/components/shell/shell-header";
import type { ShellHeaderLabels } from "@/lib/i18n/shell/header";

interface AdminShellHeaderProps {
  siteTitle: string;
  workspaceLabel: string;
  workspaceName: string | null;
  navigationLabel: string;
  navigation: AdminNavigationEntry[];
  locale: Locale;
  languageLabel: string;
  labels: ShellHeaderLabels;
  email: string;
  displayName: string | null;
  unreadCount: number;
  notifications: CustomerNotification[];
  canNotifications: boolean;
  canSettings: boolean;
  canCustomerPortal: boolean;
  settingsLabel: string;
  customerPortalLabel: string;
}

/** The administration header: same shell as the customer portal. */
export function AdminShellHeader({
  siteTitle,
  workspaceLabel,
  workspaceName,
  navigationLabel,
  navigation,
  locale,
  languageLabel,
  labels,
  email,
  displayName,
  unreadCount,
  notifications,
  canNotifications,
  canSettings,
  canCustomerPortal,
  settingsLabel,
  customerPortalLabel,
}: AdminShellHeaderProps) {
  const accountLinks: ShellHeaderAccountLink[] = [];

  if (canCustomerPortal) {
    accountLinks.push({
      href: "/dashboard/profile",
      label: labels.accountMenu,
      emphasis: true,
    });
    accountLinks.push({ href: "/dashboard", label: customerPortalLabel });
  }
  if (canNotifications) {
    accountLinks.push({
      href: "/dashboard/notifications",
      label: labels.notifications,
    });
  }
  if (canSettings) {
    accountLinks.push({ href: "/admin/settings", label: settingsLabel });
  }

  return (
    <ShellHeader
      siteTitle={siteTitle}
      workspaceLabel={workspaceLabel}
      workspaceName={workspaceName}
      navigationLabel={navigationLabel}
      navigation={navigation}
      locale={locale}
      languageLabel={languageLabel}
      labels={labels}
      email={email}
      displayName={displayName}
      unreadCount={unreadCount}
      notifications={notifications}
      notificationsHref="/dashboard/notifications"
      accountLinks={accountLinks}
      canNotifications={canNotifications}
    />
  );
}
