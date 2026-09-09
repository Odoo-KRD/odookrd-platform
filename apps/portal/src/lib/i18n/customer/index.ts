import type { Locale } from "@odookrd/types";

import type { PortalDictionary } from "../types";

export type { PortalDictionary } from "../types";

const en = {
  navigation: {
    label: "Customer navigation",
    dashboard: "Dashboard",
    administration: "Company administration",
    portal: "Customer workspace",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
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
} satisfies PortalDictionary;

const ku = {
  navigation: {
    label: "ڕێنوێنی کڕیار",
    dashboard: "داشبۆرد",
    administration: "بەڕێوەبردنی کۆمپانیا",
    portal: "ژینگەی کڕیار",
    collapseSidebar: "بچووککردنەوەی مێنیوی لاتەنیشت",
    expandSidebar: "گەورەکردنەوەی مێنیوی لاتەنیشت",
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
} satisfies PortalDictionary;

const ar = {
  navigation: {
    label: "تنقل العميل",
    dashboard: "لوحة المعلومات",
    administration: "إدارة الشركة",
    portal: "مساحة العميل",
    collapseSidebar: "طي الشريط الجانبي",
    expandSidebar: "توسيع الشريط الجانبي",
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
} satisfies PortalDictionary;

export const portalDictionaries: Record<Locale, PortalDictionary> = {
  ku,
  ar,
  en,
};
