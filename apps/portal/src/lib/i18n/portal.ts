import type { Locale } from "@odookrd/types";

export interface PortalDictionary {
  navigation: {
    label: string;
    dashboard: string;
    administration: string;
    portal: string;
  };
  dashboard: {
    title: string;
    description: string;
    accountTitle: string;
    accountDescription: string;
    email: string;
    status: string;
    active: string;
    accountType: string;
    companyAdministrator: string;
    companyUser: string;
    administrationTitle: string;
    administrationDescription: string;
    openAdministration: string;
  };
}

export const portalDictionaries: Record<Locale, PortalDictionary> = {
  ku: {
    navigation: {
      label: "ڕێنوێنی کڕیار",
      dashboard: "داشبۆرد",
      administration: "بەڕێوەبردنی کۆمپانیا",
      portal: "ژینگەی کڕیار",
    },
    dashboard: {
      title: "داشبۆردی کڕیار",
      description:
        "لە یەک شوێنەوە هەژمار و خزمەتگوزارییەکانی کۆمپانیاکەت بەڕێوە ببە.",
      accountTitle: "زانیارییەکانی هەژمار",
      accountDescription: "وردەکارییەکانی هەژماری چالاکت.",
      email: "ئیمەیڵ",
      status: "دۆخی هەژمار",
      active: "چالاک",
      accountType: "جۆری هەژمار",
      companyAdministrator: "بەڕێوەبەری کۆمپانیا",
      companyUser: "بەکارهێنەری کۆمپانیا",
      administrationTitle: "بەڕێوەبردنی کۆمپانیا",
      administrationDescription:
        "دەستگەیشتن بە زانیارییەکانی کۆمپانیا و بەڕێوەبردنی بەکارهێنەران.",
      openAdministration: "کردنەوەی بەڕێوەبردن",
    },
  },
  ar: {
    navigation: {
      label: "تنقل العميل",
      dashboard: "لوحة المعلومات",
      administration: "إدارة الشركة",
      portal: "مساحة العميل",
    },
    dashboard: {
      title: "لوحة معلومات العميل",
      description: "تابع حسابك وخدمات شركتك من مكان واحد.",
      accountTitle: "معلومات الحساب",
      accountDescription: "تفاصيل حسابك النشط.",
      email: "البريد الإلكتروني",
      status: "حالة الحساب",
      active: "نشط",
      accountType: "نوع الحساب",
      companyAdministrator: "مدير الشركة",
      companyUser: "مستخدم الشركة",
      administrationTitle: "إدارة الشركة",
      administrationDescription: "إدارة معلومات الشركة والمستخدمين المصرح لهم.",
      openAdministration: "فتح الإدارة",
    },
  },
  en: {
    navigation: {
      label: "Customer navigation",
      dashboard: "Dashboard",
      administration: "Company administration",
      portal: "Customer workspace",
    },
    dashboard: {
      title: "Customer dashboard",
      description: "Manage your account and company services in one place.",
      accountTitle: "Account information",
      accountDescription: "Details for your active customer account.",
      email: "Email address",
      status: "Account status",
      active: "Active",
      accountType: "Account type",
      companyAdministrator: "Company administrator",
      companyUser: "Company user",
      administrationTitle: "Company administration",
      administrationDescription:
        "Manage your company information and authorized users.",
      openAdministration: "Open administration",
    },
  },
};
