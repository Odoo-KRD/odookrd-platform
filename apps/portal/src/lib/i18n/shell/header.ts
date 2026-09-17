import type { Locale } from "@odookrd/types";

import { customerDashboardV2Dictionaries } from "../customer/dashboard";
import { frontendTranslations } from "../public/translations";

/**
 * Every label the shared shell header needs. The customer header dictionary
 * already satisfies this shape, so both shells render from one contract.
 */
export interface ShellHeaderLabels {
  openNavigation: string;
  closeNavigation: string;
  notifications: string;
  recentNotifications: string;
  noNotifications: string;
  unread: string;
  markRead: string;
  markAllRead: string;
  viewAll: string;
  viewMessage: string;
  closeMessage: string;
  openRelatedPage: string;
  accountMenu: string;
  logout: string;
  loggingOut: string;
}

/**
 * Admin shell labels. The wording is shared with the customer portal so the
 * two headers never drift apart in translation.
 */
export const adminHeaderDictionaries: Record<Locale, ShellHeaderLabels> = {
  ku: {
    ...customerDashboardV2Dictionaries.ku.header,
    notifications: frontendTranslations.ku.notifications.navigation,
  },
  ar: {
    ...customerDashboardV2Dictionaries.ar.header,
    notifications: frontendTranslations.ar.notifications.navigation,
  },
  en: {
    ...customerDashboardV2Dictionaries.en.header,
    notifications: frontendTranslations.en.notifications.navigation,
  },
};
