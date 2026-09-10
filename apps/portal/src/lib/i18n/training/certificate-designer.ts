import type { Locale } from "@odookrd/types";

import { uiChrome } from "../ui-chrome";

export interface TrainingCertificateDesignerDictionary {
  designerTitle: string;
  designerDescription: string;
  generalTab: string;
  contentTab: string;
  backgroundTab: string;
  assetsTab: string;
  layoutTab: string;
  livePreview: string;
  exactPreviewHelp: string;
  previewPdf: string;
  previewing: string;
  showGuides: string;
  hideGuides: string;
  saveTemplate: string;
  duplicateTemplate: string;
  duplicating: string;
  internalKey: string;
  internalName: string;
  lifecycleStatus: string;
  statusDraft: string;
  statusActive: string;
  statusArchived: string;
  defaultTemplate: string;
  defaultTemplateHelp: string;
  primaryColor: string;
  contentLanguage: string;
  certificateTitle: string;
  introText: string;
  introTextHelp: string;
  bodyText: string;
  signatoryName: string;
  signatoryTitle: string;
  previewData: string;
  sampleLearner: string;
  sampleCourse: string;
  sampleCompany: string;
  backgroundPresets: string;
  backgroundPresetHelp: string;
  customBackground: string;
  customBackgroundHelp: string;
  noBackground: string;
  selectedPreset: string;
  uploadImage: string;
  replaceImage: string;
  removeImage: string;
  uploading: string;
  uploadFailed: string;
  logo: string;
  signature: string;
  vectorSupported: string;
  selectedElement: string;
  elementHelp: string;
  visible: string;
  xPosition: string;
  yPosition: string;
  width: string;
  height: string;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  textColor: string;
  alignment: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  fontSans: string;
  fontSerif: string;
  fontArabicSans: string;
  fontArabicNaskh: string;
  resetLayout: string;
  resetElement: string;
  dragHint: string;
  safeArea: string;
  templateSaved: string;
  previewFailed: string;
  saveFailed: string;
  duplicateFailed: string;
  languageRequired: string;
  defaultRequiresActive: string;
  templateGallery: string;
  templateGalleryDescription: string;
  preset: string;
  custom: string;
  defaultBadge: string;
  editDesigner: string;
  elementLogo: string;
  elementTitle: string;
  elementIntro: string;
  elementLearnerName: string;
  elementBody: string;
  elementCourseTitle: string;
  elementDetails: string;
  elementScore: string;
  elementSignature: string;
  elementSignatoryName: string;
  elementSignatoryTitle: string;
  elementCertificateNumber: string;
  elementVerificationCode: string;
}

export const trainingCertificateDesignerDictionaries: Record<
  Locale,
  TrainingCertificateDesignerDictionary
> = {
  ku: {
    designerTitle: "دیزاینەری بڕوانامە",
    designerDescription:
      "قاڵبی بڕوانامە بە پێشبینینی ڕاستەوخۆ، پاشبنەمای وێکتەر و کۆنترۆڵی وردی تایپۆگرافی دروست بکە.",
    generalTab: "گشتی",
    contentTab: "ناوەڕۆک",
    backgroundTab: "پاشبنەما",
    assetsTab: "براند و واژۆ",
    layoutTab: "ڕێکخستن",
    livePreview: "پێشبینینی ڕاستەوخۆ",
    exactPreviewHelp:
      "پێشبینینی PDF هەمان ڕەندەری بەرهەمی کۆتایی بەکاردەهێنێت و هیچ بڕوانامەیەک دەرناکات.",
    previewPdf: "پێشبینینی PDF",
    previewing: "PDF دروست دەکرێت...",
    showGuides: "پیشاندانی ڕێبەرەکان",
    hideGuides: "شاردنەوەی ڕێبەرەکان",
    saveTemplate: "پاشەکەوتکردنی قاڵب",
    duplicateTemplate: "کۆپیکردنی قاڵب",
    duplicating: "کۆپی دەکرێت...",
    internalKey: "کلیلی ناوخۆیی",
    internalName: "ناوی ناوخۆیی",
    lifecycleStatus: "دۆخی قاڵب",
    statusDraft: "ڕەشنووس",
    statusActive: "چالاک",
    statusArchived: "ئەرشیفکراو",
    defaultTemplate: "قاڵبی بنەڕەتی پلاتفۆرم",
    defaultTemplateHelp:
      "تەنها قاڵبی چالاک دەتوانێت وەک قاڵبی بنەڕەتی دیاری بکرێت.",
    primaryColor: "ڕەنگی سەرەکی",
    contentLanguage: "زمانی دەستکاری",
    certificateTitle: "ناونیشانی بڕوانامە",
    introText: "دەقی پێش ناو",
    introTextHelp: "وەک: ئەم بڕوانامەیە بە شانازییەوە پێشکەش دەکرێت بە",
    bodyText: "دەقی بڕوانامە",
    signatoryName: "ناوی واژۆکەر",
    signatoryTitle: "ناونیشانی واژۆکەر",
    previewData: "داتای پێشبینین",
    sampleLearner: "ناوی نموونەی فێرخواز",
    sampleCourse: "ناوی نموونەی کۆرس",
    sampleCompany: "ناوی نموونەی کۆمپانیا",
    backgroundPresets: "شێوازە ئامادەکان",
    backgroundPresetHelp:
      "شێوازێکی وێکتەر هەڵبژێرە یان پاشبنەمای SVG/PNG تایبەت باربکە.",
    customBackground: "پاشبنەمای تایبەت",
    customBackgroundHelp:
      "SVG بۆ کوالێتی وێکتەر پێشنیار دەکرێت. PNG/JPEG/WebPیش پشتگیری دەکرێن.",
    noBackground: "بێ پاشبنەما",
    selectedPreset: "شێوازی هەڵبژێردراو",
    uploadImage: "بارکردن",
    replaceImage: "گۆڕین",
    removeImage: "لابردن",
    uploading: "بار دەکرێت...",
    uploadFailed: "بارکردنی فایل سەرکەوتوو نەبوو.",
    logo: uiChrome.ku.logo,
    signature: "واژۆ",
    vectorSupported: "SVG وێکتەر پشتگیری دەکرێت",
    selectedElement: "توخمی هەڵبژێردراو",
    elementHelp:
      "لە پێشبینین توخمێک هەڵبژێرە و بە drag بیگوازەوە، یان ژمارەکان بە وردی ڕێکبخە.",
    visible: "پیشان بدرێت",
    xPosition: "شوێنی X",
    yPosition: "شوێنی Y",
    width: "پانی",
    height: "بەرزی",
    fontSize: "قەبارەی فۆنت",
    fontFamily: "جۆری فۆنت",
    fontWeight: "قەڵەوی فۆنت",
    textColor: "ڕەنگی دەق",
    alignment: "ڕیزبەندی",
    alignLeft: "چەپ",
    alignCenter: "ناوەڕاست",
    alignRight: "ڕاست",
    fontSans: "Sans",
    fontSerif: "Serif",
    fontArabicSans: "Arabic Sans",
    fontArabicNaskh: "Arabic Naskh",
    resetLayout: "گەڕاندنەوەی ڕێکخستنی بنەڕەتی",
    resetElement: "گەڕاندنەوەی توخم",
    dragHint: "توخمەکان دەتوانرێت لەسەر پێشبینین بگوێزرێنەوە.",
    safeArea: "ناوچەی سەلامەت بۆ دەق",
    templateSaved: "قاڵب پاشەکەوت کرا.",
    previewFailed: "پێشبینینی PDF دروست نەکرا.",
    saveFailed: "قاڵب پاشەکەوت نەکرا.",
    duplicateFailed: "کۆپیکردنی قاڵب سەرکەوتوو نەبوو.",
    languageRequired:
      "ناونیشان و دەقی بڕوانامە بە لانیکەم یەک زمان پڕ بکەرەوە.",
    defaultRequiresActive: "قاڵبی بنەڕەتی دەبێت چالاک بێت.",
    templateGallery: "گالەری قاڵبەکان",
    templateGalleryDescription:
      "قاڵبەکان بە پێشبینینی دیزاین، دۆخ و شێوازی پاشبنەما بەڕێوەببە.",
    preset: "شێواز",
    custom: uiChrome.ku.custom,
    defaultBadge: "بنەڕەتی",
    editDesigner: "کردنەوەی دیزاینەر",
    elementLogo: "لۆگۆ",
    elementTitle: "ناونیشان",
    elementIntro: "دەقی پێش ناو",
    elementLearnerName: "ناوی فێرخواز",
    elementBody: "دەقی بڕوانامە",
    elementCourseTitle: "ناوی کۆرس",
    elementDetails: "کۆمپانیا و بەروار",
    elementScore: "نمرە",
    elementSignature: "واژۆ",
    elementSignatoryName: "ناوی واژۆکەر",
    elementSignatoryTitle: "ناونیشانی واژۆکەر",
    elementCertificateNumber: "ژمارەی بڕوانامە",
    elementVerificationCode: "کۆدی پشتڕاستکردنەوە",
  },
  ar: {
    designerTitle: "مصمم الشهادات",
    designerDescription:
      "أنشئ قالب شهادة احترافياً مع معاينة مباشرة وخلفيات متجهة وتحكم دقيق في الطباعة والتخطيط.",
    generalTab: "عام",
    contentTab: "المحتوى",
    backgroundTab: "الخلفية",
    assetsTab: "الهوية والتوقيع",
    layoutTab: "التخطيط",
    livePreview: "المعاينة المباشرة",
    exactPreviewHelp:
      "معاينة PDF تستخدم نفس محرك الإنتاج ولا تقوم بإصدار شهادة فعلية.",
    previewPdf: "معاينة PDF",
    previewing: "جارٍ إنشاء PDF...",
    showGuides: "إظهار الأدلة",
    hideGuides: "إخفاء الأدلة",
    saveTemplate: "حفظ القالب",
    duplicateTemplate: "نسخ القالب",
    duplicating: "جارٍ النسخ...",
    internalKey: "المفتاح الداخلي",
    internalName: "الاسم الداخلي",
    lifecycleStatus: "حالة القالب",
    statusDraft: "مسودة",
    statusActive: "نشط",
    statusArchived: "مؤرشف",
    defaultTemplate: "قالب المنصة الافتراضي",
    defaultTemplateHelp: "يمكن تعيين قالب نشط فقط كقالب افتراضي.",
    primaryColor: "اللون الرئيسي",
    contentLanguage: "لغة التحرير",
    certificateTitle: "عنوان الشهادة",
    introText: "النص قبل الاسم",
    introTextHelp: "مثال: تُقدَّم هذه الشهادة بكل فخر إلى",
    bodyText: "نص الشهادة",
    signatoryName: "اسم الموقّع",
    signatoryTitle: "صفة الموقّع",
    previewData: "بيانات المعاينة",
    sampleLearner: "اسم المتدرب التجريبي",
    sampleCourse: "اسم الدورة التجريبية",
    sampleCompany: "اسم الشركة التجريبي",
    backgroundPresets: "الأنماط الجاهزة",
    backgroundPresetHelp: "اختر خلفية متجهة جاهزة أو ارفع خلفية SVG/PNG مخصصة.",
    customBackground: "خلفية مخصصة",
    customBackgroundHelp:
      "يوصى بـ SVG لجودة متجهة. كما يتم دعم PNG وJPEG وWebP.",
    noBackground: "بدون خلفية",
    selectedPreset: "النمط المحدد",
    uploadImage: "رفع",
    replaceImage: "استبدال",
    removeImage: "إزالة",
    uploading: "جارٍ الرفع...",
    uploadFailed: "تعذر رفع الملف.",
    logo: uiChrome.ar.logo,
    signature: "التوقيع",
    vectorSupported: "يدعم SVG المتجه",
    selectedElement: "العنصر المحدد",
    elementHelp:
      "حدد عنصراً في المعاينة واسحبه، أو اضبط الإحداثيات بدقة من الحقول.",
    visible: "إظهار العنصر",
    xPosition: "موضع X",
    yPosition: "موضع Y",
    width: "العرض",
    height: "الارتفاع",
    fontSize: "حجم الخط",
    fontFamily: "نوع الخط",
    fontWeight: "سماكة الخط",
    textColor: "لون النص",
    alignment: "المحاذاة",
    alignLeft: "يسار",
    alignCenter: "وسط",
    alignRight: "يمين",
    fontSans: "Sans",
    fontSerif: "Serif",
    fontArabicSans: "Arabic Sans",
    fontArabicNaskh: "Arabic Naskh",
    resetLayout: "إعادة التخطيط الافتراضي",
    resetElement: "إعادة العنصر",
    dragHint: "يمكن سحب العناصر مباشرة داخل المعاينة.",
    safeArea: "منطقة النص الآمنة",
    templateSaved: "تم حفظ القالب.",
    previewFailed: "تعذر إنشاء معاينة PDF.",
    saveFailed: "تعذر حفظ القالب.",
    duplicateFailed: "تعذر نسخ القالب.",
    languageRequired: "أدخل عنوان الشهادة ونصها بلغة واحدة على الأقل.",
    defaultRequiresActive: "يجب أن يكون القالب الافتراضي نشطاً.",
    templateGallery: "معرض القوالب",
    templateGalleryDescription:
      "إدارة القوالب مع معاينة التصميم والحالة ونمط الخلفية.",
    preset: "نمط",
    custom: uiChrome.ar.custom,
    defaultBadge: "افتراضي",
    editDesigner: "فتح المصمم",
    elementLogo: "الشعار",
    elementTitle: "العنوان",
    elementIntro: "النص قبل الاسم",
    elementLearnerName: "اسم المتدرب",
    elementBody: "نص الشهادة",
    elementCourseTitle: "اسم الدورة",
    elementDetails: "الشركة والتاريخ",
    elementScore: "النتيجة",
    elementSignature: "التوقيع",
    elementSignatoryName: "اسم الموقّع",
    elementSignatoryTitle: "صفة الموقّع",
    elementCertificateNumber: "رقم الشهادة",
    elementVerificationCode: "رمز التحقق",
  },
  en: {
    designerTitle: "Certificate Designer",
    designerDescription:
      "Build an enterprise certificate template with live preview, vector backgrounds and precise typography and layout controls.",
    generalTab: "General",
    contentTab: "Content",
    backgroundTab: "Background",
    assetsTab: "Brand & Signature",
    layoutTab: "Layout",
    livePreview: "Live Preview",
    exactPreviewHelp:
      "Preview PDF uses the exact production renderer and does not issue a real certificate.",
    previewPdf: "Preview PDF",
    previewing: "Generating PDF...",
    showGuides: "Show guides",
    hideGuides: "Hide guides",
    saveTemplate: "Save Template",
    duplicateTemplate: "Duplicate Template",
    duplicating: "Duplicating...",
    internalKey: "Internal key",
    internalName: "Internal name",
    lifecycleStatus: "Template status",
    statusDraft: "Draft",
    statusActive: "Active",
    statusArchived: "Archived",
    defaultTemplate: "Platform default template",
    defaultTemplateHelp: "Only an active template can be the platform default.",
    primaryColor: "Primary color",
    contentLanguage: "Editing language",
    certificateTitle: "Certificate title",
    introText: "Intro text",
    introTextHelp: "Example: This certificate is proudly presented to",
    bodyText: "Certificate text",
    signatoryName: "Signatory name",
    signatoryTitle: "Signatory title",
    previewData: "Preview data",
    sampleLearner: "Sample learner name",
    sampleCourse: "Sample course title",
    sampleCompany: "Sample company name",
    backgroundPresets: "Predefined styles",
    backgroundPresetHelp:
      "Choose a vector preset or upload a custom SVG/PNG certificate background.",
    customBackground: "Custom background",
    customBackgroundHelp:
      "SVG is recommended for true vector quality. PNG, JPEG and WebP are also supported.",
    noBackground: "No background",
    selectedPreset: "Selected style",
    uploadImage: "Upload",
    replaceImage: "Replace",
    removeImage: "Remove",
    uploading: "Uploading...",
    uploadFailed: "The file could not be uploaded.",
    logo: uiChrome.en.logo,
    signature: "Signature",
    vectorSupported: "Vector SVG supported",
    selectedElement: "Selected element",
    elementHelp:
      "Select an element in the preview and drag it, or enter exact coordinates below.",
    visible: "Visible",
    xPosition: "X position",
    yPosition: "Y position",
    width: "Width",
    height: "Height",
    fontSize: "Font size",
    fontFamily: "Font family",
    fontWeight: "Font weight",
    textColor: "Text color",
    alignment: "Alignment",
    alignLeft: "Left",
    alignCenter: "Center",
    alignRight: "Right",
    fontSans: "Sans",
    fontSerif: "Serif",
    fontArabicSans: "Arabic Sans",
    fontArabicNaskh: "Arabic Naskh",
    resetLayout: "Reset default layout",
    resetElement: "Reset element",
    dragHint: "Elements can be dragged directly on the certificate preview.",
    safeArea: "Safe text area",
    templateSaved: "Template saved.",
    previewFailed: "The PDF preview could not be generated.",
    saveFailed: "The certificate template could not be saved.",
    duplicateFailed: "The template could not be duplicated.",
    languageRequired:
      "Enter the certificate title and certificate text in at least one language.",
    defaultRequiresActive: "The default template must be active.",
    templateGallery: "Template Gallery",
    templateGalleryDescription:
      "Manage certificate templates with design previews, lifecycle status and background style.",
    preset: "Preset",
    custom: uiChrome.en.custom,
    defaultBadge: "Default",
    editDesigner: "Open Designer",
    elementLogo: "Logo",
    elementTitle: "Title",
    elementIntro: "Intro text",
    elementLearnerName: "Learner name",
    elementBody: "Certificate text",
    elementCourseTitle: "Course title",
    elementDetails: "Company & date",
    elementScore: "Score",
    elementSignature: "Signature",
    elementSignatoryName: "Signatory name",
    elementSignatoryTitle: "Signatory title",
    elementCertificateNumber: "Certificate number",
    elementVerificationCode: "Verification code",
  },
};
