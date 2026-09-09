import type { Locale } from "@odookrd/types";

export interface TrainingCertificateDictionary {
  certificatesNavigation: string;
  templatesNavigation: string;
  administrationNavigation: string;
  templatesTitle: string;
  templatesDescription: string;
  certificatesTitle: string;
  certificatesDescription: string;
  myCertificatesTitle: string;
  myCertificatesDescription: string;
  addTemplate: string;
  editTemplate: string;
  key: string;
  internalName: string;
  certificateTitle: string;
  certificateBody: string;
  logo: string;
  background: string;
  signature: string;
  uploadImage: string;
  replaceImage: string;
  removeImage: string;
  uploading: string;
  uploadFailed: string;
  signatoryName: string;
  signatoryTitle: string;
  primaryColor: string;
  active: string;
  inactive: string;
  save: string;
  saving: string;
  cancel: string;
  edit: string;
  status: string;
  noTemplates: string;
  certificateSettings: string;
  certificateSettingsHelp: string;
  enableCertificates: string;
  certificateTemplate: string;
  noTemplate: string;
  certificateAvailable: string;
  certificateReadyHelp: string;
  certificateName: string;
  certificateNameHelp: string;
  certificateLanguage: string;
  generateCertificate: string;
  generatingCertificate: string;
  certificateIssued: string;
  certificateRevoked: string;
  downloadCertificate: string;
  viewMyCertificates: string;
  noCertificates: string;
  certificateNumber: string;
  learner: string;
  company: string;
  course: string;
  issuedAt: string;
  score: string;
  revoke: string;
  revokeReason: string;
  revokeConfirm: string;
  revoking: string;
  templateUnavailable: string;
  kuLanguage: string;
  arLanguage: string;
  enLanguage: string;
  languageRequired: string;
}

export const trainingCertificateDictionaries: Record<
  Locale,
  TrainingCertificateDictionary
> = {
  ku: {
    certificatesNavigation: "بڕوانامەکانم",
    templatesNavigation: "قاڵبەکانی بڕوانامە",
    administrationNavigation: "بڕوانامەکان",
    templatesTitle: "قاڵبەکانی بڕوانامە",
    templatesDescription:
      "براند، دەق و زانیاری واژۆی بڕوانامەکان بە چەند زمانێک بەڕێوەببە.",
    certificatesTitle: "بڕوانامە دەرکراوەکان",
    certificatesDescription:
      "بڕوانامە دەرکراوەکانی فێرکاری ببینە و لە پێویستیدا هەڵیانبوەشێنەوە.",
    myCertificatesTitle: "بڕوانامەکانم",
    myCertificatesDescription:
      "بڕوانامە چالاکەکانی تەواوکردنی کۆرس ببینە و دایانبگرە.",
    addTemplate: "زیادکردنی قاڵب",
    editTemplate: "دەستکاریکردنی قاڵبی بڕوانامە",
    key: "کلیلی ناوخۆیی",
    internalName: "ناوی ناوخۆیی",
    certificateTitle: "ناونیشانی بڕوانامە",
    certificateBody: "دەقی بڕوانامە",
    logo: "لۆگۆ",
    background: "پاشبنەما",
    signature: "واژۆ",
    uploadImage: "بارکردنی وێنە",
    replaceImage: "گۆڕینی وێنە",
    removeImage: "لابردنی وێنە",
    uploading: "بار دەکرێت...",
    uploadFailed: "بارکردنی وێنە سەرکەوتوو نەبوو.",
    signatoryName: "ناوی واژۆکەر",
    signatoryTitle: "ناونیشانی واژۆکەر",
    primaryColor: "ڕەنگی سەرەکی",
    active: "چالاک",
    inactive: "ناچالاک",
    save: "پاشەکەوتکردن",
    saving: "پاشەکەوت دەکرێت...",
    cancel: "پاشگەزبوونەوە",
    edit: "دەستکاری",
    status: "دۆخ",
    noTemplates: "هیچ قاڵبێکی بڕوانامە نییە.",
    certificateSettings: "بڕوانامە",
    certificateSettingsHelp:
      "بڕوانامەی تەواوکردن چالاک بکە و قاڵبی ئەم کۆرسە دیاری بکە.",
    enableCertificates: "بڕوانامە بۆ ئەم کۆرسە چالاک بکە",
    certificateTemplate: "قاڵبی بڕوانامە",
    noTemplate: "هیچ قاڵبێک دیاری نەکراوە",
    certificateAvailable: "بڕوانامە ئامادەیە",
    certificateReadyHelp:
      "تەواوکردنی کۆرس پشتڕاست کراوەتەوە. ناو و زمانی بڕوانامە پشتڕاست بکە بۆ دەرکردن.",
    certificateName: "ناوی بڕوانامە",
    certificateNameHelp:
      "ناوت بەو شێوەیە بنووسە کە دەتەوێت بە هەمیشەیی لەسەر بڕوانامەکە دەرکەوێت.",
    certificateLanguage: "زمانی بڕوانامە",
    generateCertificate: "دروستکردنی بڕوانامە",
    generatingCertificate: "دروست دەکرێت...",
    certificateIssued: "بڕوانامە دەرکرا",
    certificateRevoked: "بڕوانامە هەڵوەشێندرایەوە",
    downloadCertificate: "بینین / داگرتنی PDF",
    viewMyCertificates: "بڕوانامەکانم",
    noCertificates: "هێشتا هیچ بڕوانامەیەکت نییە.",
    certificateNumber: "ژمارەی بڕوانامە",
    learner: "فێرخواز",
    company: "کۆمپانیا",
    course: "کۆرس",
    issuedAt: "دەرکرا لە",
    score: "نمرە",
    revoke: "هەڵوەشاندنەوە",
    revokeReason: "هۆکاری هەڵوەشاندنەوە",
    revokeConfirm: "هەڵوەشاندنەوەی بڕوانامە",
    revoking: "هەڵدەوەشێندرێتەوە...",
    templateUnavailable:
      "دروستکردنی بڕوانامە کاتێک بەردەست نییە چونکە قاڵبی کۆرس چالاک نییە.",
    kuLanguage: "کوردی",
    arLanguage: "عەرەبی",
    enLanguage: "ئینگلیزی",
    languageRequired: "لانیکەم یەک زمان بۆ ناونیشان و دەق پڕ بکەرەوە.",
  },
  ar: {
    certificatesNavigation: "شهاداتي",
    templatesNavigation: "قوالب الشهادات",
    administrationNavigation: "الشهادات",
    templatesTitle: "قوالب الشهادات",
    templatesDescription:
      "إدارة هوية الشهادة ونصوصها متعددة اللغات وبيانات التوقيع.",
    certificatesTitle: "الشهادات الصادرة",
    certificatesDescription:
      "مراجعة شهادات التدريب الصادرة وإلغاؤها عند الحاجة.",
    myCertificatesTitle: "شهاداتي",
    myCertificatesDescription:
      "عرض وتنزيل شهادات إكمال الدورات النشطة الخاصة بك.",
    addTemplate: "إضافة قالب",
    editTemplate: "تعديل قالب الشهادة",
    key: "المفتاح الداخلي",
    internalName: "الاسم الداخلي",
    certificateTitle: "عنوان الشهادة",
    certificateBody: "نص الشهادة",
    logo: "الشعار",
    background: "الخلفية",
    signature: "التوقيع",
    uploadImage: "رفع صورة",
    replaceImage: "استبدال الصورة",
    removeImage: "إزالة الصورة",
    uploading: "جارٍ الرفع...",
    uploadFailed: "تعذر رفع الصورة.",
    signatoryName: "اسم الموقّع",
    signatoryTitle: "صفة الموقّع",
    primaryColor: "اللون الرئيسي",
    active: "نشط",
    inactive: "غير نشط",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    cancel: "إلغاء",
    edit: "تعديل",
    status: "الحالة",
    noTemplates: "لا توجد قوالب شهادات.",
    certificateSettings: "الشهادة",
    certificateSettingsHelp:
      "فعّل شهادة إكمال وحدد القالب المستخدم لهذه الدورة.",
    enableCertificates: "تفعيل الشهادة لهذه الدورة",
    certificateTemplate: "قالب الشهادة",
    noTemplate: "لم يتم اختيار قالب",
    certificateAvailable: "الشهادة متاحة",
    certificateReadyHelp:
      "تم التحقق من إكمال الدورة. أكد اسم الشهادة ولغتها لإصدارها.",
    certificateName: "الاسم على الشهادة",
    certificateNameHelp:
      "أدخل اسمك تماماً كما تريد أن يظهر بشكل دائم على الشهادة.",
    certificateLanguage: "لغة الشهادة",
    generateCertificate: "إنشاء الشهادة",
    generatingCertificate: "جارٍ الإنشاء...",
    certificateIssued: "تم إصدار الشهادة",
    certificateRevoked: "تم إلغاء الشهادة",
    downloadCertificate: "عرض / تنزيل PDF",
    viewMyCertificates: "شهاداتي",
    noCertificates: "لا توجد لديك شهادات صادرة حتى الآن.",
    certificateNumber: "رقم الشهادة",
    learner: "المتدرب",
    company: "الشركة",
    course: "الدورة",
    issuedAt: "تاريخ الإصدار",
    score: "النتيجة",
    revoke: "إلغاء",
    revokeReason: "سبب الإلغاء",
    revokeConfirm: "إلغاء الشهادة",
    revoking: "جارٍ الإلغاء...",
    templateUnavailable:
      "إنشاء الشهادة غير متاح مؤقتاً لأن قالب الدورة غير نشط.",
    kuLanguage: "الكردية",
    arLanguage: "العربية",
    enLanguage: "الإنجليزية",
    languageRequired: "أدخل العنوان والنص بلغة واحدة على الأقل.",
  },
  en: {
    certificatesNavigation: "My Certificates",
    templatesNavigation: "Certificate Templates",
    administrationNavigation: "Certificates",
    templatesTitle: "Certificate Templates",
    templatesDescription:
      "Manage multilingual certificate branding and signing details.",
    certificatesTitle: "Issued Certificates",
    certificatesDescription:
      "Review issued training certificates and revoke credentials when required.",
    myCertificatesTitle: "My Certificates",
    myCertificatesDescription:
      "View and download your active course completion certificates.",
    addTemplate: "Add template",
    editTemplate: "Edit certificate template",
    key: "Internal key",
    internalName: "Internal name",
    certificateTitle: "Certificate title",
    certificateBody: "Certificate body",
    logo: "Logo",
    background: "Background",
    signature: "Signature",
    uploadImage: "Upload image",
    replaceImage: "Replace image",
    removeImage: "Remove image",
    uploading: "Uploading...",
    uploadFailed: "The image could not be uploaded.",
    signatoryName: "Signatory name",
    signatoryTitle: "Signatory title",
    primaryColor: "Primary color",
    active: "Active",
    inactive: "Inactive",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    edit: "Edit",
    status: "Status",
    noTemplates: "No certificate templates are available.",
    certificateSettings: "Certificate",
    certificateSettingsHelp:
      "Enable a completion certificate and choose the template used by this course.",
    enableCertificates: "Enable certificate for this course",
    certificateTemplate: "Certificate template",
    noTemplate: "No template selected",
    certificateAvailable: "Certificate available",
    certificateReadyHelp:
      "Your course completion is verified. Confirm your certificate name and language to issue the certificate.",
    certificateName: "Certificate name",
    certificateNameHelp:
      "Enter your name exactly as it should permanently appear on the certificate.",
    certificateLanguage: "Certificate language",
    generateCertificate: "Generate certificate",
    generatingCertificate: "Generating...",
    certificateIssued: "Certificate issued",
    certificateRevoked: "Certificate revoked",
    downloadCertificate: "View / Download PDF",
    viewMyCertificates: "My Certificates",
    noCertificates: "You do not have any issued certificates yet.",
    certificateNumber: "Certificate number",
    learner: "Learner",
    company: "Company",
    course: "Course",
    issuedAt: "Issued",
    score: "Score",
    revoke: "Revoke",
    revokeReason: "Revocation reason",
    revokeConfirm: "Revoke certificate",
    revoking: "Revoking...",
    templateUnavailable:
      "Certificate generation is temporarily unavailable because the course template is not active.",
    kuLanguage: "Kurdish",
    arLanguage: "Arabic",
    enLanguage: "English",
    languageRequired:
      "Enter the certificate title and body in at least one language.",
  },
};
