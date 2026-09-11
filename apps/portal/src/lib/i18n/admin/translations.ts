import type { Locale } from "@odookrd/types";

import type { AdminTranslations } from "../types";
import { sharedText } from "../shared";

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
    reference: "Reference",
    title: "Something went wrong",
    description: "This section could not be loaded. Please try again.",
    retry: sharedText.en.actions.retry,
  },
  content: {
    locale: "en",
    copyToLanguages: "Copy to other languages",
    copyToLanguagesHint:
      "Copies this language's content into the other language tabs so you can translate in place.",
    copyToLanguagesConfirm:
      "The other languages already have content. Replace it?",
    copyToLanguagesDone: "Copied. Switch tabs to translate.",
    translations: sharedText.en.labels.translations,
    saveTranslations: sharedText.en.labels.saveTranslations,
    discardTranslations: sharedText.en.labels.discardTranslations,
    defaultLanguage: sharedText.en.languages.defaultLanguage,
    optionalLanguage: sharedText.en.languages.optionalLanguage,
    languages: {
      ku: sharedText.en.languages.ku,
      ar: sharedText.en.languages.ar,
      en: sharedText.en.languages.en,
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
    reference: "ژمارەی ئاماژە",
    title: "هەڵەیەک ڕوویدا",
    description: "نەتوانرا ئەم بەشە بار بکرێت. تکایە دووبارە هەوڵ بدەوە.",
    retry: sharedText.ku.actions.retry,
  },
  content: {
    locale: "ku",
    copyToLanguages: "لەبەرگرتنەوە بۆ زمانەکانی تر",
    copyToLanguagesHint:
      "ناوەڕۆکی ئەم زمانە دەگوێزێتەوە بۆ تابەکانی تر تا لەوێ وەریبگێڕیت.",
    copyToLanguagesConfirm: "زمانەکانی تر ناوەڕۆکیان هەیە. بیانگۆڕیت؟",
    copyToLanguagesDone: "لەبەرگیرایەوە. تاب بگۆڕە بۆ وەرگێڕان.",
    translations: sharedText.ku.labels.translations,
    saveTranslations: sharedText.ku.labels.saveTranslations,
    discardTranslations: sharedText.ku.labels.discardTranslations,
    defaultLanguage: sharedText.ku.languages.defaultLanguage,
    optionalLanguage: sharedText.ku.languages.optionalLanguage,
    languages: {
      ku: sharedText.ku.languages.ku,
      ar: sharedText.ku.languages.ar,
      en: sharedText.ku.languages.en,
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
    reference: "الرقم المرجعي",
    title: "حدث خطأ",
    description: "تعذر تحميل هذا القسم. يرجى المحاولة مرة أخرى.",
    retry: sharedText.ar.actions.retry,
  },
  content: {
    locale: "ar",
    copyToLanguages: "نسخ إلى اللغات الأخرى",
    copyToLanguagesHint:
      "ينسخ محتوى هذه اللغة إلى تبويبات اللغات الأخرى لترجمته هناك.",
    copyToLanguagesConfirm: "اللغات الأخرى تحتوي على محتوى. هل تريد استبداله؟",
    copyToLanguagesDone: "تم النسخ. بدّل التبويب للترجمة.",
    translations: sharedText.ar.labels.translations,
    saveTranslations: sharedText.ar.labels.saveTranslations,
    discardTranslations: sharedText.ar.labels.discardTranslations,
    defaultLanguage: sharedText.ar.languages.defaultLanguage,
    optionalLanguage: sharedText.ar.languages.optionalLanguage,
    languages: {
      ku: sharedText.ar.languages.ku,
      ar: sharedText.ar.languages.ar,
      en: sharedText.ar.languages.en,
    },
  },
} satisfies AdminTranslations;

export const adminTranslations: Record<Locale, AdminTranslations> = {
  ku,
  ar,
  en,
};
