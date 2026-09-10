import type { Locale } from "@odookrd/types";

import { uiChrome } from "../ui-chrome";

import type { SettingsDictionary } from "../types";
import { sharedText } from "../shared";

export type { SettingsDictionary } from "../types";

const en = {
  title: "Settings",
  description: "Manage general, theme, company, and notification settings.",
  platformScope: "Platform settings",
  companyScope: "Company settings",
  platformDescription: "These values are the defaults for every company.",
  companyDescription:
    "Company values override the platform defaults where allowed.",
  selectScope: "Settings scope",
  platformDefaults: "Platform defaults",
  save: "Save settings",
  saving: sharedText.en.actions.saving,
  saved: "Settings saved successfully.",
  configured: sharedText.en.labels.configured,
  notConfigured: sharedText.en.labels.notConfigured,
  clearSecret: "Clear current secret",
  secretPlaceholder: "Leave blank to preserve the current value",
  readOnly: "Read only",
  inheritedNotice: "This value is inherited from a higher scope.",
  categories: {
    general: "General",
    theme: "Theme",
    companies: "Companies",
    notifications: "Notifications",
    helpdesk: "Helpdesk",
    trainings: "E-Learning",
    files: "File Storage",
  },
  categoryDescriptions: {
    general: "Site title, default language, and timezone.",
    theme: "Default font and appearance options.",
    companies: "Company account limits and policies.",
    notifications: "In-app, Amazon SES, and WhatsApp API configuration.",
    helpdesk: "Helpdesk settings will be added with that module.",
    trainings: "Course, lesson, progress, quiz and certificate settings.",
    files: "Platform-wide file storage, upload limits and allowed file types.",
  },
  sources: {
    DEFAULT: "Default",
    PLATFORM: "Platform",
    COMPANY: "Company",
  },
  localeOptions: {
    ku: sharedText.en.languages.ku,
    ar: sharedText.en.languages.ar,
    en: sharedText.en.languages.en,
  },
  booleanOptions: {
    enabled: uiChrome.en.enabled,
    disabled: uiChrome.en.disabled,
  },
  fields: {
    "general.site_title": {
      label: "Site title",
      description: "Platform name shown in page titles and screens.",
    },
    "general.default_locale": {
      label: "Default language",
      description: "Initial language for new visitors.",
    },
    "general.timezone": {
      label: "Timezone",
      description: "IANA name such as Asia/Baghdad.",
    },
    "theme.default_font": {
      label: "Default system font",
      description: "Default font used throughout the interface.",
    },
    "companies.max_users_per_company": {
      label: "Maximum users per company",
      description: "Counts invited, active, and suspended company accounts.",
    },
    "notifications.in_app.enabled": {
      label: "In-app notifications",
      description: "Show notifications inside the platform.",
    },
    "notifications.email.enabled": {
      label: "Email notifications",
      description: "Send notification email through Amazon SES.",
    },
    "notifications.email.provider": {
      label: "Email provider",
      description: "Configured email delivery provider.",
    },
    "notifications.email.amazon_ses.region": {
      label: "Amazon SES region",
      description: "For example, eu-west-1.",
    },
    "notifications.email.amazon_ses.transport": {
      label: "SES transport",
      description: "Choose between the SES API and SES SMTP.",
    },
    "notifications.email.amazon_ses.smtp_port": {
      label: "SES SMTP port",
      description: "Usually 587 with STARTTLS.",
    },
    "notifications.email.amazon_ses.smtp_security": {
      label: "SES SMTP security",
      description: "STARTTLS for port 587 or TLS for port 465.",
    },
    "notifications.email.amazon_ses.smtp_username": {
      label: "SES SMTP username",
      description: "SMTP username stored as an encrypted platform secret.",
    },
    "notifications.email.amazon_ses.smtp_password": {
      label: "SES SMTP password",
      description: "SMTP password stored encrypted and never displayed again.",
    },
    "notifications.email.amazon_ses.access_key_id": {
      label: "SES Access Key ID",
      description: "AWS IAM access-key identifier.",
    },
    "notifications.email.amazon_ses.secret_access_key": {
      label: "SES Secret Access Key",
      description: "AWS secret key; it is never shown again.",
    },
    "notifications.email.amazon_ses.session_token": {
      label: "SES Session Token",
      description: "Only for temporary AWS credentials.",
    },
    "notifications.email.sender_email": {
      label: "Sender email",
      description: "A verified sender address in SES.",
    },
    "notifications.email.sender_name": {
      label: "Sender name",
      description: "Display name used on outgoing email.",
    },
    "notifications.email.reply_to": {
      label: "Reply-to address",
      description: "Address that receives email replies.",
    },
    "notifications.whatsapp.enabled": {
      label: "WhatsApp notifications",
      description: "Send notifications through the WhatsApp API.",
    },
    "notifications.whatsapp.api_url": {
      label: "WhatsApp API URL",
      description: "HTTPS base URL for the provider API.",
    },
    "notifications.whatsapp.phone_number_id": {
      label: "Phone Number ID",
      description: "WhatsApp sending-number identifier.",
    },
    "notifications.whatsapp.business_account_id": {
      label: "Business Account ID",
      description: "WhatsApp business account identifier.",
    },
    "notifications.whatsapp.access_token": {
      label: "WhatsApp Access Token",
      description: "Secret API token; it is never shown again.",
    },
    "notifications.whatsapp.webhook_verify_token": {
      label: "Webhook Verify Token",
      description: "Secret used to verify webhook setup.",
    },
  },
} satisfies SettingsDictionary;

const ku = {
  title: "ڕێکخستنەکان",
  description: "ڕێکخستنە گشتی، ڕووکار، کۆمپانیا و ئاگادارکردنەوەکان بەڕێوەببە.",
  platformScope: "ڕێکخستنەکانی پلاتفۆرم",
  companyScope: "ڕێکخستنەکانی کۆمپانیا",
  platformDescription: "ئەم بەهایانە بنەمای هەموو کۆمپانیاکانن.",
  companyDescription: "بەها تایبەتەکان لەسەر بنەمای پلاتفۆرم زاڵ دەبن.",
  selectScope: "مەودای ڕێکخستن",
  platformDefaults: "بنەمای پلاتفۆرم",
  save: "پاشەکەوتکردنی ڕێکخستنەکان",
  saving: sharedText.ku.actions.saving,
  saved: "ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران.",
  configured: sharedText.ku.labels.configured,
  notConfigured: "ڕێک نەخراوە",
  clearSecret: "سڕینەوەی نهێنی هەنووکەیی",
  secretPlaceholder: "بە بەتاڵی بهێڵەرەوە بۆ پاراستنی بەهای هەنووکەیی",
  readOnly: "تەنها بۆ بینین",
  inheritedNotice: "ئەم بەهایە لە ڕێکخستنەکانی سەرەوە وەرگیراوە.",
  categories: {
    general: "گشتی",
    theme: "ڕووکار",
    companies: "کۆمپانیاکان",
    notifications: "ئاگادارکردنەوەکان",
    helpdesk: "یارمەتی",
    trainings: "فێرکاری ئۆنلاین",
    files: "هەڵگرتنی فایل",
  },
  categoryDescriptions: {
    general: "ناوی ماڵپەڕ، زمانی بنەڕەتی و کاتی ناوچەیی.",
    theme: "فۆنت و هەڵبژاردەکانی ڕووکار.",
    companies: "سنوور و سیاسەتەکانی کۆمپانیا.",
    notifications: "ناوئەپ، Amazon SES و WhatsApp API.",
    helpdesk: "ڕێکخستنەکانی یارمەتی لە قۆناغی داهاتوودا.",
    trainings: "ڕێکخستنەکانی کۆرس، وانە، پێشکەوتن، تاقیکردنەوە و بڕوانامە.",
    files: "هەڵگرتنی فایل، سنووری بارکردن و جۆرە ڕێگەپێدراوەکان.",
  },
  sources: {
    DEFAULT: "بنەڕەت",
    PLATFORM: "پلاتفۆرم",
    COMPANY: "کۆمپانیا",
  },
  localeOptions: {
    ku: sharedText.ku.languages.ku,
    ar: sharedText.ku.languages.ar,
    en: sharedText.ku.languages.en,
  },
  booleanOptions: {
    enabled: uiChrome.ku.enabled,
    disabled: uiChrome.ku.disabled,
  },
  fields: {
    "general.site_title": {
      label: "ناوی ماڵپەڕ",
      description: "ناوی پلاتفۆرم لە ناونیشان و پەڕەکاندا.",
    },
    "general.default_locale": {
      label: "زمانی بنەڕەتی",
      description: "زمانی بنەڕەتی بۆ سەردانکەرانی نوێ.",
    },
    "general.timezone": {
      label: "کاتی ناوچەیی",
      description: "ناوی IANA وەک Asia/Baghdad.",
    },
    "theme.default_font": {
      label: "فۆنتی بنەڕەتی",
      description: "فۆنتی بنەڕەتی ڕووکارەکە.",
    },
    "companies.max_users_per_company": {
      label: "زۆرترین بەکارهێنەر بۆ کۆمپانیا",
      description: "هەموو هەژمارە بانگهێشتکراو و چالاکەکان دەژمێردرێن.",
    },
    "notifications.in_app.enabled": {
      label: "ئاگادارکردنەوەی ناوئەپ",
      description: "ئاگادارکردنەوە لە ناو پلاتفۆرمدا.",
    },
    "notifications.email.enabled": {
      label: "ئاگادارکردنەوەی ئیمەیڵ",
      description: "ناردنی ئیمەیڵ بە Amazon SES.",
    },
    "notifications.email.provider": {
      label: "دابینکەری ئیمەیڵ",
      description: "دابینکەری پشتگیریکراو.",
    },
    "notifications.email.amazon_ses.region": {
      label: "ناوچەی Amazon SES",
      description: "نموونە: eu-west-1.",
    },
    "notifications.email.amazon_ses.transport": {
      label: "شێوازی گەیاندنی SES",
      description: "هەڵبژێرە لە نێوان SES API و SES SMTP.",
    },
    "notifications.email.amazon_ses.smtp_port": {
      label: "پۆرتی SES SMTP",
      description: "بۆ STARTTLS بە شێوەی ئاسایی 587.",
    },
    "notifications.email.amazon_ses.smtp_security": {
      label: "پاراستنی SES SMTP",
      description: "STARTTLS بۆ پۆرتی 587 یان TLS بۆ پۆرتی 465.",
    },
    "notifications.email.amazon_ses.smtp_username": {
      label: "ناوی بەکارهێنەری SES SMTP",
      description: "ناوی بەکارهێنەری SMTP؛ بە نهێنی پارێزراوە.",
    },
    "notifications.email.amazon_ses.smtp_password": {
      label: "وشەی نهێنی SES SMTP",
      description: "وشەی نهێنی SMTP؛ دووبارە پیشان نادرێتەوە.",
    },
    "notifications.email.amazon_ses.access_key_id": {
      label: "SES Access Key ID",
      description: "کلیلی دەستگەیشتنی AWS IAM.",
    },
    "notifications.email.amazon_ses.secret_access_key": {
      label: "SES Secret Access Key",
      description: "کلیلی نهێنی AWS؛ دووبارە پیشان نادرێتەوە.",
    },
    "notifications.email.amazon_ses.session_token": {
      label: "SES Session Token",
      description: "تەنها بۆ ناسنامە کاتییەکان.",
    },
    "notifications.email.sender_email": {
      label: "ئیمەیڵی نێرەر",
      description: "ناونیشانی پشتڕاستکراوە لە SES.",
    },
    "notifications.email.sender_name": {
      label: "ناوی نێرەر",
      description: "ناوی پیشاندراو لە ئیمەیڵەکاندا.",
    },
    "notifications.email.reply_to": {
      label: "Reply-to",
      description: "ناونیشانی وەرگرتنی وەڵامەکان.",
    },
    "notifications.whatsapp.enabled": {
      label: "ئاگادارکردنەوەی WhatsApp",
      description: "ناردنی پەیام بە WhatsApp API.",
    },
    "notifications.whatsapp.api_url": {
      label: "WhatsApp API URL",
      description: "بنەمای HTTPS بۆ API.",
    },
    "notifications.whatsapp.phone_number_id": {
      label: "Phone Number ID",
      description: "ناسنامەی ژمارەی WhatsApp.",
    },
    "notifications.whatsapp.business_account_id": {
      label: "Business Account ID",
      description: "ناسنامەی هەژماری بازرگانی.",
    },
    "notifications.whatsapp.access_token": {
      label: "WhatsApp Access Token",
      description: "تۆکنی نهێنی API؛ دووبارە پیشان نادرێتەوە.",
    },
    "notifications.whatsapp.webhook_verify_token": {
      label: "Webhook Verify Token",
      description: "تۆکنی پشتڕاستکردنەوەی webhook.",
    },
  },
} satisfies SettingsDictionary;

const ar = {
  title: "الإعدادات",
  description: "إدارة الإعدادات العامة والمظهر والشركات والإشعارات.",
  platformScope: "إعدادات المنصة",
  companyScope: "إعدادات الشركة",
  platformDescription: "هذه القيم هي الإعدادات الافتراضية لجميع الشركات.",
  companyDescription: "تتجاوز قيم الشركة الإعدادات الافتراضية للمنصة.",
  selectScope: "نطاق الإعدادات",
  platformDefaults: "إعدادات المنصة الافتراضية",
  save: "حفظ الإعدادات",
  saving: sharedText.ar.actions.saving,
  saved: "تم حفظ الإعدادات بنجاح.",
  configured: "تم الإعداد",
  notConfigured: "غير معدّ",
  clearSecret: "حذف السر الحالي",
  secretPlaceholder: "اتركه فارغاً للاحتفاظ بالقيمة الحالية",
  readOnly: "للقراءة فقط",
  inheritedNotice: "هذه القيمة موروثة من نطاق أعلى.",
  categories: {
    general: "عام",
    theme: "المظهر",
    companies: "الشركات",
    notifications: "الإشعارات",
    helpdesk: "مكتب المساعدة",
    trainings: "التعلّم الإلكتروني",
    files: "تخزين الملفات",
  },
  categoryDescriptions: {
    general: "عنوان الموقع واللغة والمنطقة الزمنية الافتراضية.",
    theme: "الخط وخيارات المظهر الأساسية.",
    companies: "حدود وسياسات حسابات الشركات.",
    notifications: "داخل التطبيق وAmazon SES وWhatsApp API.",
    helpdesk: "إعدادات مكتب المساعدة ستضاف في مرحلة لاحقة.",
    trainings: "إعدادات الدورات والدروس والتقدم والاختبارات والشهادات.",
    files: "تخزين ملفات المنصة وحدود الرفع وأنواع الملفات المسموحة.",
  },
  sources: {
    DEFAULT: "افتراضي",
    PLATFORM: "المنصة",
    COMPANY: "الشركة",
  },
  localeOptions: {
    ku: sharedText.ar.languages.ku,
    ar: sharedText.ar.languages.ar,
    en: sharedText.ar.languages.en,
  },
  booleanOptions: {
    enabled: uiChrome.ar.enabled,
    disabled: uiChrome.ar.disabled,
  },
  fields: {
    "general.site_title": {
      label: "عنوان الموقع",
      description: "اسم المنصة في العناوين والصفحات.",
    },
    "general.default_locale": {
      label: "اللغة الافتراضية",
      description: "اللغة الافتراضية للزوار الجدد.",
    },
    "general.timezone": {
      label: "المنطقة الزمنية",
      description: "اسم IANA مثل Asia/Baghdad.",
    },
    "theme.default_font": {
      label: "الخط الافتراضي",
      description: "الخط الافتراضي لواجهة النظام.",
    },
    "companies.max_users_per_company": {
      label: "الحد الأقصى للمستخدمين لكل شركة",
      description: "يشمل الحسابات المدعوة والنشطة والموقوفة.",
    },
    "notifications.in_app.enabled": {
      label: "إشعارات داخل التطبيق",
      description: "عرض الإشعارات داخل المنصة.",
    },
    "notifications.email.enabled": {
      label: "إشعارات البريد الإلكتروني",
      description: "إرسال البريد بواسطة Amazon SES.",
    },
    "notifications.email.provider": {
      label: "مزود البريد",
      description: "مزود البريد المدعوم.",
    },
    "notifications.email.amazon_ses.region": {
      label: "منطقة Amazon SES",
      description: "مثال: eu-west-1.",
    },
    "notifications.email.amazon_ses.transport": {
      label: "طريقة إرسال SES",
      description: "اختر بين SES API وSES SMTP.",
    },
    "notifications.email.amazon_ses.smtp_port": {
      label: "منفذ SES SMTP",
      description: "عادةً 587 مع STARTTLS.",
    },
    "notifications.email.amazon_ses.smtp_security": {
      label: "أمان SES SMTP",
      description: "STARTTLS للمنفذ 587 أو TLS للمنفذ 465.",
    },
    "notifications.email.amazon_ses.smtp_username": {
      label: "اسم مستخدم SES SMTP",
      description: "اسم مستخدم SMTP محفوظ بشكل مشفر.",
    },
    "notifications.email.amazon_ses.smtp_password": {
      label: "كلمة مرور SES SMTP",
      description: "كلمة مرور SMTP مشفرة ولن يتم عرضها مرة أخرى.",
    },
    "notifications.email.amazon_ses.access_key_id": {
      label: "SES Access Key ID",
      description: "معرّف مفتاح AWS IAM.",
    },
    "notifications.email.amazon_ses.secret_access_key": {
      label: "SES Secret Access Key",
      description: "مفتاح AWS السري؛ لن يُعرض مرة أخرى.",
    },
    "notifications.email.amazon_ses.session_token": {
      label: "SES Session Token",
      description: "لبيانات الاعتماد المؤقتة فقط.",
    },
    "notifications.email.sender_email": {
      label: "بريد المرسل",
      description: "عنوان مرسل موثق في SES.",
    },
    "notifications.email.sender_name": {
      label: "اسم المرسل",
      description: "الاسم الظاهر في الرسائل.",
    },
    "notifications.email.reply_to": {
      label: "عنوان الرد",
      description: "العنوان الذي يستقبل الردود.",
    },
    "notifications.whatsapp.enabled": {
      label: "إشعارات WhatsApp",
      description: "إرسال الرسائل عبر WhatsApp API.",
    },
    "notifications.whatsapp.api_url": {
      label: "WhatsApp API URL",
      description: "عنوان HTTPS الأساسي للواجهة.",
    },
    "notifications.whatsapp.phone_number_id": {
      label: "Phone Number ID",
      description: "معرّف رقم WhatsApp.",
    },
    "notifications.whatsapp.business_account_id": {
      label: "Business Account ID",
      description: "معرّف حساب الأعمال.",
    },
    "notifications.whatsapp.access_token": {
      label: "WhatsApp Access Token",
      description: "رمز API السري؛ لن يُعرض مرة أخرى.",
    },
    "notifications.whatsapp.webhook_verify_token": {
      label: "Webhook Verify Token",
      description: "رمز التحقق من webhook.",
    },
  },
} satisfies SettingsDictionary;

export const settingsDictionaries: Record<Locale, SettingsDictionary> = {
  ku,
  ar,
  en,
};
