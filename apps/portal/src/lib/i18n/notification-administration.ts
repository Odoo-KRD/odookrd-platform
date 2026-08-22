import type {
  Locale,
  NotificationAdministrationKind,
  NotificationChannel,
  NotificationDeliveryStatus,
} from "@odookrd/types";

export interface NotificationAdministrationDictionary {
  navigation: string;
  title: string;
  description: string;
  providerStatus: string;
  providerStatusDescription: string;
  configured: string;
  notConfigured: string;
  ready: string;
  notReady: string;
  enabled: string;
  disabled: string;
  emailProvider: string;
  transport: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecurity: string;
  smtpUsername: string;
  smtpPassword: string;
  region: string;
  senderEmail: string;
  senderName: string;
  replyTo: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  testEmail: string;
  testEmailDescription: string;
  recipient: string;
  sendTestEmail: string;
  sendingTestEmail: string;
  testSent: string;
  testFailed: string;
  providerMessageId: string;
  failureCode: string;
  deliveryLog: string;
  deliveryLogDescription: string;
  all: string;
  company: string;
  type: string;
  channel: string;
  status: string;
  attempts: string;
  created: string;
  lastAttempt: string;
  sent: string;
  emptyLog: string;
  previous: string;
  next: string;
  secretNotice: string;
  kinds: Record<NotificationAdministrationKind, string>;
  channels: Record<NotificationChannel, string>;
  statuses: Record<NotificationDeliveryStatus, string>;
}

export const notificationAdministrationDictionaries: Record<
  Locale,
  NotificationAdministrationDictionary
> = {
  ku: {
    navigation: "ئاگادارکردنەوەکان",
    title: "بەڕێوەبردنی ئاگادارکردنەوە",
    description:
      "دۆخی دابینکەر، تاقیکردنەوەی گەیاندن و مێژووی گەیاندنی ئاگادارکردنەوەکان.",
    providerStatus: "دۆخی دابینکەر",
    providerStatusDescription:
      "زانیاری پارێزراوی دابینکەری پلاتفۆرم. نهێنییەکان بە تەواوی نیشان نادرێن.",
    configured: "ڕێکخراوە",
    notConfigured: "ڕێکنەخراوە",
    ready: "ئامادەیە",
    notReady: "ئامادە نییە",
    enabled: "چالاک",
    disabled: "ناچالاک",
    emailProvider: "دابینکەری ئیمەیڵ",
    transport: "شێوازی گەیاندن",
    smtpHost: "سێرڤەری SES SMTP",
    smtpPort: "پۆرتی SMTP",
    smtpSecurity: "پاراستنی SMTP",
    smtpUsername: "ناوی بەکارهێنەری SMTP",
    smtpPassword: "وشەی نهێنی SMTP",
    region: "ناوچە",
    senderEmail: "ئیمەیڵی نێرەر",
    senderName: "ناوی نێرەر",
    replyTo: "Reply-to",
    accessKeyId: "SES Access Key ID",
    secretAccessKey: "SES Secret Access Key",
    sessionToken: "SES Session Token",
    testEmail: "تاقیکردنەوەی ئیمەیڵ",
    testEmailDescription:
      "ئیمەیڵێکی ڕاستەقینە بە هەمان دابینکەری Amazon SES ـی ئاگادارکردنەوەکان بنێرە.",
    recipient: "وەرگر",
    sendTestEmail: "ناردنی ئیمەیڵی تاقیکردنەوە",
    sendingTestEmail: "دەنێردرێت...",
    testSent: "ئیمەیڵی تاقیکردنەوە نێردرا.",
    testFailed: "ناردنی ئیمەیڵی تاقیکردنەوە سەرکەوتوو نەبوو.",
    providerMessageId: "ناسنامەی پەیامی دابینکەر",
    failureCode: "کۆدی هەڵە",
    deliveryLog: "مێژووی گەیاندن",
    deliveryLogDescription:
      "ئاگادارکردنەوە، بانگهێشت و تاقیکردنەوەکانی دابینکەر.",
    all: "هەموو",
    company: "کۆمپانیا",
    type: "جۆر",
    channel: "کەناڵ",
    status: "دۆخ",
    attempts: "هەوڵ",
    created: "دروستکراو",
    lastAttempt: "دوایین هەوڵ",
    sent: "نێردرا",
    emptyLog: "هیچ تۆماری گەیاندنێک نییە.",
    previous: "پێشوو",
    next: "دواتر",
    secretNotice:
      "کلیلە نهێنییەکان تەنها لە سێرڤەر دەکرێنەوە و بۆ وێبگەڕ نانێردرێن.",
    kinds: {
      NOTIFICATION: "ئاگادارکردنەوە",
      INVITATION: "بانگهێشت",
      TEST: "تاقیکردنەوە",
    },
    channels: {
      IN_APP: "ناوخۆی ئەپ",
      EMAIL: "ئیمەیڵ",
      WHATSAPP: "واتسئاپ",
    },
    statuses: {
      PENDING: "چاوەڕوان",
      PROCESSING: "لە جێبەجێکردندایە",
      SENT: "نێردرا",
      FAILED: "سەرکەوتوو نەبوو",
      SKIPPED: "پەڕێنرا",
    },
  },
  ar: {
    navigation: "الإشعارات",
    title: "إدارة الإشعارات",
    description:
      "حالة مزودي الخدمة واختبار التسليم وسجل عمليات تسليم الإشعارات.",
    providerStatus: "حالة المزود",
    providerStatusDescription:
      "حالة إعدادات مزود المنصة المحمية. لا يتم عرض الأسرار الكاملة.",
    configured: "مُعد",
    notConfigured: "غير مُعد",
    ready: "جاهز",
    notReady: "غير جاهز",
    enabled: "مفعّل",
    disabled: "معطّل",
    emailProvider: "مزود البريد",
    transport: "طريقة الإرسال",
    smtpHost: "خادم SES SMTP",
    smtpPort: "منفذ SMTP",
    smtpSecurity: "أمان SMTP",
    smtpUsername: "اسم مستخدم SMTP",
    smtpPassword: "كلمة مرور SMTP",
    region: "المنطقة",
    senderEmail: "بريد المرسل",
    senderName: "اسم المرسل",
    replyTo: "Reply-to",
    accessKeyId: "SES Access Key ID",
    secretAccessKey: "SES Secret Access Key",
    sessionToken: "SES Session Token",
    testEmail: "اختبار البريد",
    testEmailDescription:
      "أرسل رسالة حقيقية عبر نفس مزود Amazon SES المستخدم للإشعارات.",
    recipient: "المستلم",
    sendTestEmail: "إرسال بريد اختباري",
    sendingTestEmail: "جارٍ الإرسال...",
    testSent: "تم إرسال البريد الاختباري.",
    testFailed: "فشل إرسال البريد الاختباري.",
    providerMessageId: "معرّف رسالة المزود",
    failureCode: "رمز الخطأ",
    deliveryLog: "سجل التسليم",
    deliveryLogDescription: "الإشعارات والدعوات واختبارات مزود الخدمة.",
    all: "الكل",
    company: "الشركة",
    type: "النوع",
    channel: "القناة",
    status: "الحالة",
    attempts: "المحاولات",
    created: "تم الإنشاء",
    lastAttempt: "آخر محاولة",
    sent: "تم الإرسال",
    emptyLog: "لا توجد سجلات تسليم.",
    previous: "السابق",
    next: "التالي",
    secretNotice:
      "يتم فك تشفير المفاتيح السرية على الخادم فقط ولا يتم إرسالها إلى المتصفح.",
    kinds: {
      NOTIFICATION: "إشعار",
      INVITATION: "دعوة",
      TEST: "اختبار",
    },
    channels: {
      IN_APP: "داخل التطبيق",
      EMAIL: "البريد الإلكتروني",
      WHATSAPP: "واتساب",
    },
    statuses: {
      PENDING: "قيد الانتظار",
      PROCESSING: "قيد المعالجة",
      SENT: "تم الإرسال",
      FAILED: "فشل",
      SKIPPED: "تم التخطي",
    },
  },
  en: {
    navigation: "Notifications",
    title: "Notification administration",
    description:
      "Provider readiness, real delivery testing, and notification delivery history.",
    providerStatus: "Provider status",
    providerStatusDescription:
      "Protected platform-provider configuration status. Full secrets are never displayed.",
    configured: "Configured",
    notConfigured: "Not configured",
    ready: "Ready",
    notReady: "Not ready",
    enabled: "Enabled",
    disabled: "Disabled",
    emailProvider: "Email provider",
    transport: "SES transport",
    smtpHost: "SES SMTP server",
    smtpPort: "SMTP port",
    smtpSecurity: "SMTP security",
    smtpUsername: "SMTP username",
    smtpPassword: "SMTP password",
    region: "Region",
    senderEmail: "Sender email",
    senderName: "Sender name",
    replyTo: "Reply-to",
    accessKeyId: "SES Access Key ID",
    secretAccessKey: "SES Secret Access Key",
    sessionToken: "SES Session Token",
    testEmail: "Test email",
    testEmailDescription:
      "Send a real message through the same Amazon SES provider used by notifications.",
    recipient: "Recipient",
    sendTestEmail: "Send test email",
    sendingTestEmail: "Sending...",
    testSent: "The test email was sent.",
    testFailed: "The test email could not be sent.",
    providerMessageId: "Provider message ID",
    failureCode: "Failure code",
    deliveryLog: "Delivery log",
    deliveryLogDescription:
      "Notifications, invitations, and provider-test delivery attempts.",
    all: "All",
    company: "Company",
    type: "Type",
    channel: "Channel",
    status: "Status",
    attempts: "Attempts",
    created: "Created",
    lastAttempt: "Last attempt",
    sent: "Sent",
    emptyLog: "There are no delivery records.",
    previous: "Previous",
    next: "Next",
    secretNotice:
      "Secret keys are decrypted only on the server and are never sent to the browser.",
    kinds: {
      NOTIFICATION: "Notification",
      INVITATION: "Invitation",
      TEST: "Provider test",
    },
    channels: {
      IN_APP: "In-app",
      EMAIL: "Email",
      WHATSAPP: "WhatsApp",
    },
    statuses: {
      PENDING: "Pending",
      PROCESSING: "Processing",
      SENT: "Sent",
      FAILED: "Failed",
      SKIPPED: "Skipped",
    },
  },
};
