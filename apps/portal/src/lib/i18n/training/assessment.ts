import type { Locale } from "@odookrd/types";
import { sharedText } from "../shared";

export interface TrainingAssessmentDictionary {
  locked: string;
  requiredToContinue: string;
  finalAssessment: string;
  finalQuizReady: string;
  finalQuizPassed: string;
  completeLessonsToUnlock: string;
  openFinalQuiz: string;
  reviewFinalQuiz: string;
  requiredForCompletion: string;
  backToCourse: string;
  courseCompleted: string;
  courseCompletedDescription: string;
  completedOn: string;
  finalScore: string;
}

export const trainingAssessmentDictionaries: Record<
  Locale,
  TrainingAssessmentDictionary
> = {
  en: {
    locked: "Locked",
    requiredToContinue: "Required to continue",
    finalAssessment: "Final assessment",
    finalQuizReady: "Your final quiz is ready.",
    finalQuizPassed: "Final quiz passed.",
    completeLessonsToUnlock:
      "Complete the required course lessons to unlock this assessment.",
    openFinalQuiz: "Open final quiz",
    reviewFinalQuiz: "Review final quiz",
    requiredForCompletion: "Required for completion",
    backToCourse: "Back to course",
    courseCompleted: sharedText.en.labels.courseCompleted,
    courseCompletedDescription:
      "You have completed all required learning for this course.",
    completedOn: "Completed on",
    finalScore: "Final score",
  },
  ku: {
    locked: "داخراوە",
    requiredToContinue: "پێویستە بۆ بەردەوامبوون",
    finalAssessment: "هەڵسەنگاندنی کۆتایی",
    finalQuizReady: "تاقیکردنەوەی کۆتایی ئامادەیە.",
    finalQuizPassed: "تاقیکردنەوەی کۆتایی تێپەڕێنراوە.",
    completeLessonsToUnlock:
      "وانە پێویستەکانی کۆرس تەواو بکە بۆ کردنەوەی ئەم هەڵسەنگاندنە.",
    openFinalQuiz: "کردنەوەی تاقیکردنەوەی کۆتایی",
    reviewFinalQuiz: "پێداچوونەوەی تاقیکردنەوەی کۆتایی",
    requiredForCompletion: "پێویستە بۆ تەواوکردن",
    backToCourse: "گەڕانەوە بۆ کۆرس",
    courseCompleted: "کۆرس تەواو کرا",
    courseCompletedDescription:
      "هەموو فێربوونە پێویستەکانی ئەم کۆرسە تەواو کردووە.",
    completedOn: "تەواوکرا لە",
    finalScore: "نمرەی کۆتایی",
  },
  ar: {
    locked: "مقفل",
    requiredToContinue: "مطلوب للمتابعة",
    finalAssessment: "التقييم النهائي",
    finalQuizReady: "الاختبار النهائي جاهز.",
    finalQuizPassed: "تم اجتياز الاختبار النهائي.",
    completeLessonsToUnlock: "أكمل دروس الدورة المطلوبة لفتح هذا التقييم.",
    openFinalQuiz: "فتح الاختبار النهائي",
    reviewFinalQuiz: "مراجعة الاختبار النهائي",
    requiredForCompletion: "مطلوب لإكمال الدورة",
    backToCourse: "العودة إلى الدورة",
    courseCompleted: "تم إكمال الدورة",
    courseCompletedDescription:
      "لقد أكملت جميع متطلبات التعلم المطلوبة لهذه الدورة.",
    completedOn: "تاريخ الإكمال",
    finalScore: "النتيجة النهائية",
  },
};
