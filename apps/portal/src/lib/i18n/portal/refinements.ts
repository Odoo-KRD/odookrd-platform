import type { Locale } from "@odookrd/types";

export interface CustomerPortalRefinementDictionary {
  login: {
    portalEyebrow: string;
    welcomeTitle: string;
    welcomeDescription: string;
    servicesBenefit: string;
    learningBenefit: string;
    accountBenefit: string;
    rememberMe: string;
    showPassword: string;
    hidePassword: string;
    secureNote: string;
  };
  services: {
    eyebrow: string;
    totalServices: string;
    features: string;
    moreFeatures: string;
    viewDetails: string;
    accessService: string;
    featurePreviewEmpty: string;
  };
  training: {
    eyebrow: string;
    title: string;
    description: string;
    enrolled: string;
    inProgress: string;
    completed: string;
    libraryTitle: string;
    libraryDescription: string;
  };
}

export const customerPortalRefinementDictionaries: Record<
  Locale,
  CustomerPortalRefinementDictionary
> = {
  ku: {
    login: {
      portalEyebrow: "پۆرتاڵی کڕیار",
      welcomeTitle: "بەخێربێیت بۆ OdooKRD",
      welcomeDescription:
        "پانێڵی تایبەت بە بەشداربوانی ئۆدوو، کە لە ڕێیەوە دەتوانن دەستتان بگات بە خزمەتگوزاریە بەردەستەکانی تایبەت بە پاکێج و بەشداریەکانتان.",
      servicesBenefit: "خزمەتگوزارییەکانت لە یەک شوێندا بەڕێوەببە",
      learningBenefit: "بەردەوام بە لە فێربوون و بڕوانامە بە دەست بهێنە.",
      accountBenefit: "زانیاریی کۆمپانیا و ئاگادارکردنەوەکان ببینە",
      rememberMe: "لەسەر ئەم ئامێرە چوونەژوورەوەم بپارێزە",
      showPassword: "وشەی نهێنی پیشان بدە",
      hidePassword: "وشەی نهێنی بشارەوە",
      secureNote: "چوونەژوورەوەکەت بە شێوەیەکی پارێزراو بەڕێوەدەبرێت.",
    },
    services: {
      eyebrow: "خزمەتگوزارییەکان",
      totalServices: "کۆی خزمەتگوزاری",
      features: "تایبەتمەندییەکان",
      moreFeatures: "{count}+ تایبەتمەندی تر",
      viewDetails: "بینینی وردەکاری",
      accessService: "چوونە ناو خزمەتگوزاری",
      featurePreviewEmpty:
        "وردەکاریی تایبەتمەندییەکان لە ناو خزمەتگوزارییەکەدا ببینە.",
    },
    training: {
      eyebrow: "فێربوون",
      title: "کۆرس و فێربوونی من",
      description:
        "لە یەک شوێندا بەردەوام بە لە کۆرسەکانت، پێشکەوتنت ببینە و کۆرسی نوێ دەست پێ بکە.",
      enrolled: "کۆرسی بەردەست",
      inProgress: "لە بەردەوامیدا",
      completed: "تەواوکراو",
      libraryTitle: "کتێبخانەی کۆرسەکان",
      libraryDescription:
        "هەموو کۆرسە بەردەستەکانت بگەڕێ و ئەو کۆرسە هەڵبژێرە کە دەتەوێت.",
    },
  },
  ar: {
    login: {
      portalEyebrow: "بوابة العملاء",
      welcomeTitle: "مرحباً بك في OdooKRD",
      welcomeDescription:
        "وصول آمن إلى خدمات شركتك ودوراتك ومعلومات حسابك من مكان واحد.",
      servicesBenefit: "إدارة خدماتك من مكان واحد",
      learningBenefit: "متابعة التعلم والشهادات",
      accountBenefit: "عرض معلومات الشركة والإشعارات",
      rememberMe: "تذكر تسجيل دخولي على هذا الجهاز",
      showPassword: "إظهار كلمة المرور",
      hidePassword: "إخفاء كلمة المرور",
      secureNote: "يتم تأمين جلسة تسجيل الدخول وحماية بيانات اعتمادك.",
    },
    services: {
      eyebrow: "الخدمات",
      totalServices: "إجمالي الخدمات",
      features: "المزايا",
      moreFeatures: "+{count} مزايا أخرى",
      viewDetails: "عرض التفاصيل",
      accessService: "الدخول إلى الخدمة",
      featurePreviewEmpty: "يمكنك مشاهدة تفاصيل المزايا داخل صفحة الخدمة.",
    },
    training: {
      eyebrow: "التدريب",
      title: "دوراتي وتعلمي",
      description: "تابع دوراتك وتقدمك وابدأ دورات جديدة من مساحة تعلم واحدة.",
      enrolled: "الدورات المتاحة",
      inProgress: "قيد التقدم",
      completed: "مكتملة",
      libraryTitle: "مكتبة الدورات",
      libraryDescription:
        "ابحث في جميع الدورات المتاحة لك واختر ما تريد تعلمه بعد ذلك.",
    },
  },
  en: {
    login: {
      portalEyebrow: "Customer Portal",
      welcomeTitle: "Welcome to OdooKRD",
      welcomeDescription:
        "Secure access to your company services, learning, and account information from one place.",
      servicesBenefit: "Manage your services in one workspace",
      learningBenefit: "Continue learning and access certificates",
      accountBenefit: "Review company information and notifications",
      rememberMe: "Remember me on this device",
      showPassword: "Show password",
      hidePassword: "Hide password",
      secureNote:
        "Your sign-in session is securely managed and your credentials stay protected.",
    },
    services: {
      eyebrow: "Services",
      totalServices: "Total services",
      features: "Features",
      moreFeatures: "+{count} more features",
      viewDetails: "View details",
      accessService: "Access service",
      featurePreviewEmpty:
        "Feature details are available inside the service workspace.",
    },
    training: {
      eyebrow: "Learning",
      title: "My Courses & Learning",
      description:
        "Continue your courses, review progress, and discover available learning from one workspace.",
      enrolled: "Available courses",
      inProgress: "In progress",
      completed: "Completed",
      libraryTitle: "Course Library",
      libraryDescription:
        "Browse all courses available to you and choose what to learn next.",
    },
  },
};
