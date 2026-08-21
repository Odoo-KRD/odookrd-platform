import type { Dictionary } from "../types";

export const commonKu = {
  common: {
    brand: "OdooKRD",
    language: "زمان",
    platform: "پلاتفۆرمی کڕیاران",
    secureAccess: "چوونەژوورەوەی پارێزراو",
  },
  login: {
    title: "بەخێربێیتەوە",
    description: "بۆ بەردەوامبوون بچۆ ژوورەوە.",
    email: "ئیمەیڵ",
    password: "وشەی نهێنی",
    submit: "چوونەژوورەوە",
    submitting: "چوونەژوورەوە...",
    invalidCredentials: "ئیمەیڵ یان وشەی نهێنی نادروستە.",
    tooManyAttempts: "هەوڵەکان زۆرن. تکایە دواتر دووبارە هەوڵ بدەوە.",
    unavailable: "ئێستا پەیوەندی بە خزمەتگوزارییەکەوە ناکرێت.",
  },
  workspace: {
    adminTitle: "ژینگەی بەڕێوەبردن",
    adminDescription: "بنەمای بەڕێوەبردن ئامادەیە بۆ قۆناغی داهاتوو.",
    customerTitle: "ژینگەی کڕیار",
    customerDescription:
      "هەژمارەکەت چالاکە. ژینگەی کڕیار لە قۆناغی دوو زیاد دەکرێت.",
    signedInAs: "چوویتە ژوورەوە بە",
    permissions: "ڕێگەپێدانەکان",
    signOut: "چوونەدەرەوە",
    signingOut: "چوونەدەرەوە...",
  },
} satisfies Dictionary;
