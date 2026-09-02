import type { Locale } from "@odookrd/types";

export interface TrainingQuizDictionary {
  title: string;
  finalQuiz: string;
  finalQuizDescription: string;
  backToCourseEditor: string;
  loading: string;
  settings: string;
  questions: string;
  noQuiz: string;
  noQuestions: string;
  version: string;
  draft: string;
  published: string;
  createVersion: string;
  save: string;
  saveQuestion: string;
  saved: string;
  publish: string;
  publishConfirm: string;
  addQuestion: string;
  editQuestion: string;
  deleteQuestion: string;
  deleteConfirm: string;
  actions: string;
  moveUp: string;
  moveDown: string;
  quizTitle: string;
  instructions: string;
  passingScore: string;
  maxAttempts: string;
  unlimited: string;
  timeLimitMinutes: string;
  noTimeLimit: string;
  requiredForCompletion: string;
  requiredToContinue: string;
  shuffleQuestions: string;
  shuffleOptions: string;
  revealAnswers: string;
  questionType: string;
  prompt: string;
  explanation: string;
  points: string;
  options: string;
  option: string;
  correct: string;
  addOption: string;
  removeOption: string;
  cancel: string;
  questionTypes: Record<
    "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE",
    string
  >;
  languages: Record<Locale, string>;
  errors: {
    load: string;
    request: string;
    title: string;
    prompt: string;
    options: string;
  };
}

export const trainingQuizDictionaries: Record<Locale, TrainingQuizDictionary> =
  {
    en: {
      title: "Quiz Builder",
      finalQuiz: "Final Quiz",
      finalQuizDescription:
        "Build and publish the versioned final assessment for this course.",
      backToCourseEditor: "Back to course editor",
      loading: "Loading quiz…",
      settings: "Quiz settings",
      questions: "Questions",
      noQuiz: "No quiz is configured yet.",
      noQuestions: "No questions have been added to this draft.",
      version: "Version",
      draft: "Draft",
      published: "Published",
      createVersion: "Create new version",
      save: "Save quiz",
      saveQuestion: "Save question",
      saved: "Quiz saved.",
      publish: "Publish version",
      publishConfirm:
        "Publish this quiz version? Published versions are immutable.",
      addQuestion: "Add question",
      editQuestion: "Edit question",
      deleteQuestion: "Delete question",
      deleteConfirm: "Delete this question?",
      actions: "Actions",
      moveUp: "Move up",
      moveDown: "Move down",
      quizTitle: "Quiz title",
      instructions: "Instructions",
      passingScore: "Passing score (%)",
      maxAttempts: "Maximum attempts",
      unlimited: "Unlimited",
      timeLimitMinutes: "Time limit (minutes)",
      noTimeLimit: "No time limit",
      requiredForCompletion: "Required for course completion",
      requiredToContinue: "Learner must pass before continuing",
      shuffleQuestions: "Shuffle questions",
      shuffleOptions: "Shuffle options",
      revealAnswers: "Reveal answers after submission",
      questionType: "Question type",
      prompt: "Question",
      explanation: "Explanation after submission",
      points: "Points",
      options: "Answer options",
      option: "Option",
      correct: "Correct",
      addOption: "Add option",
      removeOption: "Remove option",
      cancel: "Cancel",
      questionTypes: {
        SINGLE_CHOICE: "Single choice",
        MULTIPLE_CHOICE: "Multiple choice",
        TRUE_FALSE: "True / False",
      },
      languages: { ku: "Kurdish", ar: "Arabic", en: "English" },
      errors: {
        load: "The quiz could not be loaded.",
        request: "The quiz operation could not be completed.",
        title: "Enter a quiz title in at least one language.",
        prompt: "Enter the question in at least one language.",
        options:
          "Configure at least two valid answer options and the correct answer.",
      },
    },
    ku: {
      title: "دروستکەری تاقیکردنەوە",
      finalQuiz: "تاقیکردنەوەی کۆتایی",
      finalQuizDescription:
        "تاقیکردنەوەی کۆتایی کۆرس بە وەشانە پارێزراوەکان دروست و بڵاوبکەرەوە.",
      backToCourseEditor: "گەڕانەوە بۆ دەستکاریکەری کۆرس",
      loading: "تاقیکردنەوە بار دەکرێت…",
      settings: "ڕێکخستنەکانی تاقیکردنەوە",
      questions: "پرسیارەکان",
      noQuiz: "هێشتا هیچ تاقیکردنەوەیەک ڕێکنەخراوە.",
      noQuestions: "هێشتا هیچ پرسیارێک بۆ ئەم ڕەشنووسە زیاد نەکراوە.",
      version: "وەشان",
      draft: "ڕەشنووس",
      published: "بڵاوکراوە",
      createVersion: "دروستکردنی وەشانی نوێ",
      save: "پاشەکەوتکردنی تاقیکردنەوە",
      saveQuestion: "پاشەکەوتکردنی پرسیار",
      saved: "تاقیکردنەوە پاشەکەوت کرا.",
      publish: "بڵاوکردنەوەی وەشان",
      publishConfirm:
        "ئەم وەشانە بڵاوبکرێتەوە؟ وەشانی بڵاوکراوە دەستکاری ناکرێت.",
      addQuestion: "زیادکردنی پرسیار",
      editQuestion: "دەستکاریکردنی پرسیار",
      deleteQuestion: "سڕینەوەی پرسیار",
      deleteConfirm: "ئەم پرسیارە بسڕدرێتەوە؟",
      actions: "کردارەکان",
      moveUp: "بەرەو سەرەوە",
      moveDown: "بەرەو خوارەوە",
      quizTitle: "ناونیشانی تاقیکردنەوە",
      instructions: "ڕێنماییەکان",
      passingScore: "ڕێژەی دەرچوون (%)",
      maxAttempts: "زۆرترین ژمارەی هەوڵ",
      unlimited: "بێ سنوور",
      timeLimitMinutes: "سنووری کات (خولەک)",
      noTimeLimit: "بێ سنووری کات",
      requiredForCompletion: "پێویستە بۆ تەواوکردنی کۆرس",
      requiredToContinue: "پێویستە فێرخواز پێش بەردەوامبوون دەرچێت",
      shuffleQuestions: "تێکەڵکردنی پرسیارەکان",
      shuffleOptions: "تێکەڵکردنی هەڵبژاردەکان",
      revealAnswers: "دوای ناردن وەڵامەکان پیشان بدە",
      questionType: "جۆری پرسیار",
      prompt: "پرسیار",
      explanation: "ڕوونکردنەوە دوای ناردن",
      points: "خاڵ",
      options: "هەڵبژاردەکانی وەڵام",
      option: "هەڵبژاردە",
      correct: "دروست",
      addOption: "زیادکردنی هەڵبژاردە",
      removeOption: "سڕینەوەی هەڵبژاردە",
      cancel: "پاشگەزبوونەوە",
      questionTypes: {
        SINGLE_CHOICE: "یەک هەڵبژاردە",
        MULTIPLE_CHOICE: "چەند هەڵبژاردە",
        TRUE_FALSE: "ڕاست / هەڵە",
      },
      languages: { ku: "کوردی", ar: "عەرەبی", en: "ئینگلیزی" },
      errors: {
        load: "تاقیکردنەوە بار نەکرا.",
        request: "کرداری تاقیکردنەوە جێبەجێ نەکرا.",
        title: "لە یەکێک لە زمانەکاندا ناونیشان بنووسە.",
        prompt: "لە یەکێک لە زمانەکاندا پرسیار بنووسە.",
        options: "لانیکەم دوو هەڵبژاردە و وەڵامی دروست ڕێکبخە.",
      },
    },
    ar: {
      title: "منشئ الاختبار",
      finalQuiz: "الاختبار النهائي",
      finalQuizDescription:
        "أنشئ وانشر التقييم النهائي متعدد الإصدارات لهذه الدورة.",
      backToCourseEditor: "العودة إلى محرر الدورة",
      loading: "جارٍ تحميل الاختبار…",
      settings: "إعدادات الاختبار",
      questions: "الأسئلة",
      noQuiz: "لم يتم إعداد اختبار بعد.",
      noQuestions: "لم تتم إضافة أسئلة إلى هذه المسودة بعد.",
      version: "الإصدار",
      draft: "مسودة",
      published: "منشور",
      createVersion: "إنشاء إصدار جديد",
      save: "حفظ الاختبار",
      saveQuestion: "حفظ السؤال",
      saved: "تم حفظ الاختبار.",
      publish: "نشر الإصدار",
      publishConfirm:
        "هل تريد نشر هذا الإصدار؟ الإصدارات المنشورة غير قابلة للتعديل.",
      addQuestion: "إضافة سؤال",
      editQuestion: "تعديل السؤال",
      deleteQuestion: "حذف السؤال",
      deleteConfirm: "حذف هذا السؤال؟",
      actions: "الإجراءات",
      moveUp: "تحريك لأعلى",
      moveDown: "تحريك لأسفل",
      quizTitle: "عنوان الاختبار",
      instructions: "التعليمات",
      passingScore: "درجة النجاح (%)",
      maxAttempts: "الحد الأقصى للمحاولات",
      unlimited: "غير محدود",
      timeLimitMinutes: "الحد الزمني (دقيقة)",
      noTimeLimit: "بدون حد زمني",
      requiredForCompletion: "مطلوب لإكمال الدورة",
      requiredToContinue: "يجب النجاح قبل المتابعة",
      shuffleQuestions: "ترتيب الأسئلة عشوائياً",
      shuffleOptions: "ترتيب الخيارات عشوائياً",
      revealAnswers: "إظهار الإجابات بعد التسليم",
      questionType: "نوع السؤال",
      prompt: "السؤال",
      explanation: "الشرح بعد التسليم",
      points: "النقاط",
      options: "خيارات الإجابة",
      option: "خيار",
      correct: "صحيح",
      addOption: "إضافة خيار",
      removeOption: "حذف الخيار",
      cancel: "إلغاء",
      questionTypes: {
        SINGLE_CHOICE: "اختيار واحد",
        MULTIPLE_CHOICE: "اختيارات متعددة",
        TRUE_FALSE: "صح / خطأ",
      },
      languages: { ku: "الكردية", ar: "العربية", en: "الإنجليزية" },
      errors: {
        load: "تعذر تحميل الاختبار.",
        request: "تعذر إكمال عملية الاختبار.",
        title: "أدخل عنوان الاختبار بلغة واحدة على الأقل.",
        prompt: "أدخل السؤال بلغة واحدة على الأقل.",
        options: "أعد خيارين صالحين على الأقل وحدد الإجابة الصحيحة.",
      },
    },
  };
