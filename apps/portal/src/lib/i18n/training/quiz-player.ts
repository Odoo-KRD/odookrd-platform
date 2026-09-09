import type { Locale } from "@odookrd/types";

export interface TrainingQuizPlayerDictionary {
  loading: string;
  unavailable: string;
  quiz: string;
  questions: string;
  points: string;
  passingScore: string;
  attempts: string;
  unlimited: string;
  timeLimit: string;
  minutes: string;
  startQuiz: string;
  resumeQuiz: string;
  attempt: string;
  timeRemaining: string;
  saving: string;
  saved: string;
  previous: string;
  next: string;
  submit: string;
  submitConfirm: string;
  passed: string;
  failed: string;
  expired: string;
  score: string;
  retry: string;
  noAttempts: string;
  correct: string;
  incorrect: string;
  unanswered: string;
  selectOne: string;
  selectMultiple: string;
  requestFailed: string;
}

export const trainingQuizPlayerDictionaries: Record<
  Locale,
  TrainingQuizPlayerDictionary
> = {
  ku: {
    loading: "تاقیکردنەوە بار دەکرێت...",
    unavailable: "ئەم تاقیکردنەوەیە لە ئێستادا بەردەست نییە.",
    quiz: "تاقیکردنەوە",
    questions: "پرسیار",
    points: "خاڵ",
    passingScore: "نمرەی دەرچوون",
    attempts: "هەوڵەکان",
    unlimited: "بێ سنوور",
    timeLimit: "سنووری کات",
    minutes: "خولەک",
    startQuiz: "دەستپێکردنی تاقیکردنەوە",
    resumeQuiz: "بەردەوامبوون لە تاقیکردنەوە",
    attempt: "هەوڵ",
    timeRemaining: "کاتی ماوە",
    saving: "پاشەکەوت دەکرێت...",
    saved: "پاشەکەوت کرا",
    previous: "پێشوو",
    next: "دواتر",
    submit: "ناردنی وەڵامەکان",
    submitConfirm:
      "دڵنیایت لە ناردنی تاقیکردنەوە؟ دوای ناردن ناتوانیت وەڵامەکان بگۆڕیت.",
    passed: "دەرچوویت",
    failed: "دەرنەچوویت",
    expired: "کاتی تاقیکردنەوە تەواو بوو",
    score: "نمرە",
    retry: "هەوڵدانەوە",
    noAttempts: "هیچ هەوڵێکی تر نەماوە.",
    correct: "دروست",
    incorrect: "هەڵە",
    unanswered: "بێ وەڵام",
    selectOne: "یەک وەڵام هەڵبژێرە.",
    selectMultiple: "هەموو وەڵامە دروستەکان هەڵبژێرە.",
    requestFailed: "کردارەکە سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدە.",
  },
  ar: {
    loading: "جارٍ تحميل الاختبار...",
    unavailable: "هذا الاختبار غير متاح حالياً.",
    quiz: "الاختبار",
    questions: "أسئلة",
    points: "نقاط",
    passingScore: "درجة النجاح",
    attempts: "المحاولات",
    unlimited: "غير محدود",
    timeLimit: "الوقت المحدد",
    minutes: "دقيقة",
    startQuiz: "بدء الاختبار",
    resumeQuiz: "متابعة الاختبار",
    attempt: "المحاولة",
    timeRemaining: "الوقت المتبقي",
    saving: "جارٍ الحفظ...",
    saved: "تم الحفظ",
    previous: "السابق",
    next: "التالي",
    submit: "إرسال الإجابات",
    submitConfirm:
      "هل أنت متأكد من إرسال الاختبار؟ لن تتمكن من تعديل الإجابات بعد الإرسال.",
    passed: "ناجح",
    failed: "غير ناجح",
    expired: "انتهى وقت الاختبار",
    score: "النتيجة",
    retry: "إعادة المحاولة",
    noAttempts: "لا توجد محاولات متبقية.",
    correct: "صحيح",
    incorrect: "غير صحيح",
    unanswered: "بدون إجابة",
    selectOne: "اختر إجابة واحدة.",
    selectMultiple: "اختر جميع الإجابات الصحيحة.",
    requestFailed: "تعذر إكمال العملية. حاول مرة أخرى.",
  },
  en: {
    loading: "Loading quiz...",
    unavailable: "This quiz is not currently available.",
    quiz: "Quiz",
    questions: "Questions",
    points: "Points",
    passingScore: "Passing score",
    attempts: "Attempts",
    unlimited: "Unlimited",
    timeLimit: "Time limit",
    minutes: "minutes",
    startQuiz: "Start quiz",
    resumeQuiz: "Resume quiz",
    attempt: "Attempt",
    timeRemaining: "Time remaining",
    saving: "Saving...",
    saved: "Saved",
    previous: "Previous",
    next: "Next",
    submit: "Submit answers",
    submitConfirm:
      "Submit this quiz? You will not be able to change your answers afterward.",
    passed: "Passed",
    failed: "Not passed",
    expired: "Quiz time expired",
    score: "Score",
    retry: "Try again",
    noAttempts: "No attempts remain.",
    correct: "Correct",
    incorrect: "Incorrect",
    unanswered: "Unanswered",
    selectOne: "Select one answer.",
    selectMultiple: "Select all correct answers.",
    requestFailed: "The quiz operation could not be completed. Please retry.",
  },
};
