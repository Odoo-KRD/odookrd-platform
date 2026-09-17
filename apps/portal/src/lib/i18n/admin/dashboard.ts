import type { Locale } from "@odookrd/types";

export interface AdminDashboardDictionary {
  customize: string;
  hiddenSections: string;
  metrics: {
    total: string;
    active: string;
    pending: string;
    invited: string;
    published: string;
    issuedCertificates: string;
    completions: string;
    learners: string;
    failedDeliveries: string;
    needsAttention: string;
    autoRenewing: string;
  };
  descriptions: {
    features: string;
    renewals: string;
    pipeline: string;
    training: string;
    certificates: string;
    reports: string;
    broadcasts: string;
  };
  remove: string;
  customizeHint: string;
  dragHint: string;
  noHiddenSections: string;
  collapse: string;
  expand: string;
  drag: string;
  reset: string;
  saved: string;
  saveFailed: string;
}

export const adminDashboardDictionaries: Record<
  Locale,
  AdminDashboardDictionary
> = {
  ku: {
    customize: "ڕێکخستنی داشبۆرد",
    hiddenSections: "بەشە شاردراوەکان",
    metrics: {
      total: "کۆی گشتی",
      active: "چالاک",
      pending: "چاوەڕوان",
      invited: "بانگهێشتکراو",
      published: "بڵاوکراوە",
      issuedCertificates: "بڕوانامەی دەرکراو",
      completions: "تەواوکردن",
      learners: "فێرخواز",
      failedDeliveries: "گەیاندنی سەرکەوتوونەبوو",
      needsAttention: "پێویستی بە سەرنجە",
      autoRenewing: "نوێکردنەوەی خۆکار",
    },
    descriptions: {
      features: "پێناسەی تایبەتمەندییەکانی خزمەتگوزاری بەڕێوەببە.",
      renewals: "داواکارییەکانی نوێکردنەوەی کڕیاران پشکنین و پەسەند بکە.",
      pipeline: "قۆناغەکانی نوێکردنەوە و بەسەرچوونەکان بەدواداچوون بکە.",
      training: "کۆرس و ناوەڕۆکی فێربوون بەڕێوەببە.",
      certificates: "بڕوانامە دەرکراوەکان ببینە و بەڕێوەیان ببە.",
      reports: "ڕاپۆرتی پێشکەوتن و تەواوکردنی فێربوون ببینە.",
      broadcasts: "ئاگادارکردنەوەی گشتی بۆ کڕیاران بنێرە.",
    },
    remove: "لابردن",
    customizeHint: "کارتە لابراوەکان لێرەوە بگەڕێنەوە.",
    dragHint: "کارتەکان بە دەستەکە ڕابکێشە بۆ گۆڕینی شوێنیان.",
    noHiddenSections: "هیچ کارتێکی شاراوە نییە.",
    collapse: "کورتکردنەوە",
    expand: "فراوانکردن",
    drag: "ڕاکێشان بۆ گۆڕینی شوێن",
    reset: "گەڕاندنەوە بۆ بنەڕەت",
    saved: "ڕێکخستنەکان پاشەکەوت کران.",
    saveFailed: "پاشەکەوتکردنی ڕێکخستنەکان سەرکەوتوو نەبوو.",
  },
  ar: {
    customize: "تخصيص لوحة التحكم",
    hiddenSections: "الأقسام المخفية",
    metrics: {
      total: "الإجمالي",
      active: "نشط",
      pending: "قيد الانتظار",
      invited: "مدعو",
      published: "منشور",
      issuedCertificates: "شهادات صادرة",
      completions: "إكمالات",
      learners: "متعلمون",
      failedDeliveries: "إرسال فاشل",
      needsAttention: "يحتاج متابعة",
      autoRenewing: "تجديد تلقائي",
    },
    descriptions: {
      features: "إدارة تعريفات ميزات الخدمات.",
      renewals: "مراجعة طلبات التجديد الواردة من العملاء واعتمادها.",
      pipeline: "متابعة مراحل التجديد وحالات انتهاء الاشتراك.",
      training: "إدارة الدورات ومحتوى التعلم.",
      certificates: "استعراض الشهادات الصادرة وإدارتها.",
      reports: "استعراض تقارير التقدم وإكمال الدورات.",
      broadcasts: "إرسال إشعارات عامة إلى العملاء.",
    },
    remove: "إزالة",
    customizeHint: "أعد البطاقات التي أزلتها من هنا.",
    dragHint: "اسحب البطاقات من المقبض لتغيير ترتيبها.",
    noHiddenSections: "لا توجد بطاقات مخفية.",
    collapse: "طي",
    expand: "توسيع",
    drag: "اسحب لتغيير الترتيب",
    reset: "إعادة الافتراضي",
    saved: "تم حفظ تفضيلات لوحة التحكم.",
    saveFailed: "تعذر حفظ تفضيلات لوحة التحكم.",
  },
  en: {
    customize: "Customize dashboard",
    hiddenSections: "Hidden sections",
    metrics: {
      total: "Total",
      active: "Active",
      pending: "Pending",
      invited: "Invited",
      published: "Published",
      issuedCertificates: "Certificates",
      completions: "Completions",
      learners: "Learners",
      failedDeliveries: "Failed",
      needsAttention: "Needs attention",
      autoRenewing: "Auto-renewing",
    },
    descriptions: {
      features: "Manage the service feature definitions.",
      renewals: "Review and approve customer renewal requests.",
      pipeline: "Track renewal stages and upcoming expiries.",
      training: "Manage courses and learning content.",
      certificates: "Review and manage issued certificates.",
      reports: "Review learning progress and completion reports.",
      broadcasts: "Send announcements to customers.",
    },
    remove: "Remove",
    customizeHint: "Bring back cards you removed from the dashboard.",
    dragHint: "Drag a card by its handle to move it.",
    noHiddenSections: "No hidden cards.",
    collapse: "Collapse",
    expand: "Expand",
    drag: "Drag to reorder",
    reset: "Reset layout",
    saved: "Dashboard preferences saved.",
    saveFailed: "Dashboard preferences could not be saved.",
  },
};
