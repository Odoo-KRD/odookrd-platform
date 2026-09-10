import type {
  Locale,
  NotificationAdministrationKind,
  NotificationChannel,
  NotificationDeliveryStatus,
} from "@odookrd/types";
import { uiChrome } from "../ui-chrome";
import { sharedText } from "../shared";

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
    providerStatus: sharedText.ku.labels.providerStatus,
    providerStatusDescription:
      "زانیاری پارێزراوی دابینکەری پلاتفۆرم. نهێنییەکان بە تەواوی نیشان نادرێن.",
    configured: sharedText.ku.labels.configured,
    notConfigured: sharedText.ku.labels.notConfigured,
    ready: "ئامادەیە",
    notReady: "ئامادە نییە",
    enabled: uiChrome.ku.enabled,
    disabled: uiChrome.ku.disabled,
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
    testEmail: sharedText.ku.labels.testEmail,
    testEmailDescription:
      "ئیمەیڵێکی ڕاستەقینە بە هەمان دابینکەری Amazon SES ـی ئاگادارکردنەوەکان بنێرە.",
    recipient: "وەرگر",
    sendTestEmail: "ناردنی ئیمەیڵی تاقیکردنەوە",
    sendingTestEmail: "دەنێردرێت...",
    testSent: "ئیمەیڵی تاقیکردنەوە نێردرا.",
    testFailed: "ناردنی ئیمەیڵی تاقیکردنەوە سەرکەوتوو نەبوو.",
    providerMessageId: "ناسنامەی پەیامی دابینکەر",
    failureCode: "کۆدی هەڵە",
    deliveryLog: sharedText.ku.labels.deliveryLog,
    deliveryLogDescription:
      "ئاگادارکردنەوە، بانگهێشت و تاقیکردنەوەکانی دابینکەر.",
    all: "هەموو",
    company: "کۆمپانیا",
    type: sharedText.ku.labels.type,
    channel: "کەناڵ",
    status: "دۆخ",
    attempts: "هەوڵ",
    created: "دروستکراو",
    lastAttempt: "دوایین هەوڵ",
    sent: "نێردرا",
    emptyLog: "هیچ تۆماری گەیاندنێک نییە.",
    previous: uiChrome.ku.previous,
    next: uiChrome.ku.next,
    secretNotice:
      "کلیلە نهێنییەکان تەنها لە سێرڤەر دەکرێنەوە و بۆ وێبگەڕ نانێردرێن.",
    kinds: {
      NOTIFICATION: "ئاگادارکردنەوە",
      INVITATION: "بانگهێشت",
      TEST: "تاقیکردنەوە",
    },
    channels: {
      IN_APP: "ناوخۆی ئەپ",
      EMAIL: sharedText.ku.labels.EMAIL,
      WHATSAPP: sharedText.ku.labels.WHATSAPP,
    },
    statuses: {
      PENDING: sharedText.ku.status.PENDING,
      PROCESSING: sharedText.ku.status.PROCESSING,
      SENT: sharedText.ku.status.SENT,
      FAILED: sharedText.ku.status.FAILED,
      SKIPPED: sharedText.ku.status.SKIPPED,
    },
  },
  ar: {
    navigation: "الإشعارات",
    title: "إدارة الإشعارات",
    description:
      "حالة مزودي الخدمة واختبار التسليم وسجل عمليات تسليم الإشعارات.",
    providerStatus: sharedText.ar.labels.providerStatus,
    providerStatusDescription:
      "حالة إعدادات مزود المنصة المحمية. لا يتم عرض الأسرار الكاملة.",
    configured: sharedText.ar.labels.configured,
    notConfigured: sharedText.ar.labels.notConfigured,
    ready: "جاهز",
    notReady: "غير جاهز",
    enabled: uiChrome.ar.enabled,
    disabled: uiChrome.ar.disabled,
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
    testEmail: sharedText.ar.labels.testEmail,
    testEmailDescription:
      "أرسل رسالة حقيقية عبر نفس مزود Amazon SES المستخدم للإشعارات.",
    recipient: "المستلم",
    sendTestEmail: "إرسال بريد اختباري",
    sendingTestEmail: "جارٍ الإرسال...",
    testSent: "تم إرسال البريد الاختباري.",
    testFailed: "فشل إرسال البريد الاختباري.",
    providerMessageId: "معرّف رسالة المزود",
    failureCode: "رمز الخطأ",
    deliveryLog: sharedText.ar.labels.deliveryLog,
    deliveryLogDescription: "الإشعارات والدعوات واختبارات مزود الخدمة.",
    all: "الكل",
    company: "الشركة",
    type: sharedText.ar.labels.type,
    channel: "القناة",
    status: "الحالة",
    attempts: sharedText.ar.labels.attempts,
    created: "تم الإنشاء",
    lastAttempt: "آخر محاولة",
    sent: "تم الإرسال",
    emptyLog: "لا توجد سجلات تسليم.",
    previous: uiChrome.ar.previous,
    next: uiChrome.ar.next,
    secretNotice:
      "يتم فك تشفير المفاتيح السرية على الخادم فقط ولا يتم إرسالها إلى المتصفح.",
    kinds: {
      NOTIFICATION: "إشعار",
      INVITATION: "دعوة",
      TEST: "اختبار",
    },
    channels: {
      IN_APP: "داخل التطبيق",
      EMAIL: sharedText.ar.labels.EMAIL,
      WHATSAPP: sharedText.ar.labels.WHATSAPP,
    },
    statuses: {
      PENDING: sharedText.ar.status.PENDING,
      PROCESSING: sharedText.ar.status.PROCESSING,
      SENT: sharedText.ar.status.SENT,
      FAILED: sharedText.ar.status.FAILED,
      SKIPPED: sharedText.ar.status.SKIPPED,
    },
  },
  en: {
    navigation: "Notifications",
    title: "Notification administration",
    description:
      "Provider readiness, real delivery testing, and notification delivery history.",
    providerStatus: sharedText.en.labels.providerStatus,
    providerStatusDescription:
      "Protected platform-provider configuration status. Full secrets are never displayed.",
    configured: sharedText.en.labels.configured,
    notConfigured: sharedText.en.labels.notConfigured,
    ready: "Ready",
    notReady: "Not ready",
    enabled: uiChrome.en.enabled,
    disabled: uiChrome.en.disabled,
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
    testEmail: sharedText.en.labels.testEmail,
    testEmailDescription:
      "Send a real message through the same Amazon SES provider used by notifications.",
    recipient: "Recipient",
    sendTestEmail: "Send test email",
    sendingTestEmail: "Sending...",
    testSent: "The test email was sent.",
    testFailed: "The test email could not be sent.",
    providerMessageId: "Provider message ID",
    failureCode: "Failure code",
    deliveryLog: sharedText.en.labels.deliveryLog,
    deliveryLogDescription:
      "Notifications, invitations, and provider-test delivery attempts.",
    all: "All",
    company: "Company",
    type: sharedText.en.labels.type,
    channel: "Channel",
    status: "Status",
    attempts: sharedText.en.labels.attempts,
    created: sharedText.en.labels.created,
    lastAttempt: "Last attempt",
    sent: "Sent",
    emptyLog: "There are no delivery records.",
    previous: uiChrome.en.previous,
    next: uiChrome.en.next,
    secretNotice:
      "Secret keys are decrypted only on the server and are never sent to the browser.",
    kinds: {
      NOTIFICATION: "Notification",
      INVITATION: "Invitation",
      TEST: "Provider test",
    },
    channels: {
      IN_APP: "In-app",
      EMAIL: sharedText.en.labels.EMAIL,
      WHATSAPP: sharedText.en.labels.WHATSAPP,
    },
    statuses: {
      PENDING: sharedText.en.status.PENDING,
      PROCESSING: sharedText.en.status.PROCESSING,
      SENT: sharedText.en.status.SENT,
      FAILED: sharedText.en.status.FAILED,
      SKIPPED: sharedText.en.status.SKIPPED,
    },
  },
};
