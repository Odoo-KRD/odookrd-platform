import type { Locale } from "@odookrd/types";
import { sharedText } from "../shared";

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
  playerSettingsGroups: {
    delivery: string;
    player: string;
    captions: string;
    reset: string;
    resetHelp: string;
    previewTitle: string;
    previewText: string;
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
      quizzes: sharedText.ku.labels.quizzes,
      certificates: sharedText.ku.labels.certificates,
    },
    playerSettingsGroups: {
      delivery: "گەیاندنی ڤیدیۆ",
      player: "پلەیەری ڤیدیۆ",
      captions: "ڕێکخستنەکانی ژێرنووس",
      reset: "گەڕاندنەوە بۆ بنەڕەت",
      resetHelp:
        "ڕێکخستنەکانی پلەیەر و ژێرنووس بۆ نرخە بنەڕەتییەکان بگەڕێنەوە؛ پاشان پاشەکەوت بکە.",
      previewTitle: "پێشبینینی ژێرنووس",
      previewText: "ئەمە نموونەی پیشاندانی ژێرنووسە لە پلەیەری ڤیدیۆ.",
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
      "trainings.player.autoplay": {
        label: "پێکردنی خۆکار",
        description:
          "Start video lessons automatically when learners open them.",
      },
      "trainings.player.default_playback_rate": {
        label: "خێرایی بنەڕەت",
        description: "Default playback speed for video lessons.",
      },
      "trainings.player.seek_seconds": {
        label: "هەنگاوی بازدان",
        description: "Seconds used by seek forward/back controls.",
      },
      "trainings.player.controls_auto_hide_seconds": {
        label: "ماوەی شاردنەوەی کۆنترۆڵەکان",
        description:
          "Seconds before controls automatically hide while playing.",
      },
      "trainings.player.show_fullscreen": {
        label: "دوگمەی پڕشاشە",
        description: "Show the fullscreen control.",
      },
      "trainings.player.show_volume": {
        label: "کۆنترۆڵی دەنگ",
        description: "Show mute and volume controls.",
      },
      "trainings.player.show_chapters": {
        label: "بەشەکانی ڤیدیۆ",
        description:
          "Show chapter navigation in the player and learning workspace.",
      },
      "trainings.player.show_speed_control": {
        label: "کۆنترۆڵی خێرایی",
        description: "Show playback-speed choices.",
      },
      "trainings.player.show_quality_selector": {
        label: "هەڵبژێری کوالێتی",
        description: "Show HLS quality choices when available.",
      },
      "trainings.player.branding.enabled": {
        label: "براندینگ لە پلەیەر",
        description: "دەقی براندینگ لە سەر ڤیدیۆ پیشان بدە یان بشارەوە.",
      },
      "trainings.player.branding.text": {
        label: "دەقی براندینگ",
        description: "دەقی کورت کە لە گوشەی سەرەوەی پلەیەر پیشان دەدرێت.",
      },
      "trainings.player.captions.default_behavior": {
        label: "هەڵسوکەوتی بنەڕەتی ژێرنووس",
        description:
          "Keep captions off, use video default, or prefer learner language.",
      },
      "trainings.player.captions.font_size": {
        label: "قەبارەی ژێرنووس",
        description: "Default caption text size.",
      },
      "trainings.player.captions.text_color": {
        label: "ڕەنگی دەق",
        description: "Default caption text color.",
      },
      "trainings.player.captions.background": {
        label: "پاشبنەمای ژێرنووس",
        description: "Background treatment behind caption text.",
      },
      "trainings.player.captions.background_opacity": {
        label: "ناڕوونی پاشبنەما",
        description: "Caption background opacity from 0 to 100.",
      },
      "trainings.player.captions.edge_style": {
        label: "شێوازی کەنار/سێبەر",
        description: "Text shadow/edge treatment for readability.",
      },
      "trainings.player.captions.position": {
        label: "شوێنی ژێرنووس",
        description: "Display captions near the bottom or top.",
      },
      "trainings.player.captions.max_width_percent": {
        label: "زۆرترین پانی",
        description: "Maximum caption width as a percentage of the video.",
      },
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
      "trainings.video.max_upload_mb": {
        label: "زۆرترین قەبارەی ڤیدیۆ",
        description: "زۆرترین قەبارەی MP4 بە MB بۆ بارکردنی ناوخۆیی و AWS.",
      },
      "trainings.video.aws.mediaconvert_role_arn": {
        label: "MediaConvert Role ARN",
        description:
          "IAM Role ARN کە MediaConvert بۆ خوێندنەوە و نووسین لە S3 بەکاری دەهێنێت.",
      },
      "trainings.video.aws.mediaconvert_queue_arn": {
        label: "MediaConvert Queue ARN",
        description: "ئارەزوومەندانە؛ Queue ARN ی تایبەت بۆ پرۆسەکردنی ڤیدیۆ.",
      },
      "trainings.video.aws.cloudfront_base_url": {
        label: "CloudFront Base URL",
        description:
          "HTTPS base URL ی CloudFront کە bucket ی فێرکاری وەک origin بەکاردەهێنێت.",
      },
      "trainings.video.aws.cloudfront_key_pair_id": {
        label: "CloudFront Key Pair ID",
        description: "Public key ID ی trusted key group بۆ لینکە واژۆکراوەکان.",
      },
      "trainings.video.aws.cloudfront_private_key_base64": {
        label: "CloudFront Private Key",
        description:
          "Private key ی PEM بە Base64؛ بە encrypted شێوە هەڵدەگیرێت و دووبارە پیشان نادرێتەوە.",
      },
      "trainings.video.aws.upload_url_ttl_seconds": {
        label: "ماوەی لینکی بارکردن",
        description: "ماوەی presigned S3 upload URL بە چرکە.",
      },
      "trainings.video.aws.delivery_url_ttl_seconds": {
        label: "ماوەی لینکی گەیاندن",
        description: "ماوەی CloudFront signed URL بە چرکە.",
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
      quizzes: sharedText.ar.labels.quizzes,
      certificates: sharedText.ar.labels.certificates,
    },
    playerSettingsGroups: {
      delivery: "توصيل الفيديو",
      player: "مشغل الفيديو",
      captions: "إعدادات الترجمة",
      reset: "إعادة الإعدادات الافتراضية",
      resetHelp:
        "أعد إعدادات المشغل والترجمة إلى القيم الافتراضية ثم احفظ الإعدادات.",
      previewTitle: "معاينة الترجمة",
      previewText: "هذا مثال لمظهر الترجمة داخل مشغل الفيديو.",
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
      "trainings.player.autoplay": {
        label: "التشغيل التلقائي",
        description:
          "Start video lessons automatically when learners open them.",
      },
      "trainings.player.default_playback_rate": {
        label: "سرعة التشغيل الافتراضية",
        description: "Default playback speed for video lessons.",
      },
      "trainings.player.seek_seconds": {
        label: "خطوة التقديم/الترجيع",
        description: "Seconds used by seek forward/back controls.",
      },
      "trainings.player.controls_auto_hide_seconds": {
        label: "تأخير إخفاء عناصر التحكم",
        description:
          "Seconds before controls automatically hide while playing.",
      },
      "trainings.player.show_fullscreen": {
        label: "زر ملء الشاشة",
        description: "Show the fullscreen control.",
      },
      "trainings.player.show_volume": {
        label: "التحكم بالصوت",
        description: "Show mute and volume controls.",
      },
      "trainings.player.show_chapters": {
        label: "فصول الفيديو",
        description:
          "Show chapter navigation in the player and learning workspace.",
      },
      "trainings.player.show_speed_control": {
        label: "التحكم بالسرعة",
        description: "Show playback-speed choices.",
      },
      "trainings.player.show_quality_selector": {
        label: "اختيار الجودة",
        description: "Show HLS quality choices when available.",
      },
      "trainings.player.branding.enabled": {
        label: "علامة المشغل",
        description: "إظهار أو إخفاء نص العلامة داخل مشغل الفيديو.",
      },
      "trainings.player.branding.text": {
        label: "نص العلامة",
        description: "النص القصير المعروض في الزاوية العلوية لمشغل الفيديو.",
      },
      "trainings.player.captions.default_behavior": {
        label: "سلوك الترجمة الافتراضي",
        description:
          "Keep captions off, use video default, or prefer learner language.",
      },
      "trainings.player.captions.font_size": {
        label: "حجم الترجمة",
        description: "Default caption text size.",
      },
      "trainings.player.captions.text_color": {
        label: "لون النص",
        description: "Default caption text color.",
      },
      "trainings.player.captions.background": {
        label: "خلفية الترجمة",
        description: "Background treatment behind caption text.",
      },
      "trainings.player.captions.background_opacity": {
        label: "شفافية الخلفية",
        description: "Caption background opacity from 0 to 100.",
      },
      "trainings.player.captions.edge_style": {
        label: "حد/ظل النص",
        description: "Text shadow/edge treatment for readability.",
      },
      "trainings.player.captions.position": {
        label: "موضع الترجمة",
        description: "Display captions near the bottom or top.",
      },
      "trainings.player.captions.max_width_percent": {
        label: "أقصى عرض",
        description: "Maximum caption width as a percentage of the video.",
      },
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
      "trainings.video.max_upload_mb": {
        label: "الحد الأقصى للفيديو",
        description: "الحد الأقصى لحجم MP4 بالميغابايت للرفع المحلي وAWS.",
      },
      "trainings.video.aws.mediaconvert_role_arn": {
        label: "MediaConvert Role ARN",
        description:
          "IAM Role ARN الذي يستخدمه MediaConvert للقراءة والكتابة في S3.",
      },
      "trainings.video.aws.mediaconvert_queue_arn": {
        label: "MediaConvert Queue ARN",
        description: "اختياري؛ Queue ARN مخصص لمعالجة الفيديو.",
      },
      "trainings.video.aws.cloudfront_base_url": {
        label: "CloudFront Base URL",
        description:
          "عنوان HTTPS الأساسي لتوزيع CloudFront المرتبط بمخزن التدريب.",
      },
      "trainings.video.aws.cloudfront_key_pair_id": {
        label: "CloudFront Key Pair ID",
        description:
          "معرف المفتاح العام في trusted key group لتوقيع روابط التوصيل.",
      },
      "trainings.video.aws.cloudfront_private_key_base64": {
        label: "CloudFront Private Key",
        description:
          "مفتاح PEM الخاص بصيغة Base64؛ يُخزن مشفراً ولا يُعرض مجدداً.",
      },
      "trainings.video.aws.upload_url_ttl_seconds": {
        label: "مدة رابط الرفع",
        description: "مدة صلاحية رابط S3 الموقّع مسبقاً بالثواني.",
      },
      "trainings.video.aws.delivery_url_ttl_seconds": {
        label: "مدة رابط التوصيل",
        description: "مدة صلاحية رابط CloudFront الموقّع بالثواني.",
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
      quizzes: sharedText.en.labels.quizzes,
      certificates: sharedText.en.labels.certificates,
    },
    playerSettingsGroups: {
      delivery: "Video Delivery",
      player: "Video Player",
      captions: "Caption Appearance",
      reset: "Reset player defaults",
      resetHelp:
        "Restore player and caption controls to the OdooKRD defaults, then save settings.",
      previewTitle: "Caption preview",
      previewText:
        "This is a preview of caption appearance in the video player.",
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
      "trainings.player.autoplay": {
        label: "Autoplay",
        description:
          "Start video lessons automatically when learners open them.",
      },
      "trainings.player.default_playback_rate": {
        label: "Default playback speed",
        description: "Default playback speed for video lessons.",
      },
      "trainings.player.seek_seconds": {
        label: "Seek step",
        description: "Seconds used by seek forward/back controls.",
      },
      "trainings.player.controls_auto_hide_seconds": {
        label: "Controls auto-hide delay",
        description:
          "Seconds before controls automatically hide while playing.",
      },
      "trainings.player.show_fullscreen": {
        label: "Fullscreen control",
        description: "Show the fullscreen control.",
      },
      "trainings.player.show_volume": {
        label: "Volume controls",
        description: "Show mute and volume controls.",
      },
      "trainings.player.show_chapters": {
        label: "Video chapters",
        description:
          "Show chapter navigation in the player and learning workspace.",
      },
      "trainings.player.show_speed_control": {
        label: "Playback speed control",
        description: "Show playback-speed choices.",
      },
      "trainings.player.show_quality_selector": {
        label: "Quality selector",
        description: "Show HLS quality choices when available.",
      },
      "trainings.player.branding.enabled": {
        label: "Player branding",
        description: "Show or hide the branding text over the video player.",
      },
      "trainings.player.branding.text": {
        label: "Branding text",
        description:
          "Short branding text displayed in the top corner of the player.",
      },
      "trainings.player.captions.default_behavior": {
        label: "Default caption behavior",
        description:
          "Keep captions off, use video default, or prefer learner language.",
      },
      "trainings.player.captions.font_size": {
        label: "Caption size",
        description: "Default caption text size.",
      },
      "trainings.player.captions.text_color": {
        label: "Caption text color",
        description: "Default caption text color.",
      },
      "trainings.player.captions.background": {
        label: "Caption background",
        description: "Background treatment behind caption text.",
      },
      "trainings.player.captions.background_opacity": {
        label: "Background opacity",
        description: "Caption background opacity from 0 to 100.",
      },
      "trainings.player.captions.edge_style": {
        label: "Caption text edge",
        description: "Text shadow/edge treatment for readability.",
      },
      "trainings.player.captions.position": {
        label: "Caption position",
        description: "Display captions near the bottom or top.",
      },
      "trainings.player.captions.max_width_percent": {
        label: "Maximum caption width",
        description: "Maximum caption width as a percentage of the video.",
      },
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
      "trainings.video.max_upload_mb": {
        label: "Maximum video size",
        description:
          "Maximum MP4 size in MB for local and automated AWS uploads.",
      },
      "trainings.video.aws.mediaconvert_role_arn": {
        label: "MediaConvert Role ARN",
        description:
          "IAM role ARN that MediaConvert assumes to read and write training objects in S3.",
      },
      "trainings.video.aws.mediaconvert_queue_arn": {
        label: "MediaConvert Queue ARN",
        description: "Optional custom MediaConvert queue ARN.",
      },
      "trainings.video.aws.cloudfront_base_url": {
        label: "CloudFront Base URL",
        description:
          "HTTPS base URL of the CloudFront distribution backed by the training S3 bucket.",
      },
      "trainings.video.aws.cloudfront_key_pair_id": {
        label: "CloudFront Key Pair ID",
        description:
          "Public key ID in the trusted key group used for signed delivery.",
      },
      "trainings.video.aws.cloudfront_private_key_base64": {
        label: "CloudFront Private Key",
        description:
          "Base64-encoded PEM private key; stored encrypted and never displayed again.",
      },
      "trainings.video.aws.upload_url_ttl_seconds": {
        label: "Upload URL lifetime",
        description: "Lifetime of direct presigned S3 upload URLs in seconds.",
      },
      "trainings.video.aws.delivery_url_ttl_seconds": {
        label: "Delivery URL lifetime",
        description: "Lifetime of CloudFront signed resource URLs in seconds.",
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
