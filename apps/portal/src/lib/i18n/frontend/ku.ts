import type { FrontendTranslations } from "../types";

export const frontendKu = {
  portal: {
    navigation: {
      label: "ڕێنوێنی کڕیار",
      dashboard: "داشبۆرد",
      administration: "بەڕێوەبردنی کۆمپانیا",
      portal: "ژینگەی کڕیار",
    },
    dashboard: {
      title: "داشبۆردی کڕیار",
      description:
        "لە یەک شوێنەوە هەژمار و خزمەتگوزارییەکانی کۆمپانیاکەت بەڕێوە ببە.",
      accountTitle: "زانیارییەکانی هەژمار",
      accountDescription: "وردەکارییەکانی هەژماری چالاکت.",
      email: "ئیمەیڵ",
      status: "دۆخی هەژمار",
      active: "چالاک",
      accountType: "جۆری هەژمار",
      companyAdministrator: "بەڕێوەبەری کۆمپانیا",
      companyUser: "بەکارهێنەری کۆمپانیا",
      administrationTitle: "بەڕێوەبردنی کۆمپانیا",
      administrationDescription:
        "دەستگەیشتن بە زانیارییەکانی کۆمپانیا و بەڕێوەبردنی بەکارهێنەران.",
      openAdministration: "کردنەوەی بەڕێوەبردن",
    },
  },
  services: {
    title: "خزمەتگوزارییەکان",
    customerTitle: "خزمەتگوزارییەکانی کۆمپانیا",
    customerDescription:
      "تەنها ئەو خزمەتگوزارییانە ببینە کە بۆ کۆمپانیاکەت تەرخان کراون.",
    customerSummary: "خزمەتگوزارییە چالاک و تەرخانکراوەکانی کۆمپانیاکەت ببینە.",
    service: "خزمەتگوزاری",
    category: "پۆل",
    status: "دۆخ",
    serviceDescription: "وەسف",
    displayName: "ناوی پیشاندراو",
    serviceUrl: "بەستەری خزمەتگوزاری",
    startsAt: "بەرواری دەستپێکردن",
    expiresAt: "بەرواری بەسەرچوون",
    notes: "تێبینییەکانی کڕیار",
    view: "بینین",
    openService: "کردنەوەی خزمەتگوزاری",
    back: "گەڕانەوە",
    records: "تۆمار",
    previous: "پێشوو",
    next: "دواتر",
    customerEmptyTitle: "هێشتا خزمەتگوزارییەک تەرخان نەکراوە",
    customerEmptyDescription:
      "کاتێک خزمەتگوزاری بۆ کۆمپانیاکەت تەرخان بکرێت لێرە دەردەکەوێت.",
    categoryLabels: {
      ODOO: "Odoo",
      HOSTING: "خانەخوێی",
      DOMAIN: "دۆمەین",
      SUPPORT: "پاڵپشتی",
      TRAINING: "ڕاهێنان",
      OTHER: "هی تر",
    },
    assignmentStatusLabels: {
      PROVISIONING: "لە ئامادەکردندایە",
      ACTIVE: "چالاک",
      SUSPENDED: "ڕاگیراو",
      EXPIRED: "بەسەرچوو",
      CANCELLED: "هەڵوەشاوەتەوە",
    },
  },
  invitations: {
    acceptanceTitle: "چالاککردنی هەژمار",
    acceptanceDescription: "وشەیەکی نهێنی دابنێ بۆ تەواوکردنی بانگهێشتەکەت.",
    newPassword: "وشەی نهێنی نوێ",
    confirmPassword: "دووبارەکردنەوەی وشەی نهێنی",
    passwordHint: "لانیکەم ١٢ پیت بەکاربهێنە.",
    activateAccount: "چالاککردنی هەژمار",
    activatingAccount: "چالاککردنی هەژمار...",
    invalidInvitation: "بەستەری بانگهێشتەکە نادروستە یان بەسەرچووە.",
    passwordsDoNotMatch: "وشە نهێنییەکان یەکسان نین.",
    acceptanceUnavailable:
      "نەتوانرا بانگهێشتەکە تەواو بکرێت. تکایە دووبارە هەوڵ بدەوە.",
    accountActivated: "هەژمارەکەت چالاککرا. ئێستا دەتوانیت بچیتە ژوورەوە.",
  },
} satisfies FrontendTranslations;
