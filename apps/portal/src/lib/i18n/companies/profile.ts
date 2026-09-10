import type { Locale } from "@odookrd/types";

import { uiChrome } from "../ui-chrome";

export interface CompanyProfileV2Dictionary {
  eyebrow: string;
  title: string;
  description: string;
  identity: string;
  contact: string;
  contactDescription: string;
  slug: string;
  status: string;
  logo: string;
  noLogo: string;
  email: string;
  website: string;
  phone: string;
  address: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  profileCompleteness: string;
  complete: string;
  saveContact: string;
  saving: string;
  saved: string;
  requestIdentity: string;
  requestIdentityDescription: string;
  proposedName: string;
  proposedLogo: string;
  submitRequest: string;
  requestSubmitted: string;
  requestHistory: string;
  pending: string;
  approved: string;
  rejected: string;
  cancelled: string;
  requestedAt: string;
  reviewedAt: string;
  reviewNote: string;
  requestedBy: string;
  noRequests: string;
  platformManaged: string;
  platformManagedDescription: string;
  editCompany: string;
  edit: string;
  close: string;
  save: string;
  confirmRemoveLogo: string;
  updateLogo: string;
  removeLogo: string;
  reviewRequests: string;
  approve: string;
  reject: string;
  currentLogo: string;
  proposedChanges: string;
  proposedLogoIncluded: string;
  viewProposedLogo: string;
  contactHint: string;
}

export const companyProfileV2Dictionaries: Record<
  Locale,
  CompanyProfileV2Dictionary
> = {
  ku: {
    eyebrow: "کۆمپانیا",
    title: "پڕۆفایلی کۆمپانیا",
    description:
      "زانیاری ناسنامە و پەیوەندییەکانی کۆمپانیا لە یەک شوێن بەڕێوەببە.",
    identity: "ناسنامەی کۆمپانیا",
    contact: "زانیاری پەیوەندی",
    contactDescription:
      "ئەم زانیارییانە دەتوانرێت لەلایەن بەڕێوەبەری کۆمپانیاوە نوێ بکرێنەوە.",
    slug: "Slug",
    status: "دۆخ",
    logo: uiChrome.ku.logo,
    noLogo: "هیچ لۆگۆیەک دانەنراوە.",
    email: "ئیمەیڵی کۆمپانیا",
    website: "وێبسایت",
    phone: "ژمارەی تەلەفۆن",
    address: "ناونیشان",
    addressLine1: "ناونیشانی سەرەکی",
    addressLine2: "ناونیشانی زیاتر",
    city: "شار",
    region: "پارێزگا / هەرێم",
    postalCode: "کۆدی پۆست",
    countryCode: "کۆدی وڵات",
    profileCompleteness: "تەواوی پڕۆفایل",
    complete: "تەواو",
    saveContact: "پاشەکەوتکردنی زانیاری پەیوەندی",
    saving: "پاشەکەوت دەکرێت...",
    saved: "زانیاری کۆمپانیا پاشەکەوت کرا.",
    requestIdentity: "پێشنیاری گۆڕینی ناسنامە",
    requestIdentityDescription:
      "گۆڕینی ناوی کۆمپانیا یان لۆگۆ پێویستی بە پەسەندکردنی بەڕێوەبەری پلاتفۆرم هەیە.",
    proposedName: "ناوی پێشنیارکراو",
    proposedLogo: "لۆگۆی پێشنیارکراو",
    submitRequest: "ناردنی پێشنیار",
    requestSubmitted: "پێشنیارەکە بۆ پێداچوونەوە نێردرا.",
    requestHistory: "مێژووی پێشنیارەکان",
    pending: "چاوەڕوانی پێداچوونەوە",
    approved: "پەسەندکراو",
    rejected: "ڕەتکراوە",
    cancelled: "هەڵوەشاوە",
    requestedAt: "نێردراوە لە",
    reviewedAt: "پێداچوونەوە کراوە لە",
    reviewNote: "تێبینی پێداچوونەوە",
    requestedBy: "داواکراوە لەلایەن",
    noRequests: "هێشتا هیچ پێشنیارێکی گۆڕینی ناسنامە نییە.",
    platformManaged: "ناسنامەی پارێزراو",
    platformManagedDescription:
      "ناو و لۆگۆ تەنها دوای پەسەندکردنی بەڕێوەبەری پلاتفۆرم دەگۆڕدرێن.",
    editCompany: "دەستکاری پڕۆفایلی کۆمپانیا",
    edit: uiChrome.ku.edit,
    close: uiChrome.ku.close,
    save: "پاشەکەوتکردن",
    confirmRemoveLogo: "دڵنیایت لە سڕینەوەی لۆگۆی کۆمپانیا؟",
    updateLogo: "نوێکردنەوەی لۆگۆ",
    removeLogo: "سڕینەوەی لۆگۆ",
    reviewRequests: "پێداچوونەوەی داواکارییەکان",
    approve: "پەسەندکردن",
    reject: "ڕەتکردنەوە",
    currentLogo: "لۆگۆی ئێستا",
    proposedChanges: "گۆڕانکارییە پێشنیارکراوەکان",
    proposedLogoIncluded: "لۆگۆی نوێ لە پێشنیارەکەدایە.",
    viewProposedLogo: "بینینی لۆگۆی پێشنیارکراو",
    contactHint:
      "بۆ وێبسایت https:// بەکاربهێنە و بۆ کۆدی وڵات دوو پیتی ISO وەک IQ بنووسە.",
  },
  ar: {
    eyebrow: "الشركة",
    title: "ملف الشركة",
    description: "إدارة هوية الشركة ومعلومات الاتصال من مكان واحد.",
    identity: "هوية الشركة",
    contact: "معلومات الاتصال",
    contactDescription: "يمكن لمسؤول الشركة تحديث معلومات الاتصال مباشرة.",
    slug: "Slug",
    status: "الحالة",
    logo: uiChrome.ar.logo,
    noLogo: "لم يتم تعيين شعار للشركة.",
    email: "بريد الشركة",
    website: "الموقع الإلكتروني",
    phone: "الهاتف",
    address: "العنوان",
    addressLine1: "العنوان الرئيسي",
    addressLine2: "العنوان الإضافي",
    city: "المدينة",
    region: "المحافظة / الإقليم",
    postalCode: "الرمز البريدي",
    countryCode: "رمز الدولة",
    profileCompleteness: "اكتمال الملف",
    complete: "مكتمل",
    saveContact: "حفظ معلومات الاتصال",
    saving: "جارٍ الحفظ...",
    saved: "تم حفظ معلومات الشركة.",
    requestIdentity: "اقتراح تغيير الهوية",
    requestIdentityDescription:
      "تغيير اسم الشركة أو الشعار يحتاج موافقة مسؤول المنصة.",
    proposedName: "الاسم المقترح",
    proposedLogo: "الشعار المقترح",
    submitRequest: "إرسال الاقتراح",
    requestSubmitted: "تم إرسال الاقتراح للمراجعة.",
    requestHistory: "سجل الاقتراحات",
    pending: "بانتظار المراجعة",
    approved: "مقبول",
    rejected: "مرفوض",
    cancelled: "ملغي",
    requestedAt: "أرسل في",
    reviewedAt: "تمت المراجعة في",
    reviewNote: "ملاحظة المراجعة",
    requestedBy: "مقدم الطلب",
    noRequests: "لا توجد اقتراحات لتغيير الهوية حتى الآن.",
    platformManaged: "هوية محمية",
    platformManagedDescription:
      "لا يتم تغيير الاسم أو الشعار إلا بعد موافقة مسؤول المنصة.",
    editCompany: "تعديل ملف الشركة",
    edit: uiChrome.ar.edit,
    close: uiChrome.ar.close,
    save: "حفظ",
    confirmRemoveLogo: "هل أنت متأكد من حذف شعار الشركة؟",
    updateLogo: "تحديث الشعار",
    removeLogo: "إزالة الشعار",
    reviewRequests: "مراجعة الطلبات",
    approve: "موافقة",
    reject: "رفض",
    currentLogo: "الشعار الحالي",
    proposedChanges: "التغييرات المقترحة",
    proposedLogoIncluded: "يتضمن الطلب شعاراً جديداً.",
    viewProposedLogo: "عرض الشعار المقترح",
    contactHint: "استخدم https:// للموقع ورمز دولة ISO من حرفين مثل IQ.",
  },
  en: {
    eyebrow: "Company",
    title: "Company Profile",
    description:
      "Manage company identity and contact information from one workspace.",
    identity: "Company identity",
    contact: "Contact information",
    contactDescription:
      "Company administrators can update these contact details directly.",
    slug: "Slug",
    status: "Status",
    logo: uiChrome.en.logo,
    noLogo: "No company logo has been configured.",
    email: "Company email",
    website: "Website",
    phone: "Phone",
    address: "Address",
    addressLine1: "Address line 1",
    addressLine2: "Address line 2",
    city: "City",
    region: "Region / Governorate",
    postalCode: "Postal code",
    countryCode: "Country code",
    profileCompleteness: "Profile completeness",
    complete: "complete",
    saveContact: "Save contact information",
    saving: "Saving...",
    saved: "Company information saved.",
    requestIdentity: "Suggest identity change",
    requestIdentityDescription:
      "Company name or logo changes require Platform Admin approval.",
    proposedName: "Proposed company name",
    proposedLogo: "Proposed logo",
    submitRequest: "Submit suggestion",
    requestSubmitted: "Suggestion submitted for review.",
    requestHistory: "Identity request history",
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
    requestedAt: "Requested",
    reviewedAt: "Reviewed",
    reviewNote: "Review note",
    requestedBy: "Requested by",
    noRequests: "No company identity requests have been submitted yet.",
    platformManaged: "Protected identity",
    platformManagedDescription:
      "Company name and logo change only after Platform Admin approval.",
    editCompany: "Edit company profile",
    edit: uiChrome.en.edit,
    close: uiChrome.en.close,
    save: "Save",
    confirmRemoveLogo: "Are you sure you want to remove the company logo?",
    updateLogo: "Update logo",
    removeLogo: "Remove logo",
    reviewRequests: "Review requests",
    approve: "Approve",
    reject: "Reject",
    currentLogo: "Current logo",
    proposedChanges: "Proposed changes",
    proposedLogoIncluded: "A new logo is included in this request.",
    viewProposedLogo: "View proposed logo",
    contactHint:
      "Use https:// for websites and a two-letter ISO country code such as IQ.",
  },
};
