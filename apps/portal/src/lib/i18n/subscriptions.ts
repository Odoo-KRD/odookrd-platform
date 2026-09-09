import type { Locale, SubscriptionTerm } from "@odookrd/types";

export interface SubscriptionsDictionary {
  title: string;
  description: string;
  none: string;
  noneDescription: string;
  notSubscriptionBilled: string;
  term: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  accessEndsAt: string;
  daysRemaining: string;
  gracePeriodDays: string;
  autoRenew: string;
  cancelAtPeriodEnd: string;
  externalBillingRef: string;
  externalBillingRefHint: string;
  startsAt: string;
  endsAt: string;
  endsAtHint: string;
  trial: string;
  create: string;
  creating: string;
  update: string;
  updating: string;
  renew: string;
  renewing: string;
  renewHint: string;
  cancel: string;
  cancelling: string;
  cancelAtPeriodEndOption: string;
  cancelImmediately: string;
  reason: string;
  history: string;
  historyEmpty: string;
  sequence: string;
  source: string;
  expired: string;
  inGrace: string;
  yes: string;
  no: string;
  requestRenewal: string;
  requestRenewalHint: string;
  requestRenewalSubmit: string;
  requestRenewalSubmitting: string;
  requestPending: string;
  withdrawRequest: string;
  renewalQueue: string;
  renewalQueueDescription: string;
  renewalQueueEmpty: string;
  requestedBy: string;
  requestedAt: string;
  approve: string;
  approving: string;
  reject: string;
  rejecting: string;
  reviewNote: string;
  note: string;
  company: string;
  service: string;
  billingModel: string;
  billingModelHint: string;
  billingModelLabels: Record<"PERPETUAL" | "SUBSCRIPTION", string>;
  termLabels: Record<SubscriptionTerm, string>;
  statusLabels: Record<string, string>;
  sourceLabels: Record<string, string>;
}

const en: SubscriptionsDictionary = {
  title: "Subscription",
  description: "Manage the billing term and renewal for this service.",
  none: "No subscription",
  noneDescription:
    "This service is billed by subscription but does not have one yet.",
  notSubscriptionBilled:
    "This service is perpetual, so it does not use a subscription.",
  term: "Term",
  status: "Status",
  periodStart: "Period start",
  periodEnd: "Period end",
  accessEndsAt: "Access ends",
  daysRemaining: "Days remaining",
  gracePeriodDays: "Grace period (days)",
  autoRenew: "Auto renew",
  cancelAtPeriodEnd: "Cancel at period end",
  externalBillingRef: "Billing reference",
  externalBillingRefHint: "Optional reference to the invoice in Odoo.",
  startsAt: "Starts",
  endsAt: "Ends",
  endsAtHint: "Required for a custom term only.",
  trial: "Start as trial",
  create: "Create subscription",
  creating: "Creating…",
  update: "Save changes",
  updating: "Saving…",
  renew: "Renew",
  renewing: "Renewing…",
  renewHint:
    "Extends by one term from the current period end, or from today if it has already lapsed.",
  cancel: "Cancel subscription",
  cancelling: "Cancelling…",
  cancelAtPeriodEndOption: "Let the paid period finish",
  cancelImmediately: "End access immediately",
  reason: "Reason",
  history: "Period history",
  historyEmpty: "No periods recorded yet.",
  sequence: "#",
  source: "Source",
  expired: "Expired",
  inGrace: "In grace period",
  yes: "Yes",
  no: "No",
  requestRenewal: "Request renewal",
  requestRenewalHint:
    "Ask an operator to extend this subscription. They will review and confirm.",
  requestRenewalSubmit: "Send request",
  requestRenewalSubmitting: "Sending…",
  requestPending: "A renewal request is awaiting review.",
  withdrawRequest: "Withdraw request",
  renewalQueue: "Renewal requests",
  renewalQueueDescription: "Customer requests awaiting review.",
  renewalQueueEmpty: "No renewal requests are awaiting review.",
  requestedBy: "Requested by",
  requestedAt: "Requested",
  approve: "Approve and renew",
  approving: "Approving…",
  reject: "Reject",
  rejecting: "Rejecting…",
  reviewNote: "Review note",
  note: "Note",
  company: "Company",
  service: "Service",
  billingModel: "Billing model",
  billingModelHint: "Subscription-billed services expire unless renewed.",
  billingModelLabels: {
    PERPETUAL: "Perpetual",
    SUBSCRIPTION: "Subscription",
  },
  termLabels: {
    MONTHLY: "Monthly",
    QUARTERLY: "Every 3 months",
    SEMI_ANNUAL: "Every 6 months",
    ANNUAL: "Yearly",
    BIENNIAL: "Every 2 years",
    TRIENNIAL: "Every 3 years",
    CUSTOM: "Custom dates",
  },
  statusLabels: {
    TRIAL: "Trial",
    ACTIVE: "Active",
    GRACE: "Grace period",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
    PERPETUAL: "Perpetual",
    ASSIGNMENT_INACTIVE: "Service inactive",
    SUBSCRIPTION_MISSING: "No subscription",
  },
  sourceLabels: {
    INITIAL: "Initial",
    MANUAL_RENEWAL: "Manual renewal",
    AUTO_RENEWAL: "Automatic renewal",
    ADMIN_ADJUSTMENT: "Adjustment",
  },
};

const ku: SubscriptionsDictionary = {
  title: "بەشداریکردن",
  description: "بەڕێوەبردنی ماوە و نوێکردنەوەی ئەم خزمەتگوزاریە.",
  none: "بەشداریکردن نییە",
  noneDescription:
    "ئەم خزمەتگوزاریە بە بەشداریکردن دەژمێردرێت بەڵام هێشتا یەکێکی نییە.",
  notSubscriptionBilled:
    "ئەم خزمەتگوزاریە هەمیشەییە، بۆیە بەشداریکردنی پێویست نییە.",
  term: "ماوە",
  status: "دۆخ",
  periodStart: "دەستپێکی ماوە",
  periodEnd: "کۆتایی ماوە",
  accessEndsAt: "کۆتایی دەستگەیشتن",
  daysRemaining: "ڕۆژی ماوە",
  gracePeriodDays: "ماوەی خۆشگوزەرانی (ڕۆژ)",
  autoRenew: "نوێکردنەوەی خۆکار",
  cancelAtPeriodEnd: "هەڵوەشاندنەوە لە کۆتایی ماوە",
  externalBillingRef: "ژمارەی پسوڵە",
  externalBillingRefHint: "ئاماژەیەکی ئارەزوومەندانە بۆ پسوڵەکە لە Odoo.",
  startsAt: "دەستپێک",
  endsAt: "کۆتایی",
  endsAtHint: "تەنها بۆ ماوەی تایبەت پێویستە.",
  trial: "وەک تاقیکردنەوە دەستپێبکە",
  create: "دروستکردنی بەشداریکردن",
  creating: "دروستدەکرێت…",
  update: "پاشەکەوتکردن",
  updating: "پاشەکەوت دەکرێت…",
  renew: "نوێکردنەوە",
  renewing: "نوێدەکرێتەوە…",
  renewHint:
    "بە یەک ماوە درێژ دەکرێتەوە لە کۆتایی ماوەی ئێستا، یان لە ئەمڕۆوە ئەگەر بەسەرچووبێت.",
  cancel: "هەڵوەشاندنەوەی بەشداریکردن",
  cancelling: "هەڵدەوەشێتەوە…",
  cancelAtPeriodEndOption: "با ماوەی دراو تەواو بێت",
  cancelImmediately: "دەستبەجێ کۆتایی پێبهێنە",
  reason: "هۆکار",
  history: "مێژووی ماوەکان",
  historyEmpty: "هێشتا هیچ ماوەیەک تۆمار نەکراوە.",
  sequence: "#",
  source: "سەرچاوە",
  expired: "بەسەرچووە",
  inGrace: "لە ماوەی خۆشگوزەرانیدا",
  yes: "بەڵێ",
  no: "نەخێر",
  requestRenewal: "داواکردنی نوێکردنەوە",
  requestRenewalHint:
    "داوا لە بەڕێوەبەر بکە بۆ درێژکردنەوەی ئەم بەشداریکردنە. پێداچوونەوەی بۆ دەکرێت.",
  requestRenewalSubmit: "ناردنی داواکاری",
  requestRenewalSubmitting: "دەنێردرێت…",
  requestPending: "داواکارییەکی نوێکردنەوە چاوەڕێی پێداچوونەوەیە.",
  withdrawRequest: "کشانەوەی داواکاری",
  renewalQueue: "داواکارییەکانی نوێکردنەوە",
  renewalQueueDescription: "داواکاری کڕیارەکان کە چاوەڕێی پێداچوونەوەن.",
  renewalQueueEmpty: "هیچ داواکارییەکی نوێکردنەوە چاوەڕێ نییە.",
  requestedBy: "داواکراوە لەلایەن",
  requestedAt: "بەرواری داواکاری",
  approve: "پەسەندکردن و نوێکردنەوە",
  approving: "پەسەند دەکرێت…",
  reject: "ڕەتکردنەوە",
  rejecting: "ڕەت دەکرێتەوە…",
  reviewNote: "تێبینی پێداچوونەوە",
  note: "تێبینی",
  company: "کۆمپانیا",
  service: "خزمەتگوزاری",
  billingModel: "شێوازی پسوڵە",
  billingModelHint:
    "خزمەتگوزارییە بەشداریکراوەکان بەسەردەچن ئەگەر نوێ نەکرێنەوە.",
  billingModelLabels: {
    PERPETUAL: "هەمیشەیی",
    SUBSCRIPTION: "بەشداریکردن",
  },
  termLabels: {
    MONTHLY: "مانگانە",
    QUARTERLY: "هەر ٣ مانگ",
    SEMI_ANNUAL: "هەر ٦ مانگ",
    ANNUAL: "ساڵانە",
    BIENNIAL: "هەر ٢ ساڵ",
    TRIENNIAL: "هەر ٣ ساڵ",
    CUSTOM: "بەرواری تایبەت",
  },
  statusLabels: {
    TRIAL: "تاقیکردنەوە",
    ACTIVE: "چالاک",
    GRACE: "ماوەی خۆشگوزەرانی",
    EXPIRED: "بەسەرچووە",
    CANCELLED: "هەڵوەشێنراوەتەوە",
    PERPETUAL: "هەمیشەیی",
    ASSIGNMENT_INACTIVE: "خزمەتگوزاری ناچالاک",
    SUBSCRIPTION_MISSING: "بەشداریکردن نییە",
  },
  sourceLabels: {
    INITIAL: "سەرەتایی",
    MANUAL_RENEWAL: "نوێکردنەوەی دەستی",
    AUTO_RENEWAL: "نوێکردنەوەی خۆکار",
    ADMIN_ADJUSTMENT: "ڕێکخستن",
  },
};

const ar: SubscriptionsDictionary = {
  title: "الاشتراك",
  description: "إدارة مدة الاشتراك والتجديد لهذه الخدمة.",
  none: "لا يوجد اشتراك",
  noneDescription: "هذه الخدمة تُفوتر بالاشتراك ولكن لا يوجد اشتراك بعد.",
  notSubscriptionBilled: "هذه الخدمة دائمة، لذا لا تحتاج إلى اشتراك.",
  term: "المدة",
  status: "الحالة",
  periodStart: "بداية الفترة",
  periodEnd: "نهاية الفترة",
  accessEndsAt: "انتهاء الوصول",
  daysRemaining: "الأيام المتبقية",
  gracePeriodDays: "فترة السماح (أيام)",
  autoRenew: "التجديد التلقائي",
  cancelAtPeriodEnd: "الإلغاء في نهاية الفترة",
  externalBillingRef: "مرجع الفاتورة",
  externalBillingRefHint: "مرجع اختياري للفاتورة في Odoo.",
  startsAt: "يبدأ",
  endsAt: "ينتهي",
  endsAtHint: "مطلوب للمدة المخصصة فقط.",
  trial: "ابدأ كتجربة",
  create: "إنشاء اشتراك",
  creating: "جارٍ الإنشاء…",
  update: "حفظ التغييرات",
  updating: "جارٍ الحفظ…",
  renew: "تجديد",
  renewing: "جارٍ التجديد…",
  renewHint:
    "يمدد بمدة واحدة من نهاية الفترة الحالية، أو من اليوم إذا انتهت بالفعل.",
  cancel: "إلغاء الاشتراك",
  cancelling: "جارٍ الإلغاء…",
  cancelAtPeriodEndOption: "دع الفترة المدفوعة تكتمل",
  cancelImmediately: "إنهاء الوصول فورًا",
  reason: "السبب",
  history: "سجل الفترات",
  historyEmpty: "لم تُسجل أي فترات بعد.",
  sequence: "#",
  source: "المصدر",
  expired: "منتهٍ",
  inGrace: "في فترة السماح",
  yes: "نعم",
  no: "لا",
  requestRenewal: "طلب التجديد",
  requestRenewalHint:
    "اطلب من المشغل تمديد هذا الاشتراك. سيقوم بالمراجعة والتأكيد.",
  requestRenewalSubmit: "إرسال الطلب",
  requestRenewalSubmitting: "جارٍ الإرسال…",
  requestPending: "هناك طلب تجديد قيد المراجعة.",
  withdrawRequest: "سحب الطلب",
  renewalQueue: "طلبات التجديد",
  renewalQueueDescription: "طلبات العملاء قيد المراجعة.",
  renewalQueueEmpty: "لا توجد طلبات تجديد قيد المراجعة.",
  requestedBy: "مقدم الطلب",
  requestedAt: "تاريخ الطلب",
  approve: "الموافقة والتجديد",
  approving: "جارٍ الموافقة…",
  reject: "رفض",
  rejecting: "جارٍ الرفض…",
  reviewNote: "ملاحظة المراجعة",
  note: "ملاحظة",
  company: "الشركة",
  service: "الخدمة",
  billingModel: "نموذج الفوترة",
  billingModelHint: "الخدمات المشتركة تنتهي ما لم يتم تجديدها.",
  billingModelLabels: {
    PERPETUAL: "دائم",
    SUBSCRIPTION: "اشتراك",
  },
  termLabels: {
    MONTHLY: "شهري",
    QUARTERLY: "كل ٣ أشهر",
    SEMI_ANNUAL: "كل ٦ أشهر",
    ANNUAL: "سنوي",
    BIENNIAL: "كل سنتين",
    TRIENNIAL: "كل ٣ سنوات",
    CUSTOM: "تواريخ مخصصة",
  },
  statusLabels: {
    TRIAL: "تجربة",
    ACTIVE: "نشط",
    GRACE: "فترة السماح",
    EXPIRED: "منتهٍ",
    CANCELLED: "ملغى",
    PERPETUAL: "دائم",
    ASSIGNMENT_INACTIVE: "الخدمة غير نشطة",
    SUBSCRIPTION_MISSING: "لا يوجد اشتراك",
  },
  sourceLabels: {
    INITIAL: "أولي",
    MANUAL_RENEWAL: "تجديد يدوي",
    AUTO_RENEWAL: "تجديد تلقائي",
    ADMIN_ADJUSTMENT: "تعديل",
  },
};

export const subscriptionsDictionaries: Record<
  Locale,
  SubscriptionsDictionary
> = { ku, ar, en };

export const SUBSCRIPTION_TERMS: readonly SubscriptionTerm[] = [
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUAL",
  "ANNUAL",
  "BIENNIAL",
  "TRIENNIAL",
  "CUSTOM",
];
