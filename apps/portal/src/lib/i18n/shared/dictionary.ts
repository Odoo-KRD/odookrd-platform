import type { Locale } from "@odookrd/types";

import type { Dictionary } from "../types";

const en = {
  common: {
    brand: "OdooKRD",
    language: "Language",
    platform: "Customer Platform",
    secureAccess: "Secure account access",
  },
  login: {
    title: "Welcome back",
    description: "Sign in to continue to your account.",
    email: "Email address",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in...",
    invalidCredentials: "The email address or password is incorrect.",
    tooManyAttempts: "Too many attempts. Please try again later.",
    unavailable: "The service is currently unavailable.",
  },
  workspace: {
    adminTitle: "Administration workspace",
    adminDescription:
      "The administration foundation is ready for the next step.",
    customerTitle: "Customer workspace",
    customerDescription:
      "Your account is active. The customer workspace arrives in Stage 2.",
    signedInAs: "Signed in as",
    permissions: "Permissions",
    signOut: "Sign out",
    signingOut: "Signing out...",
  },
} satisfies Dictionary;

const ku = {
  common: {
    brand: "OdooKRD",
    language: "زمان",
    platform: "پلاتفۆرمی کڕیاران",
    secureAccess: "چوونەژوورەوەی پارێزراو",
  },
  login: {
    title: "بەخێربێیتەوە",
    description: "بۆ بەردەوامبوون بچۆ ژوورەوە.",
    email: "ئیمەیڵ",
    password: "وشەی نهێنی",
    submit: "چوونەژوورەوە",
    submitting: "چوونەژوورەوە...",
    invalidCredentials: "ئیمەیڵ یان وشەی نهێنی نادروستە.",
    tooManyAttempts: "هەوڵەکان زۆرن. تکایە دواتر دووبارە هەوڵ بدەوە.",
    unavailable: "ئێستا پەیوەندی بە خزمەتگوزارییەکەوە ناکرێت.",
  },
  workspace: {
    adminTitle: "ژینگەی بەڕێوەبردن",
    adminDescription: "بنەمای بەڕێوەبردن ئامادەیە بۆ قۆناغی داهاتوو.",
    customerTitle: "ژینگەی کڕیار",
    customerDescription:
      "هەژمارەکەت چالاکە. ژینگەی کڕیار لە قۆناغی دوو زیاد دەکرێت.",
    signedInAs: "چوویتە ژوورەوە بە",
    permissions: "ڕێگەپێدانەکان",
    signOut: "چوونەدەرەوە",
    signingOut: "چوونەدەرەوە...",
  },
} satisfies Dictionary;

const ar = {
  common: {
    brand: "OdooKRD",
    language: "اللغة",
    platform: "منصة العملاء",
    secureAccess: "تسجيل دخول آمن",
  },
  login: {
    title: "مرحباً بعودتك",
    description: "سجّل الدخول للمتابعة.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    submit: "تسجيل الدخول",
    submitting: "جارٍ تسجيل الدخول...",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    tooManyAttempts: "محاولات كثيرة. يرجى المحاولة لاحقاً.",
    unavailable: "الخدمة غير متاحة حالياً.",
  },
  workspace: {
    adminTitle: "مساحة الإدارة",
    adminDescription: "أساس الإدارة جاهز للمرحلة التالية.",
    customerTitle: "مساحة العميل",
    customerDescription: "حسابك نشط. ستتوفر مساحة العميل في المرحلة الثانية.",
    signedInAs: "تم تسجيل الدخول بواسطة",
    permissions: "الصلاحيات",
    signOut: "تسجيل الخروج",
    signingOut: "جارٍ تسجيل الخروج...",
  },
} satisfies Dictionary;

export const commonTranslations: Record<Locale, Dictionary> = { ku, ar, en };
