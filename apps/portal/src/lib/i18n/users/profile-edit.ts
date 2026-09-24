import type { Locale } from "@odookrd/types";

/** Labels for editing a user's details and for the platform admin profile. */
export interface UserProfileEditDictionary {
  title: string;
  description: string;
  email: string;
  displayName: string;
  displayNamePlaceholder: string;
  whatsapp: string;
  whatsappPlaceholder: string;
  whatsappHint: string;
  certificateName: string;
  certificateNamePlaceholder: string;
  save: string;
  saving: string;
  saved: string;
  invitedEmailHint: string;
  notSet: string;
  invalidEmail: string;
  invalidWhatsapp: string;
  adminProfileDescription: string;
  accountType: string;
  platformAccount: string;
  roles: string;
}

export const userProfileEditDictionaries: Record<
  Locale,
  UserProfileEditDictionary
> = {
  ku: {
    title: "زانیارییەکانی هەژمار",
    description:
      "ئیمەیڵ، ناوی پیشاندان، ژمارەی واتسئاپ و ناوی بڕوانامەی ئەم بەکارهێنەرە دەستکاری بکە.",
    email: "ئیمەیڵ",
    displayName: "ناوی پیشاندان",
    displayNamePlaceholder: "ناوی تەواو",
    whatsapp: "ژمارەی واتسئاپ",
    whatsappPlaceholder: "+9647XXXXXXXXX",
    whatsappHint: "بە شێوازی نێودەوڵەتی، بۆ نموونە +9647701234567",
    certificateName: "ناوی بڕوانامە",
    certificateNamePlaceholder: "ناو وەک دەبێت لە بڕوانامەدا پیشان بدرێت",
    save: "پاشەکەوتکردنی زانیارییەکان",
    saving: "پاشەکەوتکردن…",
    saved: "زانیارییەکان پاشەکەوت کران.",
    invitedEmailHint:
      "گۆڕینی ئیمەیڵی بەکارهێنەرێکی بانگهێشتکراو ئەو لینکانە هەڵدەوەشێنێتەوە کە پێشتر نێردراون. دوای گۆڕین، بانگهێشتەکە نوێ بکەرەوە.",
    notSet: "—",
    invalidEmail: "ئیمەیڵێکی دروست بنووسە.",
    invalidWhatsapp: "ژمارەی واتسئاپ دەبێت بە + دەست پێبکات، بۆ نموونە +9647701234567.",
    adminProfileDescription:
      "ناو، وێنە، ژمارەی واتسئاپ و زمانی هەژماری بەڕێوەبەرایەتییەکەت بەڕێوەببە.",
    accountType: "جۆری هەژمار",
    platformAccount: "هەژماری پلاتفۆرم",
    roles: "ڕۆڵەکان",
  },
  ar: {
    title: "بيانات الحساب",
    description:
      "عدّل البريد الإلكتروني واسم العرض ورقم واتساب واسم الشهادة لهذا المستخدم.",
    email: "البريد الإلكتروني",
    displayName: "اسم العرض",
    displayNamePlaceholder: "الاسم الكامل",
    whatsapp: "رقم واتساب",
    whatsappPlaceholder: "+9647XXXXXXXXX",
    whatsappHint: "بالصيغة الدولية، مثل +9647701234567",
    certificateName: "الاسم على الشهادة",
    certificateNamePlaceholder: "الاسم كما يجب أن يظهر في الشهادة",
    save: "حفظ البيانات",
    saving: "جارٍ الحفظ…",
    saved: "تم حفظ البيانات.",
    invitedEmailHint:
      "تغيير البريد الإلكتروني لمستخدم مدعو يلغي الروابط المرسلة سابقاً. بعد التغيير، أعد إنشاء الدعوة.",
    notSet: "—",
    invalidEmail: "أدخل بريداً إلكترونياً صحيحاً.",
    invalidWhatsapp: "يجب أن يبدأ رقم واتساب بـ +، مثل +9647701234567.",
    adminProfileDescription:
      "أدر اسم حساب الإدارة وصورته ورقم واتساب ولغته.",
    accountType: "نوع الحساب",
    platformAccount: "حساب المنصة",
    roles: "الأدوار",
  },
  en: {
    title: "Account details",
    description:
      "Edit this user's email, display name, WhatsApp number and certificate name.",
    email: "Email",
    displayName: "Display name",
    displayNamePlaceholder: "Full name",
    whatsapp: "WhatsApp number",
    whatsappPlaceholder: "+9647XXXXXXXXX",
    whatsappHint: "International format, for example +9647701234567",
    certificateName: "Certificate name",
    certificateNamePlaceholder: "Name as it should appear on certificates",
    save: "Save details",
    saving: "Saving…",
    saved: "Details saved.",
    invitedEmailHint:
      "Changing an invited user's email cancels the links already sent. Regenerate the invitation afterwards.",
    notSet: "—",
    invalidEmail: "Enter a valid email address.",
    invalidWhatsapp:
      "The WhatsApp number must start with +, for example +9647701234567.",
    adminProfileDescription:
      "Manage your administrator account's name, photo, WhatsApp number and language.",
    accountType: "Account type",
    platformAccount: "Platform account",
    roles: "Roles",
  },
};
