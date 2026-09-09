import type { Locale } from "@odookrd/types";

export const activationCopy: Record<
  Locale,
  {
    eyebrow: string;
    name: string;
    nameHint: string;
    invalidName: string;
    security: string;
    step: string;
  }
> = {
  ku: {
    eyebrow: "چالاککردنی هەژمار",
    name: "ناوی تەواوی تۆ",
    nameHint: "ئەم ناوە لە پڕۆفایلی کەسیی تۆدا بەکاردێت، نەک ناوی کۆمپانیاکەت.",
    invalidName: "تکایە ناوێکی دروست لە ٢ بۆ ١٦٠ پیت بنووسە.",
    security:
      "بەستەری بانگهێشتەکەت بە شێوەیەکی پارێزراو پشکنراوە. بۆ تەواوکردنی چالاککردن، ناوت بنووسە و وشەیەکی نهێنیی بەهێز دابنێ.",
    step: "ڕێکخستنی هەژمار",
  },
  ar: {
    eyebrow: "تفعيل الحساب",
    name: "اسمك الكامل",
    nameHint: "سيظهر هذا الاسم في ملفك الشخصي، ولن يغيّر اسم شركتك.",
    invalidName: "يرجى إدخال اسم صحيح يتكون من ٢ إلى ١٦٠ حرفاً.",
    security:
      "يتم التحقق من رابط دعوتك بأمان. أدخل اسمك وأنشئ كلمة مرور قوية لإكمال تفعيل الحساب.",
    step: "إعداد الحساب",
  },
  en: {
    eyebrow: "Account activation",
    name: "Your full name",
    nameHint:
      "This is your personal profile name. It will not change your company name.",
    invalidName: "Enter a valid name between 2 and 160 characters.",
    security:
      "Your invitation is checked securely. Enter your name and create a strong password to finish activating your account.",
    step: "Account setup",
  },
};
