import type { Locale } from "@odookrd/types";

export interface SharedStatus {
  ACTIVE: string;
  ARCHIVED: string;
  CANCELLED: string;
  DRAFT: string;
  EXPIRED: string;
  FAILED: string;
  INACTIVE: string;
  PENDING: string;
  PROCESSING: string;
  PROVISIONING: string;
  PUBLISHED: string;
  SENT: string;
  SKIPPED: string;
  SUSPENDED: string;
  active: string;
  archived: string;
  processing: string;
}

const en: SharedStatus = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
  CANCELLED: "Cancelled",
  DRAFT: "Draft",
  EXPIRED: "Expired",
  FAILED: "Failed",
  INACTIVE: "Inactive",
  PENDING: "Pending",
  PROCESSING: "Processing",
  PROVISIONING: "Provisioning",
  PUBLISHED: "Published",
  SENT: "Sent",
  SKIPPED: "Skipped",
  SUSPENDED: "Suspended",
  active: "Active",
  archived: "Archived",
  processing: "Processing",
};

const ku: SharedStatus = {
  ACTIVE: "چالاک",
  ARCHIVED: "ئەرشیفکراو",
  CANCELLED: "هەڵوەشاوەتەوە",
  DRAFT: "ڕەشنووس",
  EXPIRED: "بەسەرچوو",
  FAILED: "سەرکەوتوو نەبوو",
  INACTIVE: "ناچالاک",
  PENDING: "چاوەڕوان",
  PROCESSING: "لە جێبەجێکردندایە",
  PROVISIONING: "لە ئامادەکردندایە",
  PUBLISHED: "بڵاوکراوە",
  SENT: "نێردرا",
  SKIPPED: "پەڕێنرا",
  SUSPENDED: "ڕاگیراو",
  active: "چالاک",
  archived: "ئەرشیفکراو",
  processing: "لە پرۆسەدایە",
};

const ar: SharedStatus = {
  ACTIVE: "نشط",
  ARCHIVED: "مؤرشف",
  CANCELLED: "ملغى",
  DRAFT: "مسودة",
  EXPIRED: "منتهي",
  FAILED: "فشل",
  INACTIVE: "غير نشط",
  PENDING: "قيد الانتظار",
  PROCESSING: "قيد المعالجة",
  PROVISIONING: "قيد التجهيز",
  PUBLISHED: "منشور",
  SENT: "تم الإرسال",
  SKIPPED: "تم التخطي",
  SUSPENDED: "موقوف",
  active: "نشط",
  archived: "مؤرشف",
  processing: "قيد المعالجة",
};

export const sharedStatus: Record<Locale, SharedStatus> = { ku, ar, en };
