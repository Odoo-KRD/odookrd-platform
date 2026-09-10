import type { Locale } from "@odookrd/types";

import type { PortalDictionary } from "../types";
import { sharedText } from "../shared";

export type { PortalDictionary } from "../types";

const en = {
  navigation: {
    label: "Customer navigation",
    dashboard: sharedText.en.labels.dashboard,
    administration: "Company administration",
    portal: "Customer workspace",
    collapseSidebar: sharedText.en.labels.collapseSidebar,
    expandSidebar: sharedText.en.labels.expandSidebar,
  },
  dashboard: {
    title: "Customer dashboard",
    description: "Manage your account and company services in one place.",
    accountTitle: "Account information",
    accountDescription: "Details for your active customer account.",
    email: "Email address",
    status: "Account status",
    active: sharedText.en.status.active,
    accountType: "Account type",
    companyAdministrator: sharedText.en.labels.companyAdministrator,
    companyUser: sharedText.en.labels.companyUser,
    administrationTitle: "Company administration",
    administrationDescription:
      "Manage your company information and authorized users.",
    openAdministration: "Open administration",
  },
} satisfies PortalDictionary;

const ku = {
  navigation: {
    label: "ڕێنوێنی کڕیار",
    dashboard: sharedText.ku.labels.dashboard,
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
    active: sharedText.ku.status.active,
    accountType: "جۆری هەژمار",
    companyAdministrator: sharedText.ku.labels.companyAdministrator,
    companyUser: sharedText.ku.labels.companyUser,
    administrationTitle: "بەڕێوەبردنی کۆمپانیا",
    administrationDescription:
      "دەستگەیشتن بە زانیارییەکانی کۆمپانیا و بەڕێوەبردنی بەکارهێنەران.",
    openAdministration: "کردنەوەی بەڕێوەبردن",
  },
} satisfies PortalDictionary;

const ar = {
  navigation: {
    label: "تنقل العميل",
    dashboard: sharedText.ar.labels.dashboard,
    administration: "إدارة الشركة",
    portal: "مساحة العميل",
    collapseSidebar: sharedText.ar.labels.collapseSidebar,
    expandSidebar: sharedText.ar.labels.expandSidebar,
  },
  dashboard: {
    title: "لوحة معلومات العميل",
    description: "تابع حسابك وخدمات شركتك من مكان واحد.",
    accountTitle: "معلومات الحساب",
    accountDescription: "تفاصيل حسابك النشط.",
    email: "البريد الإلكتروني",
    status: "حالة الحساب",
    active: sharedText.ar.status.active,
    accountType: "نوع الحساب",
    companyAdministrator: sharedText.ar.labels.companyAdministrator,
    companyUser: sharedText.ar.labels.companyUser,
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
