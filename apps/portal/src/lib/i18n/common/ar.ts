import type { Dictionary } from "../types";

export const commonAr = {
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
