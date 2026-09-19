import type { Locale } from "@odookrd/types";

export interface KnowledgeDictionary {
  navigation: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  searchAction: string;
  searchTitle: string;
  searchResultsFor: string;
  searchEmptyTitle: string;
  searchEmptyDescription: string;
  searchPromptTitle: string;
  searchPromptDescription: string;
  browseTitle: string;
  categories: string;
  articles: string;
  articleCount: string;
  noArticlesTitle: string;
  noArticlesDescription: string;
  noCategoriesTitle: string;
  noCategoriesDescription: string;
  notFoundTitle: string;
  notFoundDescription: string;
  backToPortal: string;
  backToKnowledgeBase: string;
  updatedAt: string;
  tags: string;
  openArticle: string;
  loadError: string;
  feedbackQuestion: string;
  feedbackYes: string;
  feedbackNo: string;
  feedbackCommentPrompt: string;
  feedbackCommentPlaceholder: string;
  feedbackSend: string;
  feedbackSending: string;
  feedbackSkip: string;
  feedbackThanks: string;
  feedbackThanksNegative: string;
  feedbackError: string;
  feedbackChange: string;
}

export const knowledgeDictionaries: Record<Locale, KnowledgeDictionary> = {
  ku: {
    navigation: "بنکەی زانیاری",
    title: "بنکەی زانیاری",
    description: "ڕێنماییەکان و وەڵامی پرسیارە باوەکان دەربارەی ئۆدوو.",
    searchPlaceholder: "گەڕان لە بنکەی زانیاری...",
    searchAction: "گەڕان",
    searchTitle: "ئەنجامی گەڕان",
    searchResultsFor: "ئەنجامەکان بۆ",
    searchEmptyTitle: "هیچ ئەنجامێک نەدۆزرایەوە",
    searchEmptyDescription: "وشەیەکی جیاواز تاقی بکەرەوە یان بە پۆلەکاندا بگەڕێ.",
    searchPromptTitle: "بە وشەیەک دەست پێ بکە",
    searchPromptDescription: "ناونیشان، ناوەڕۆک و تاگەکان دەگەڕێن.",
    browseTitle: "پۆلەکان",
    categories: "پۆلەکان",
    articles: "بابەتەکان",
    articleCount: "بابەت",
    noArticlesTitle: "هیچ بابەتێک نییە",
    noArticlesDescription: "هێشتا هیچ بابەتێک لەم پۆلەدا بڵاو نەکراوەتەوە.",
    noCategoriesTitle: "بنکەی زانیاری بەتاڵە",
    noCategoriesDescription: "هێشتا هیچ ناوەڕۆکێک بڵاو نەکراوەتەوە.",
    notFoundTitle: "نەدۆزرایەوە",
    notFoundDescription: "ئەم لاپەڕەیە بوونی نییە یان بڵاو نەکراوەتەوە.",
    backToPortal: "گەڕانەوە بۆ پۆرتاڵ",
    backToKnowledgeBase: "گەڕانەوە بۆ بنکەی زانیاری",
    updatedAt: "دوایین نوێکردنەوە",
    tags: "تاگەکان",
    openArticle: "کردنەوە",
    loadError: "نەتوانرا بنکەی زانیاری باربکرێت.",
    feedbackQuestion: "ئایا ئەمە بەسوود بوو؟",
    feedbackYes: "بەڵێ",
    feedbackNo: "نەخێر",
    feedbackCommentPrompt: "دەتوانیت یارمەتیمان بدەیت باشتری بکەین؟",
    feedbackCommentPlaceholder: "چی کەم بوو؟ (ئارەزوومەندانە)",
    feedbackSend: "ناردن",
    feedbackSending: "دەنێردرێت...",
    feedbackSkip: "بەبێ ڕاڤە بنێرە",
    feedbackThanks: "سوپاس بۆ وەڵامەکەت.",
    feedbackThanksNegative: "سوپاس، ئەمە یارمەتیدەرە بۆ باشترکردنی.",
    feedbackError: "نەتوانرا بنێردرێت. دووبارە هەوڵ بدەرەوە.",
    feedbackChange: "گۆڕینی وەڵام",
  },
  ar: {
    navigation: "قاعدة المعرفة",
    title: "قاعدة المعرفة",
    description: "أدلة وإجابات عن الأسئلة الشائعة حول أودو.",
    searchPlaceholder: "ابحث في قاعدة المعرفة...",
    searchAction: "بحث",
    searchTitle: "نتائج البحث",
    searchResultsFor: "النتائج عن",
    searchEmptyTitle: "لا توجد نتائج",
    searchEmptyDescription: "جرّب كلمة أخرى أو تصفّح الفئات.",
    searchPromptTitle: "ابدأ بكلمة",
    searchPromptDescription: "يشمل البحث العناوين والمحتوى والوسوم.",
    browseTitle: "الفئات",
    categories: "الفئات",
    articles: "المقالات",
    articleCount: "مقالة",
    noArticlesTitle: "لا توجد مقالات",
    noArticlesDescription: "لم تُنشر أي مقالة في هذه الفئة بعد.",
    noCategoriesTitle: "قاعدة المعرفة فارغة",
    noCategoriesDescription: "لم يُنشر أي محتوى بعد.",
    notFoundTitle: "غير موجود",
    notFoundDescription: "هذه الصفحة غير موجودة أو غير منشورة.",
    backToPortal: "العودة إلى البوابة",
    backToKnowledgeBase: "العودة إلى قاعدة المعرفة",
    updatedAt: "آخر تحديث",
    tags: "الوسوم",
    openArticle: "فتح",
    loadError: "تعذّر تحميل قاعدة المعرفة.",
    feedbackQuestion: "هل كان هذا مفيداً؟",
    feedbackYes: "نعم",
    feedbackNo: "لا",
    feedbackCommentPrompt: "هل يمكنك مساعدتنا على تحسينه؟",
    feedbackCommentPlaceholder: "ما الذي كان ناقصاً؟ (اختياري)",
    feedbackSend: "إرسال",
    feedbackSending: "جارٍ الإرسال...",
    feedbackSkip: "إرسال بدون تعليق",
    feedbackThanks: "شكراً على ملاحظتك.",
    feedbackThanksNegative: "شكراً، هذا يساعدنا على تحسينه.",
    feedbackError: "تعذّر الإرسال. حاول مرة أخرى.",
    feedbackChange: "تغيير الإجابة",
  },
  en: {
    navigation: "Knowledge base",
    title: "Knowledge base",
    description: "Guides and answers to common questions about Odoo.",
    searchPlaceholder: "Search the knowledge base...",
    searchAction: "Search",
    searchTitle: "Search results",
    searchResultsFor: "Results for",
    searchEmptyTitle: "No results found",
    searchEmptyDescription: "Try a different word, or browse the categories.",
    searchPromptTitle: "Start with a word",
    searchPromptDescription: "Titles, content and tags are all searched.",
    browseTitle: "Categories",
    categories: "Categories",
    articles: "Articles",
    articleCount: "articles",
    noArticlesTitle: "No articles yet",
    noArticlesDescription: "Nothing has been published in this category yet.",
    noCategoriesTitle: "The knowledge base is empty",
    noCategoriesDescription: "No content has been published yet.",
    notFoundTitle: "Not found",
    notFoundDescription: "That page does not exist, or is not published.",
    backToPortal: "Back to portal",
    backToKnowledgeBase: "Back to the knowledge base",
    updatedAt: "Last updated",
    tags: "Tags",
    openArticle: "Open",
    loadError: "The knowledge base could not be loaded.",
    feedbackQuestion: "Was this helpful?",
    feedbackYes: "Yes",
    feedbackNo: "No",
    feedbackCommentPrompt: "Could you help us make it better?",
    feedbackCommentPlaceholder: "What was missing? (optional)",
    feedbackSend: "Send",
    feedbackSending: "Sending...",
    feedbackSkip: "Send without a comment",
    feedbackThanks: "Thanks for the feedback.",
    feedbackThanksNegative: "Thanks - this helps us improve it.",
    feedbackError: "That could not be sent. Please try again.",
    feedbackChange: "Change answer",
  },
};
