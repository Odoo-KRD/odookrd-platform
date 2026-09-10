import type { Locale } from "@odookrd/types";

import type { AdminTranslations } from "../types";

const en = {
  administration: {
    overview: {
      title: "Administration",
      description: "Manage companies, user accounts, and access permissions.",
      companiesDescription: "Review and manage registered customer companies.",
      companyDescription: "Review and update your company's information.",
      usersDescription: "Manage individual accounts and invitations.",
      rolesDescription: "Review available roles and their permissions.",
      openSection: "Open section",
    },
  },
  errors: {
    title: "Something went wrong",
    description: "This section could not be loaded. Please try again.",
    retry: "Try again",
  },
  content: {
    locale: "en",
    translations: "Translations",
    saveTranslations: "Save translations",
    discardTranslations: "Discard",
    defaultLanguage: "Primary language",
    optionalLanguage: "Optional",
    languages: {
      ku: "Kurdish",
      ar: "Arabic",
      en: "English",
    },
  },
} satisfies AdminTranslations;

const ku = {
  administration: {
    overview: {
      title: "بەڕێوەبردن",
      description: "بەڕێوەبردنی کۆمپانیا، بەکارهێنەر و دەسەڵاتەکان.",
      companiesDescription: "بینین و بەڕێوەبردنی کۆمپانیا تۆمارکراوەکان.",
      companyDescription: "بینین و نوێکردنەوەی زانیارییەکانی کۆمپانیاکەت.",
      usersDescription: "بەڕێوەبردنی هەژمار و بانگهێشتەکان.",
      rolesDescription: "بینینی ڕۆڵەکان و ڕێگەپێدانەکانیان.",
      openSection: "کردنەوە",
    },
  },
  errors: {
    title: "هەڵەیەک ڕوویدا",
    description: "نەتوانرا ئەم بەشە بار بکرێت. تکایە دووبارە هەوڵ بدەوە.",
    retry: "دووبارە هەوڵدانەوە",
  },
  content: {
    locale: "ku",
    translations: "وەرگێڕانەکان",
    saveTranslations: "پاشەکەوتکردنی وەرگێڕانەکان",
    discardTranslations: "پاشگەزبوونەوە",
    defaultLanguage: "زمانی سەرەکی",
    optionalLanguage: "ئارەزوومەندانە",
    languages: {
      ku: "کوردی",
      ar: "عەرەبی",
      en: "ئینگلیزی",
    },
  },
} satisfies AdminTranslations;

const ar = {
  administration: {
    overview: {
      title: "الإدارة",
      description: "إدارة الشركات والمستخدمين والصلاحيات.",
      companiesDescription: "عرض الشركات المسجلة وإدارتها.",
      companyDescription: "عرض معلومات شركتك وتحديثها.",
      usersDescription: "إدارة الحسابات والدعوات.",
      rolesDescription: "عرض الأدوار والصلاحيات المرتبطة بها.",
      openSection: "فتح القسم",
    },
  },
  errors: {
    title: "حدث خطأ",
    description: "تعذر تحميل هذا القسم. يرجى المحاولة مرة أخرى.",
    retry: "إعادة المحاولة",
  },
  content: {
    locale: "ar",
    translations: "الترجمات",
    saveTranslations: "حفظ الترجمات",
    discardTranslations: "إلغاء",
    defaultLanguage: "اللغة الأساسية",
    optionalLanguage: "اختياري",
    languages: {
      ku: "الكردية",
      ar: "العربية",
      en: "الإنجليزية",
    },
  },
} satisfies AdminTranslations;

export const adminTranslations: Record<Locale, AdminTranslations> = {
  ku,
  ar,
  en,
};
