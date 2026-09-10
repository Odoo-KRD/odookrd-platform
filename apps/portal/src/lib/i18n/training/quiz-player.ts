import type { Locale } from "@odookrd/types";

import { uiChrome } from "../ui-chrome";
import { sharedText } from "../shared";

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
    quiz: sharedText.ku.labels.quiz,
    questions: "پرسیار",
    points: "خاڵ",
    passingScore: "نمرەی دەرچوون",
    attempts: sharedText.ku.labels.attempts,
    unlimited: "بێ سنوور",
    timeLimit: "سنووری کات",
    minutes: "خولەک",
    startQuiz: "دەستپێکردنی تاقیکردنەوە",
    resumeQuiz: "بەردەوامبوون لە تاقیکردنەوە",
    attempt: "هەوڵ",
    timeRemaining: "کاتی ماوە",
    saving: sharedText.ku.actions.saving,
    saved: "پاشەکەوت کرا",
    previous: uiChrome.ku.previous,
    next: uiChrome.ku.next,
    submit: "ناردنی وەڵامەکان",
    submitConfirm:
      "دڵنیایت لە ناردنی تاقیکردنەوە؟ دوای ناردن ناتوانیت وەڵامەکان بگۆڕیت.",
    passed: "دەرچوویت",
    failed: "دەرنەچوویت",
    expired: "کاتی تاقیکردنەوە تەواو بوو",
    score: sharedText.ku.labels.score,
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
    attempts: sharedText.ar.labels.attempts,
    unlimited: "غير محدود",
    timeLimit: "الوقت المحدد",
    minutes: "دقيقة",
    startQuiz: "بدء الاختبار",
    resumeQuiz: "متابعة الاختبار",
    attempt: "المحاولة",
    timeRemaining: "الوقت المتبقي",
    saving: sharedText.ar.actions.saving,
    saved: "تم الحفظ",
    previous: uiChrome.ar.previous,
    next: uiChrome.ar.next,
    submit: "إرسال الإجابات",
    submitConfirm:
      "هل أنت متأكد من إرسال الاختبار؟ لن تتمكن من تعديل الإجابات بعد الإرسال.",
    passed: sharedText.ar.labels.passed,
    failed: "غير ناجح",
    expired: "انتهى وقت الاختبار",
    score: sharedText.ar.labels.score,
    retry: sharedText.ar.actions.retry,
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
    quiz: sharedText.en.labels.quiz,
    questions: "Questions",
    points: "Points",
    passingScore: "Passing score",
    attempts: sharedText.en.labels.attempts,
    unlimited: "Unlimited",
    timeLimit: "Time limit",
    minutes: "minutes",
    startQuiz: "Start quiz",
    resumeQuiz: "Resume quiz",
    attempt: "Attempt",
    timeRemaining: "Time remaining",
    saving: sharedText.en.actions.saving,
    saved: "Saved",
    previous: uiChrome.en.previous,
    next: uiChrome.en.next,
    submit: "Submit answers",
    submitConfirm:
      "Submit this quiz? You will not be able to change your answers afterward.",
    passed: sharedText.en.labels.passed,
    failed: "Not passed",
    expired: "Quiz time expired",
    score: sharedText.en.labels.score,
    retry: sharedText.en.actions.retry,
    noAttempts: "No attempts remain.",
    correct: "Correct",
    incorrect: "Incorrect",
    unanswered: "Unanswered",
    selectOne: "Select one answer.",
    selectMultiple: "Select all correct answers.",
    requestFailed: "The quiz operation could not be completed. Please retry.",
  },
};
