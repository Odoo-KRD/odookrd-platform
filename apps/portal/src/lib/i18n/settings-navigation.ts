import type { Locale } from "@odookrd/types";

export interface SettingsNavigationDictionary {
  categoriesLabel: string;
  notificationTabsLabel: string;
  notificationTabs: {
    general: string;
    email: string;
    whatsapp: string;
  };
}

export const settingsNavigationDictionaries: Record<
  Locale,
  SettingsNavigationDictionary
> = {
  ku: {
    categoriesLabel: "بەشەکانی ڕێکخستن",
    notificationTabsLabel: "ڕێکخستنەکانی ئاگادارکردنەوە",
    notificationTabs: {
      general: "گشتی",
      email: "ئیمەیڵ",
      whatsapp: "واتسئاپ",
    },
  },
  ar: {
    categoriesLabel: "أقسام الإعدادات",
    notificationTabsLabel: "إعدادات الإشعارات",
    notificationTabs: {
      general: "عام",
      email: "البريد الإلكتروني",
      whatsapp: "واتساب",
    },
  },
  en: {
    categoriesLabel: "Settings sections",
    notificationTabsLabel: "Notification settings",
    notificationTabs: {
      general: "General",
      email: "Email",
      whatsapp: "WhatsApp",
    },
  },
};
