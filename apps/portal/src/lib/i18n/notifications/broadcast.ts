import type { Locale } from "@odookrd/types";

export interface NotificationBroadcastDictionary {
  openComposer: string;
  logType: string;
  title: string;
  description: string;
  back: string;
  audience: string;
  allCustomers: string;
  selectedCompany: string;
  ownCompany: string;
  company: string;
  language: string;
  languages: {
    ku: string;
    ar: string;
    en: string;
  };
  notificationTitle: string;
  message: string;
  actionUrl: string;
  actionUrlHint: string;
  channels: string;
  inApp: string;
  email: string;
  whatsapp: string;
  audienceSummary: string;
  recipients: string;
  companies: string;
  emailDestinations: string;
  whatsappDestinations: string;
  activeUsersOnly: string;
  channelSettingsNotice: string;
  backgroundNotice: string;
  confirm: string;
  confirmPrefix: string;
  send: string;
  sending: string;
  sentTitle: string;
  sentDescription: string;
  duplicateDescription: string;
  noRecipients: string;
  overLimit: string;
}

export const notificationBroadcastDictionaries: Record<
  Locale,
  NotificationBroadcastDictionary
> = {
  ku: {
    openComposer: "ناردنی ئاگادارکردنەوە",
    logType: "ئاگادارکردنەوەی گشتی",
    title: "ناردنی ئاگادارکردنەوە",
    description:
      "ئاگادارکردنەوە بۆ هەموو کڕیارە چالاکەکان یان هەموو بەکارهێنەرانی کۆمپانیایەک بنێرە.",
    back: "گەڕانەوە بۆ ئاگادارکردنەوەکان",
    audience: "وەرگرەکان",
    allCustomers: "هەموو بەکارهێنەرانی چالاکی کڕیار",
    selectedCompany: "هەموو بەکارهێنەرانی کۆمپانیای دیاریکراو",
    ownCompany: "هەموو بەکارهێنەرانی کۆمپانیای من",
    company: "کۆمپانیا",
    language: "زمانی پەیام",
    languages: { ku: "کوردی", ar: "عەرەبی", en: "English" },
    notificationTitle: "ناونیشانی ئاگادارکردنەوە",
    message: "پەیام",
    actionUrl: "بەستەری ناوخۆیی",
    actionUrlHint:
      "ئارەزوومەندانە، وەک /dashboard یان /dashboard/notifications.",
    channels: "کەناڵەکان",
    inApp: "ناوخۆی پلاتفۆرم",
    email: "ئیمەیڵ",
    whatsapp: "واتسئاپ",
    audienceSummary: "پوختەی وەرگرەکان",
    recipients: "بەکارهێنەر",
    companies: "کۆمپانیا",
    emailDestinations: "ئیمەیڵ",
    whatsappDestinations: "ژمارەی واتسئاپ",
    activeUsersOnly:
      "تەنها هەژمارە چالاکەکانی کڕیار لە کۆمپانیا چالاکەکان وەردەگیرێن.",
    channelSettingsNotice:
      "ئەگەر کەناڵێک لە ڕێکخستنەکانی کۆمپانیا ناچالاک بێت، بە سەلامەتی پەڕێندراو دەبێت.",
    backgroundNotice:
      "ئاگادارکردنەوەی ناوخۆیی دەستبەجێیە؛ ئیمەیڵ و واتسئاپ لە پاشبنەما نێردرێن.",
    confirm: "پشتڕاستکردنەوە",
    confirmPrefix:
      "پشتڕاست دەکەمەوە کە ئەم ئاگادارکردنەوەیە بۆ ژمارەی دیاریکراوی وەرگرەکان بنێردرێت.",
    send: "ناردنی ئاگادارکردنەوە",
    sending: "ئاگادارکردنەوە دەنێردرێت...",
    sentTitle: "ئاگادارکردنەوە ڕیزکرا.",
    sentDescription:
      "ئاگادارکردنەوەی ناوخۆیی ئامادەیە و گەیاندنی دەرەکی لە پاشبنەما جێبەجێ دەکرێت.",
    duplicateDescription:
      "ئەم داواکارییە پێشتر ڕیزکراوە و دووبارە دروست نەکرا.",
    noRecipients: "هیچ بەکارهێنەرێکی چالاک لەم وەرگرانەدا نییە.",
    overLimit: "ژمارەی وەرگرەکان لە سنووری پاراستن زیاترە.",
  },
  ar: {
    openComposer: "إرسال إشعار",
    logType: "إشعار جماعي",
    title: "إرسال إشعار",
    description:
      "أرسل إشعاراً إلى جميع مستخدمي العملاء النشطين أو إلى جميع مستخدمي شركة محددة.",
    back: "العودة إلى الإشعارات",
    audience: "الجمهور",
    allCustomers: "جميع مستخدمي العملاء النشطين",
    selectedCompany: "جميع مستخدمي شركة محددة",
    ownCompany: "جميع مستخدمي شركتي",
    company: "الشركة",
    language: "لغة الرسالة",
    languages: { ku: "کوردی", ar: "العربية", en: "English" },
    notificationTitle: "عنوان الإشعار",
    message: "الرسالة",
    actionUrl: "رابط داخلي",
    actionUrlHint: "اختياري، مثل /dashboard أو /dashboard/notifications.",
    channels: "القنوات",
    inApp: "داخل المنصة",
    email: "البريد الإلكتروني",
    whatsapp: "واتساب",
    audienceSummary: "ملخص الجمهور",
    recipients: "مستخدمون",
    companies: "شركات",
    emailDestinations: "بريد إلكتروني",
    whatsappDestinations: "أرقام واتساب",
    activeUsersOnly:
      "يتم استهداف حسابات العملاء النشطة فقط داخل الشركات النشطة.",
    channelSettingsNotice:
      "إذا كانت قناة معطلة في إعدادات الشركة فسيتم تخطيها بأمان.",
    backgroundNotice:
      "الإشعارات داخل المنصة فورية، بينما البريد وواتساب تتم معالجتهما في الخلفية.",
    confirm: "التأكيد",
    confirmPrefix: "أؤكد إرسال هذا الإشعار إلى الجمهور المعروض.",
    send: "إرسال الإشعار",
    sending: "جارٍ إرسال الإشعار...",
    sentTitle: "تم وضع الإشعار في قائمة الإرسال.",
    sentDescription:
      "أصبح إشعار المنصة متاحاً وستتم معالجة القنوات الخارجية في الخلفية.",
    duplicateDescription:
      "تمت معالجة هذا الطلب مسبقاً ولم يتم إنشاء نسخة مكررة.",
    noRecipients: "لا يوجد مستخدمون نشطون في الجمهور المحدد.",
    overLimit: "يتجاوز الجمهور حد الأمان المسموح به.",
  },
  en: {
    openComposer: "Send notification",
    logType: "Broadcast",
    title: "Send notification",
    description:
      "Send a notification to all active customer users or every active user in one company.",
    back: "Back to notifications",
    audience: "Audience",
    allCustomers: "All active customer users",
    selectedCompany: "All users in a selected company",
    ownCompany: "All users in my company",
    company: "Company",
    language: "Message language",
    languages: { ku: "Kurdish", ar: "Arabic", en: "English" },
    notificationTitle: "Notification title",
    message: "Message",
    actionUrl: "Internal action link",
    actionUrlHint:
      "Optional, for example /dashboard or /dashboard/notifications.",
    channels: "Channels",
    inApp: "In-app",
    email: "Email",
    whatsapp: "WhatsApp",
    audienceSummary: "Audience summary",
    recipients: "Recipients",
    companies: "Companies",
    emailDestinations: "Email destinations",
    whatsappDestinations: "WhatsApp destinations",
    activeUsersOnly:
      "Only active customer accounts in active companies are targeted.",
    channelSettingsNotice:
      "If a selected channel is disabled for a company, that delivery is safely skipped.",
    backgroundNotice:
      "In-app delivery is immediate; email and WhatsApp are processed in the background.",
    confirm: "Confirmation",
    confirmPrefix:
      "I confirm sending this notification to the displayed audience.",
    send: "Send notification",
    sending: "Sending notification...",
    sentTitle: "Notification queued.",
    sentDescription:
      "In-app delivery is available and external channels will be processed in the background.",
    duplicateDescription:
      "This request was already processed and no duplicate notification was created.",
    noRecipients: "There are no active users in the selected audience.",
    overLimit: "The selected audience exceeds the broadcast safety limit.",
  },
};
