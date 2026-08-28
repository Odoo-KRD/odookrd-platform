import type { Locale } from "@odookrd/types";

export interface SettingsNavigationDictionary {
  categoriesLabel: string;
  notificationTabsLabel: string;
  notificationTabs: { general: string; email: string; whatsapp: string };
  trainingTabsLabel: string;
  trainingTabs: {
    general: string;
    video: string;
    progress: string;
    quizzes: string;
    certificates: string;
  };
  fileTabsLabel: string;
  fileTabs: {
    general: string;
    limits: string;
    types: string;
    aws: string;
  };
  fileTypeGroups: {
    images: string;
    documents: string;
    video: string;
    videoComingSoon: string;
  };
  s3: {
    defaultCredentials: string;
    defaultCredentialsHelp: string;
    storedCredentials: string;
    storedCredentialsHelp: string;
    storedCredentialsTitle: string;
    storedCredentialsHint: string;
    testConnection: string;
    testing: string;
    testSuccess: string;
    testFailed: string;
    saveBeforeTest: string;
  };
  fieldCopy: Record<string, { label: string; description: string }>;
}

export const settingsNavigationDictionaries: Record<
  Locale,
  SettingsNavigationDictionary
> = {
  ku: {
    categoriesLabel: "بەشەکانی ڕێکخستن",
    notificationTabsLabel: "ڕێکخستنەکانی ئاگادارکردنەوە",
    notificationTabs: { general: "گشتی", email: "ئیمەیڵ", whatsapp: "واتسئاپ" },
    trainingTabsLabel: "ڕێکخستنەکانی فێرکاری ئۆنلاین",
    trainingTabs: {
      general: "گشتی",
      video: "ڤیدیۆ",
      progress: "پێشکەوتن",
      quizzes: "تاقیکردنەوەکان",
      certificates: "بڕوانامەکان",
    },
    fileTabsLabel: "ڕێکخستنەکانی هەڵگرتنی فایل",
    fileTabs: {
      general: "گشتی",
      limits: "سنووری بارکردن",
      types: "جۆرە ڕێگەپێدراوەکان",
      aws: "AWS S3",
    },
    fileTypeGroups: {
      images: "فایلە وێنەییەکان",
      documents: "بەڵگەنامە و سەرچاوەکان",
      video: "فایلە ڤیدیۆییەکان",
      videoComingSoon:
        "MP4 لە قۆناغی 3C.2 بە ڕێڕەوی تایبەتی ڤیدیۆ زیاد دەکرێت.",
    },
    s3: {
      defaultCredentials: "ناسنامەی سێرڤەر / IAM",
      defaultCredentialsHelp:
        "AWS credential chain ی سێرڤەر، IAM role یان environment بەکاربهێنە.",
      storedCredentials: "AWS Access Key / Secret Key",
      storedCredentialsHelp:
        "Access Key ID و Secret Access Key بە شێوەی encrypted لە Settings هەڵبگرە.",
      storedCredentialsTitle: "ناسنامەی IAM هەڵگیراو",
      storedCredentialsHint:
        "Access Key ID و Secret Access Key لە خوارەوە بنووسە؛ Secret ـەکان دووبارە پیشان نادرێنەوە.",
      testConnection: "تاقیکردنەوەی پەیوەندی",
      testing: "پەیوەندی تاقی دەکرێتەوە...",
      testSuccess: "پەیوەندی AWS S3 سەرکەوتوو بوو.",
      testFailed: "پەیوەندی AWS S3 سەرکەوتوو نەبوو.",
      saveBeforeTest: "پێش تاقیکردنەوە، گۆڕانکارییەکانی AWS S3 پاشەکەوت بکە.",
    },
    fieldCopy: {
      "trainings.enabled": {
        label: "فێرکاری ئۆنلاین",
        description: "بەشی فێرکاری ئۆنلاین لە پلاتفۆرمدا چالاک بکە.",
      },
      "trainings.video.primary_provider": {
        label: "دابینکەری سەرەکی ڤیدیۆ",
        description: "دابینکەری بنەڕەتی بۆ ناوەڕۆکی ڤیدیۆ.",
      },
      "trainings.video.local_upload_enabled": {
        label: "بارکردنی ڤیدیۆی ناوخۆیی",
        description: "ڕێگە بە بارکردنی ڤیدیۆ بۆ هەڵگرتنی ناوخۆیی بدە.",
      },
      "trainings.progress.lesson_completion_percentage": {
        label: "ڕێژەی تەواوکردنی وانە",
        description: "ڕێژەی پێویست بۆ دانانی وانە وەک تەواوکراو.",
      },
      "trainings.quizzes.enabled": {
        label: "تاقیکردنەوەکان",
        description: "تاقیکردنەوەکان لە فێرکاری ئۆنلاین چالاک بکە.",
      },
      "trainings.certificates.enabled": {
        label: "بڕوانامەکان",
        description: "بڕوانامەکانی تەواوکردن چالاک بکە.",
      },
      "files.storage.default_provider": {
        label: "دابینکەری بنەڕەتی هەڵگرتن",
        description:
          "تەنها بۆ فایلە نوێکان؛ فایلە کۆنەکان لە دابینکەری خۆیان دەمێننەوە.",
      },
      "files.aws_s3.credential_source": {
        label: "سەرچاوەی ناسنامەی AWS",
        description:
          "IAM/credential chain ی سێرڤەر یان ناسنامەی پارێزراو لە Settings هەڵبژێرە.",
      },
      "files.aws_s3.access_key_id": {
        label: "AWS Access Key ID",
        description:
          "Access Key بە شێوەی نهێنی و encrypted هەڵدەگیرێت و دووبارە پیشان نادرێتەوە.",
      },
      "files.aws_s3.secret_access_key": {
        label: "AWS Secret Access Key",
        description: "Secret Access Key بە شێوەی encrypted هەڵدەگیرێت.",
      },
      "files.aws_s3.session_token": {
        label: "AWS Session Token",
        description: "ئارەزوومەندانە؛ تەنها بۆ ناسنامە کاتییەکان.",
      },
      "files.upload.max_image_mb": {
        label: "زۆرترین قەبارەی وێنە",
        description: "زۆرترین قەبارەی وێنە بە MB.",
      },
      "files.upload.max_document_mb": {
        label: "زۆرترین قەبارەی بەڵگەنامە",
        description: "زۆرترین قەبارەی PDF بە MB.",
      },
      "files.upload.max_attachment_mb": {
        label: "زۆرترین قەبارەی هاوپێچ",
        description: "زۆرترین قەبارەی فایلە هاوپێچکراوەکان بە MB.",
      },
      "files.types.jpeg_enabled": {
        label: "JPEG",
        description: "بارکردنی وێنەی JPEG ڕێگەپێبدە.",
      },
      "files.types.png_enabled": {
        label: "PNG",
        description: "بارکردنی وێنەی PNG ڕێگەپێبدە.",
      },
      "files.types.webp_enabled": {
        label: "WEBP",
        description: "بارکردنی وێنەی WEBP ڕێگەپێبدە.",
      },
      "files.types.gif_enabled": {
        label: "GIF",
        description: "بارکردنی وێنەی GIF ڕێگەپێبدە.",
      },
      "files.types.pdf_enabled": {
        label: "PDF",
        description: "بارکردنی فایلە PDFـەکان ڕێگەپێبدە.",
      },
      "files.types.svg_enabled": {
        label: "SVG",
        description:
          "بارکردنی SVG ڕێگەپێبدە؛ SVGـەکان بە سیاسەتی پاراستنی توند گەیەنرێن.",
      },
      "files.types.docx_enabled": {
        label: "DOCX",
        description: "بارکردنی بەڵگەنامەی Microsoft Word ڕێگەپێبدە.",
      },
      "files.types.pptx_enabled": {
        label: "PPTX",
        description: "بارکردنی پێشکەشکردنی Microsoft PowerPoint ڕێگەپێبدە.",
      },
      "files.types.xlsx_enabled": {
        label: "XLSX",
        description: "بارکردنی Microsoft Excel ڕێگەپێبدە.",
      },
      "files.types.zip_enabled": {
        label: "ZIP",
        description: "بارکردنی ئەرشیفی ZIP ڕێگەپێبدە.",
      },
      "files.aws_s3.region": {
        label: "AWS Region",
        description: "ناوچەی S3؛ بەتاڵ بهێڵەرەوە بۆ بەکارهێنانی environment.",
      },
      "files.aws_s3.bucket": {
        label: "S3 Bucket",
        description: "ناوی bucket؛ بەتاڵ بهێڵەرەوە بۆ بەکارهێنانی environment.",
      },
    },
  },
  ar: {
    categoriesLabel: "أقسام الإعدادات",
    notificationTabsLabel: "إعدادات الإشعارات",
    notificationTabs: {
      general: "عام",
      email: "البريد الإلكتروني",
      whatsapp: "واتساب",
    },
    trainingTabsLabel: "إعدادات التعلّم الإلكتروني",
    trainingTabs: {
      general: "عام",
      video: "الفيديو",
      progress: "التقدم",
      quizzes: "الاختبارات",
      certificates: "الشهادات",
    },
    fileTabsLabel: "إعدادات تخزين الملفات",
    fileTabs: {
      general: "عام",
      limits: "حدود الرفع",
      types: "الأنواع المسموحة",
      aws: "AWS S3",
    },
    fileTypeGroups: {
      images: "ملفات الصور",
      documents: "المستندات والموارد",
      video: "ملفات الفيديو",
      videoComingSoon:
        "سيتم تفعيل MP4 في المرحلة 3C.2 عبر مسار الفيديو المخصص.",
    },
    s3: {
      defaultCredentials: "بيانات الخادم / IAM",
      defaultCredentialsHelp:
        "استخدم سلسلة بيانات اعتماد AWS على الخادم أو IAM Role أو متغيرات البيئة.",
      storedCredentials: "AWS Access Key / Secret Key",
      storedCredentialsHelp:
        "احفظ Access Key ID وSecret Access Key بشكل مشفر داخل إعدادات المنصة.",
      storedCredentialsTitle: "بيانات اعتماد IAM المحفوظة",
      storedCredentialsHint:
        "أدخل Access Key ID وSecret Access Key أدناه؛ القيم السرية لن تُعرض مرة أخرى.",
      testConnection: "اختبار الاتصال",
      testing: "جارٍ اختبار الاتصال...",
      testSuccess: "تم الاتصال بـ AWS S3 بنجاح.",
      testFailed: "تعذر الاتصال بـ AWS S3.",
      saveBeforeTest: "احفظ تغييرات AWS S3 قبل اختبار الاتصال.",
    },
    fieldCopy: {
      "trainings.enabled": {
        label: "التعلّم الإلكتروني",
        description: "تمكين وحدة التعلّم الإلكتروني على المنصة.",
      },
      "trainings.video.primary_provider": {
        label: "مزود الفيديو الأساسي",
        description: "مزود التخزين الأساسي لمحتوى الفيديو.",
      },
      "trainings.video.local_upload_enabled": {
        label: "رفع الفيديو محلياً",
        description: "السماح برفع الفيديو إلى التخزين المحلي.",
      },
      "trainings.progress.lesson_completion_percentage": {
        label: "نسبة إكمال الدرس",
        description: "النسبة المطلوبة لاعتبار الدرس مكتملاً.",
      },
      "trainings.quizzes.enabled": {
        label: "الاختبارات",
        description: "تمكين الاختبارات في التعلّم الإلكتروني.",
      },
      "trainings.certificates.enabled": {
        label: "الشهادات",
        description: "تمكين شهادات إكمال الدورات.",
      },
      "files.storage.default_provider": {
        label: "مزود التخزين الافتراضي",
        description:
          "يطبق على الرفعات الجديدة فقط؛ الملفات الحالية تبقى لدى مزودها الأصلي.",
      },
      "files.aws_s3.credential_source": {
        label: "مصدر بيانات اعتماد AWS",
        description:
          "اختر بيانات الخادم/IAM أو بيانات اعتماد مشفرة محفوظة في الإعدادات.",
      },
      "files.aws_s3.access_key_id": {
        label: "AWS Access Key ID",
        description: "يُخزن مشفراً ولا يتم عرضه مرة أخرى.",
      },
      "files.aws_s3.secret_access_key": {
        label: "AWS Secret Access Key",
        description: "يُخزن Secret Access Key بشكل مشفر.",
      },
      "files.aws_s3.session_token": {
        label: "AWS Session Token",
        description: "اختياري، للاعتمادات المؤقتة فقط.",
      },
      "files.upload.max_image_mb": {
        label: "الحد الأقصى للصورة",
        description: "الحد الأقصى لحجم الصورة بالميغابايت.",
      },
      "files.upload.max_document_mb": {
        label: "الحد الأقصى للمستند",
        description: "الحد الأقصى لحجم PDF بالميغابايت.",
      },
      "files.upload.max_attachment_mb": {
        label: "الحد الأقصى للمرفق",
        description: "الحد الأقصى لحجم المرفقات بالميغابايت.",
      },
      "files.types.jpeg_enabled": {
        label: "JPEG",
        description: "السماح برفع صور JPEG.",
      },
      "files.types.png_enabled": {
        label: "PNG",
        description: "السماح برفع صور PNG.",
      },
      "files.types.webp_enabled": {
        label: "WEBP",
        description: "السماح برفع صور WEBP.",
      },
      "files.types.gif_enabled": {
        label: "GIF",
        description: "السماح برفع صور GIF.",
      },
      "files.types.pdf_enabled": {
        label: "PDF",
        description: "السماح برفع ملفات PDF.",
      },
      "files.types.svg_enabled": {
        label: "SVG",
        description: "السماح برفع SVG مع سياسة أمان صارمة عند العرض.",
      },
      "files.types.docx_enabled": {
        label: "DOCX",
        description: "السماح برفع مستندات Microsoft Word.",
      },
      "files.types.pptx_enabled": {
        label: "PPTX",
        description: "السماح برفع عروض Microsoft PowerPoint.",
      },
      "files.types.xlsx_enabled": {
        label: "XLSX",
        description: "السماح برفع ملفات Microsoft Excel.",
      },
      "files.types.zip_enabled": {
        label: "ZIP",
        description: "السماح برفع أرشيفات ZIP.",
      },
      "files.aws_s3.region": {
        label: "AWS Region",
        description: "منطقة S3؛ اتركها فارغة لاستخدام إعداد البيئة.",
      },
      "files.aws_s3.bucket": {
        label: "S3 Bucket",
        description: "اسم bucket؛ اتركه فارغاً لاستخدام إعداد البيئة.",
      },
    },
  },
  en: {
    categoriesLabel: "Settings sections",
    notificationTabsLabel: "Notification settings",
    notificationTabs: {
      general: "General",
      email: "Email",
      whatsapp: "WhatsApp",
    },
    trainingTabsLabel: "E-Learning settings",
    trainingTabs: {
      general: "General",
      video: "Video",
      progress: "Progress",
      quizzes: "Quizzes",
      certificates: "Certificates",
    },
    fileTabsLabel: "File Storage settings",
    fileTabs: {
      general: "General",
      limits: "Upload limits",
      types: "Allowed types",
      aws: "AWS S3",
    },
    fileTypeGroups: {
      images: "Image files",
      documents: "Documents & resources",
      video: "Video files",
      videoComingSoon:
        "MP4 will be enabled in Stage 3C.2 through the dedicated video pipeline.",
    },
    s3: {
      defaultCredentials: "Server / IAM credentials",
      defaultCredentialsHelp:
        "Use the server AWS credential chain, IAM role, or environment credentials.",
      storedCredentials: "AWS Access Key / Secret Key",
      storedCredentialsHelp:
        "Store an Access Key ID and Secret Access Key encrypted in platform settings.",
      storedCredentialsTitle: "Stored IAM credentials",
      storedCredentialsHint:
        "Enter the Access Key ID and Secret Access Key below; secret values are never displayed again.",
      testConnection: "Test connection",
      testing: "Testing connection...",
      testSuccess: "AWS S3 connection succeeded.",
      testFailed: "AWS S3 connection failed.",
      saveBeforeTest: "Save AWS S3 changes before testing the connection.",
    },
    fieldCopy: {
      "trainings.enabled": {
        label: "E-Learning",
        description: "Enable the E-Learning module on the platform.",
      },
      "trainings.video.primary_provider": {
        label: "Primary video provider",
        description: "Default storage provider for future video content.",
      },
      "trainings.video.local_upload_enabled": {
        label: "Local video uploads",
        description: "Allow video uploads to local storage.",
      },
      "trainings.progress.lesson_completion_percentage": {
        label: "Lesson completion percentage",
        description:
          "Percentage required before a lesson is considered complete.",
      },
      "trainings.quizzes.enabled": {
        label: "Quizzes",
        description: "Enable quizzes in E-Learning.",
      },
      "trainings.certificates.enabled": {
        label: "Certificates",
        description: "Enable course-completion certificates.",
      },
      "files.storage.default_provider": {
        label: "Default storage provider",
        description:
          "Applies only to new uploads; existing assets continue using their recorded provider.",
      },
      "files.aws_s3.credential_source": {
        label: "AWS credential source",
        description:
          "Use the server/IAM credential chain or encrypted credentials stored in platform settings.",
      },
      "files.aws_s3.access_key_id": {
        label: "AWS Access Key ID",
        description: "Stored encrypted and never displayed again.",
      },
      "files.aws_s3.secret_access_key": {
        label: "AWS Secret Access Key",
        description: "Stored encrypted in platform settings.",
      },
      "files.aws_s3.session_token": {
        label: "AWS Session Token",
        description: "Optional; only for temporary AWS credentials.",
      },
      "files.upload.max_image_mb": {
        label: "Maximum image size",
        description: "Maximum image upload size in MB.",
      },
      "files.upload.max_document_mb": {
        label: "Maximum document size",
        description: "Maximum PDF upload size in MB.",
      },
      "files.upload.max_attachment_mb": {
        label: "Maximum attachment size",
        description: "Maximum attachment upload size in MB.",
      },
      "files.types.jpeg_enabled": {
        label: "JPEG",
        description: "Allow JPEG image uploads.",
      },
      "files.types.png_enabled": {
        label: "PNG",
        description: "Allow PNG image uploads.",
      },
      "files.types.webp_enabled": {
        label: "WEBP",
        description: "Allow WEBP image uploads.",
      },
      "files.types.gif_enabled": {
        label: "GIF",
        description: "Allow GIF image uploads.",
      },
      "files.types.pdf_enabled": {
        label: "PDF",
        description: "Allow PDF document uploads.",
      },
      "files.types.svg_enabled": {
        label: "SVG",
        description:
          "Allow SVG image uploads with a restrictive delivery security policy.",
      },
      "files.types.docx_enabled": {
        label: "DOCX",
        description: "Allow Microsoft Word document resources.",
      },
      "files.types.pptx_enabled": {
        label: "PPTX",
        description: "Allow Microsoft PowerPoint presentation resources.",
      },
      "files.types.xlsx_enabled": {
        label: "XLSX",
        description: "Allow Microsoft Excel workbook resources.",
      },
      "files.types.zip_enabled": {
        label: "ZIP",
        description: "Allow ZIP archive resources.",
      },
      "files.aws_s3.region": {
        label: "AWS Region",
        description:
          "S3 region; leave empty to use the environment configuration.",
      },
      "files.aws_s3.bucket": {
        label: "S3 Bucket",
        description:
          "S3 bucket name; leave empty to use the environment configuration.",
      },
    },
  },
};
