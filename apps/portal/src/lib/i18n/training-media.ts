import type { Locale } from "@odookrd/types";

export interface TrainingMediaDictionary {
  title: string;
  description: string;
  currentMedia: string;
  noMedia: string;
  automated: string;
  automatedHelp: string;
  manual: string;
  manualHelp: string;
  local: string;
  localHelp: string;
  slides: string;
  slidesHelp: string;
  chooseMp4: string;
  choosePdf: string;
  playbackUrl: string;
  sourceSize: string;
  processedSize: string;
  duration: string;
  resolution: string;
  uploadProcess: string;
  saveManual: string;
  uploadLocal: string;
  attachSlides: string;
  clearMedia: string;
  processing: string;
  ready: string;
  failed: string;
  uploading: string;
  archived: string;
  actionFailed: string;
  uploadFailed: string;
  invalidMp4: string;
  invalidPdf: string;
  openLesson: string;
  backToCourse: string;
  lessonUnavailable: string;
  previousPage: string;
  nextPage: string;
  page: string;
  of: string;
  loadingSlides: string;
  slideLoadFailed: string;
}

export const trainingMediaDictionaries: Record<
  Locale,
  TrainingMediaDictionary
> = {
  ku: {
    title: "میدیای وانە",
    description: "ڤیدیۆ یان PDF ـی وانە بە شێوەی پارێزراو بەڕێوەببە.",
    currentMedia: "میدیای ئێستا",
    noMedia: "هیچ میدیایەک پەیوەست نەکراوە.",
    automated: "AWS خۆکار",
    automatedHelp:
      "MP4 ڕاستەوخۆ بۆ S3 باربکە؛ MediaConvert خۆکارانە HLS دروست دەکات.",
    manual: "AWS دەستی",
    manualHelp:
      "HLS ـی ئامادەکراوی CloudFront تۆمار بکە؛ پلاتفۆڕم هیچ processing ـێک ناکات.",
    local: "MP4 ناوخۆیی",
    localHelp: "MP4 لە سێرڤەری پلاتفۆڕم هەڵبگرە و بە HTTP Range بگەیەنە.",
    slides: "سلایدی PDF",
    slidesHelp: "PDF ـێکی تایبەت پەیوەست بکە و لاپەڕە بە لاپەڕە پیشانی بدە.",
    chooseMp4: "هەڵبژاردنی MP4",
    choosePdf: "هەڵبژاردنی PDF",
    playbackUrl: "HLS Playback URL",
    sourceSize: "قەبارەی سەرچاوە (byte)",
    processedSize: "قەبارەی پرۆسەکراو (byte)",
    duration: "ماوە",
    resolution: "ڕوونی",
    uploadProcess: "بارکردن و پرۆسەکردن",
    saveManual: "پاشەکەوتکردنی HLS",
    uploadLocal: "بارکردنی MP4",
    attachSlides: "پەیوەستکردنی PDF",
    clearMedia: "لابردنی میدیا",
    processing: "پرۆسە دەکرێت",
    ready: "ئامادە",
    failed: "شکستی هێنا",
    uploading: "بار دەکرێت",
    archived: "ئەرشیف",
    actionFailed: "کرداری میدیا سەرکەوتوو نەبوو.",
    uploadFailed: "بارکردنی فایل سەرکەوتوو نەبوو.",
    invalidMp4: "تکایە فایلێکی MP4 هەڵبژێرە.",
    invalidPdf: "تکایە فایلێکی PDF هەڵبژێرە.",
    openLesson: "کردنەوەی وانە",
    backToCourse: "گەڕانەوە بۆ کۆرس",
    lessonUnavailable: "میدیای ئەم وانەیە هێشتا ئامادە نییە.",
    previousPage: "لاپەڕەی پێشوو",
    nextPage: "لاپەڕەی دواتر",
    page: "لاپەڕە",
    of: "لە",
    loadingSlides: "سلایدەکان بار دەکرێن...",
    slideLoadFailed: "بارکردنی PDF سەرکەوتوو نەبوو.",
  },
  ar: {
    title: "وسائط الدرس",
    description: "إدارة فيديو الدرس أو ملف PDF الخاص به عبر توصيل محمي.",
    currentMedia: "الوسائط الحالية",
    noMedia: "لا توجد وسائط مرتبطة بهذا الدرس.",
    automated: "AWS تلقائي",
    automatedHelp:
      "ارفع MP4 مباشرة إلى S3 ثم دع MediaConvert ينشئ HLS تلقائياً.",
    manual: "AWS يدوي",
    manualHelp: "سجّل رابط HLS جاهزاً على CloudFront بدون معالجة من المنصة.",
    local: "MP4 محلي",
    localHelp: "احفظ MP4 على خادم المنصة وقدمه عبر HTTP Range محمي.",
    slides: "شرائح PDF",
    slidesHelp: "اربط ملف PDF خاصاً واعرضه صفحة بصفحة.",
    chooseMp4: "اختيار MP4",
    choosePdf: "اختيار PDF",
    playbackUrl: "HLS Playback URL",
    sourceSize: "حجم المصدر (byte)",
    processedSize: "الحجم المعالج (byte)",
    duration: "المدة",
    resolution: "الدقة",
    uploadProcess: "رفع ومعالجة",
    saveManual: "حفظ HLS",
    uploadLocal: "رفع MP4",
    attachSlides: "ربط PDF",
    clearMedia: "إزالة الوسائط",
    processing: "قيد المعالجة",
    ready: "جاهز",
    failed: "فشل",
    uploading: "قيد الرفع",
    archived: "مؤرشف",
    actionFailed: "تعذر إكمال عملية الوسائط.",
    uploadFailed: "تعذر رفع الملف.",
    invalidMp4: "يرجى اختيار ملف MP4.",
    invalidPdf: "يرجى اختيار ملف PDF.",
    openLesson: "فتح الدرس",
    backToCourse: "العودة إلى الدورة",
    lessonUnavailable: "وسائط هذا الدرس غير جاهزة بعد.",
    previousPage: "الصفحة السابقة",
    nextPage: "الصفحة التالية",
    page: "صفحة",
    of: "من",
    loadingSlides: "جارٍ تحميل الشرائح...",
    slideLoadFailed: "تعذر تحميل ملف PDF.",
  },
  en: {
    title: "Lesson Media",
    description:
      "Manage the lesson video or private PDF through protected delivery.",
    currentMedia: "Current media",
    noMedia: "No media is attached to this lesson.",
    automated: "AWS Automated",
    automatedHelp:
      "Upload MP4 directly to S3 and let MediaConvert create HLS automatically.",
    manual: "AWS Manual",
    manualHelp:
      "Register a prepared CloudFront HLS URL without platform-side processing.",
    local: "Local MP4",
    localHelp:
      "Store MP4 on the platform server and deliver it with protected HTTP Range support.",
    slides: "PDF Slides",
    slidesHelp: "Attach a private PDF and present it page by page.",
    chooseMp4: "Choose MP4",
    choosePdf: "Choose PDF",
    playbackUrl: "HLS Playback URL",
    sourceSize: "Source size (bytes)",
    processedSize: "Processed size (bytes)",
    duration: "Duration",
    resolution: "Resolution",
    uploadProcess: "Upload & process",
    saveManual: "Save HLS",
    uploadLocal: "Upload MP4",
    attachSlides: "Attach PDF",
    clearMedia: "Remove media",
    processing: "Processing",
    ready: "Ready",
    failed: "Failed",
    uploading: "Uploading",
    archived: "Archived",
    actionFailed: "The media operation could not be completed.",
    uploadFailed: "The file upload failed.",
    invalidMp4: "Choose an MP4 video file.",
    invalidPdf: "Choose a PDF file.",
    openLesson: "Open lesson",
    backToCourse: "Back to course",
    lessonUnavailable: "This lesson's media is not ready yet.",
    previousPage: "Previous page",
    nextPage: "Next page",
    page: "Page",
    of: "of",
    loadingSlides: "Loading slides...",
    slideLoadFailed: "The PDF could not be loaded.",
  },
};
