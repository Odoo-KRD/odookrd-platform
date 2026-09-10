import type {
  Locale,
  TrainingCertificateStatus,
  TrainingCourseStatus,
  TrainingQuizPlacement,
  TrainingQuizStatus,
} from "@odookrd/types";
import { uiChrome } from "../ui-chrome";
import { sharedText } from "../shared";

export interface TrainingReportsDictionary {
  navigation: string;
  title: string;
  description: string;
  overview: string;
  courses: string;
  learners: string;
  quizzes: string;
  certificates: string;
  allCompanies: string;
  allCourses: string;
  allCategories: string;
  dateFrom: string;
  dateTo: string;
  filter: string;
  clearFilters: string;
  exportCsv: string;
  activeLearners: string;
  coursesEngaged: string;
  completions: string;
  quizAttempts: string;
  quizPassRate: string;
  quizAverageScore: string;
  certificatesIssued: string;
  activeCertificates: string;
  revokedCertificates: string;
  course: string;
  category: string;
  status: string;
  learner: string;
  email: string;
  company: string;
  completedCourses: string;
  certificatesCount: string;
  latestActivity: string;
  placement: string;
  attempts: string;
  passed: string;
  failed: string;
  learnersCount: string;
  averageScore: string;
  latestAttempt: string;
  certificateNumber: string;
  score: string;
  issuedAt: string;
  revokedAt: string;
  records: string;
  previous: string;
  next: string;
  noResults: string;
  noResultsDescription: string;
  overviewHint: string;
  courseStatus: Record<TrainingCourseStatus, string>;
  quizStatus: Record<TrainingQuizStatus, string>;
  quizPlacement: Record<TrainingQuizPlacement, string>;
  certificateStatus: Record<TrainingCertificateStatus, string>;
}

export const trainingReportsDictionaries: Record<
  Locale,
  TrainingReportsDictionary
> = {
  ku: {
    navigation: "ڕاپۆرتەکان",
    title: "ڕاپۆرت و شیکاری فێرکاری",
    description:
      "چالاکی فێرخوازان، تەواوکردنی کۆرس، تاقیکردنەوە و بڕوانامەکان بە پێی کۆمپانیا و کۆرس شیکاربکە.",
    overview: sharedText.ku.labels.overview,
    courses: sharedText.ku.labels.courses,
    learners: "فێرخوازان",
    quizzes: sharedText.ku.labels.quizzes,
    certificates: sharedText.ku.labels.certificates,
    allCompanies: sharedText.ku.labels.allCompanies,
    allCourses: "هەموو کۆرسەکان",
    allCategories: sharedText.ku.labels.allCategories,
    dateFrom: "لە بەرواری",
    dateTo: "تا بەرواری",
    filter: uiChrome.ku.filter,
    clearFilters: sharedText.ku.labels.clearFilters,
    exportCsv: "هەناردەی CSV",
    activeLearners: "فێرخوازانی چالاک",
    coursesEngaged: "کۆرسە چالاکەکان",
    completions: "تەواوکردنەکان",
    quizAttempts: "هەوڵەکانی تاقیکردنەوە",
    quizPassRate: "ڕێژەی سەرکەوتن",
    quizAverageScore: "تێکڕای نمرەی تاقیکردنەوە",
    certificatesIssued: "بڕوانامە دەرکراوەکان",
    activeCertificates: "بڕوانامە چالاکەکان",
    revokedCertificates: "بڕوانامە هەڵوەشێنراوەکان",
    course: sharedText.ku.labels.course,
    category: sharedText.ku.labels.category,
    status: "دۆخ",
    learner: sharedText.ku.labels.learner,
    email: "ئیمەیڵ",
    company: "کۆمپانیا",
    completedCourses: "کۆرسە تەواوکراوەکان",
    certificatesCount: "بڕوانامەکان",
    latestActivity: "دوایین چالاکی",
    placement: "شوێن",
    attempts: sharedText.ku.labels.attempts,
    passed: sharedText.ku.labels.passed,
    failed: "شکستخواردوو",
    learnersCount: "فێرخوازان",
    averageScore: "تێکڕای نمرە",
    latestAttempt: "دوایین هەوڵ",
    certificateNumber: sharedText.ku.labels.certificateNumber,
    score: sharedText.ku.labels.score,
    issuedAt: "دەرکراوە لە",
    revokedAt: "هەڵوەشێنراوە لە",
    records: "تۆمار",
    previous: uiChrome.ku.previous,
    next: uiChrome.ku.next,
    noResults: "هیچ داتایەک نەدۆزرایەوە.",
    noResultsDescription:
      "پاڵاوتنەکان بگۆڕە یان دوای تۆماربوونی چالاکی فێرکاری دووبارە بگەڕێوە.",
    overviewHint:
      "فێرخوازانی چالاک لەسەر بنەمای دوایین دەستگەیشتن بە کۆرس لە ماوەی هەڵبژێردراودا هەژمار دەکرێن.",
    courseStatus: {
      DRAFT: sharedText.ku.status.DRAFT,
      PUBLISHED: sharedText.ku.status.PUBLISHED,
      ARCHIVED: sharedText.ku.status.ARCHIVED,
    },
    quizStatus: {
      DRAFT: sharedText.ku.status.DRAFT,
      PUBLISHED: sharedText.ku.status.PUBLISHED,
      ARCHIVED: sharedText.ku.status.ARCHIVED,
    },
    quizPlacement: {
      SECTION: "بەش",
      COURSE_FINAL: "کۆتایی کۆرس",
    },
    certificateStatus: {
      ACTIVE: sharedText.ku.status.ACTIVE,
      REVOKED: "هەڵوەشێنراو",
    },
  },
  ar: {
    navigation: "التقارير",
    title: "تقارير وتحليلات التدريب",
    description:
      "حلّل نشاط المتعلمين وإكمال الدورات والاختبارات والشهادات حسب الشركة والدورة.",
    overview: sharedText.ar.labels.overview,
    courses: sharedText.ar.labels.courses,
    learners: "المتعلمون",
    quizzes: sharedText.ar.labels.quizzes,
    certificates: sharedText.ar.labels.certificates,
    allCompanies: sharedText.ar.labels.allCompanies,
    allCourses: "كل الدورات",
    allCategories: "كل الفئات",
    dateFrom: "من تاريخ",
    dateTo: "إلى تاريخ",
    filter: uiChrome.ar.filter,
    clearFilters: "مسح التصفية",
    exportCsv: "تصدير CSV",
    activeLearners: "المتعلمون النشطون",
    coursesEngaged: "الدورات النشطة",
    completions: "الإكمالات",
    quizAttempts: "محاولات الاختبار",
    quizPassRate: "نسبة النجاح",
    quizAverageScore: "متوسط نتيجة الاختبار",
    certificatesIssued: "الشهادات الصادرة",
    activeCertificates: "الشهادات النشطة",
    revokedCertificates: "الشهادات الملغاة",
    course: sharedText.ar.labels.course,
    category: sharedText.ar.labels.category,
    status: "الحالة",
    learner: sharedText.ar.labels.learner,
    email: "البريد الإلكتروني",
    company: "الشركة",
    completedCourses: "الدورات المكتملة",
    certificatesCount: "الشهادات",
    latestActivity: "آخر نشاط",
    placement: "الموضع",
    attempts: sharedText.ar.labels.attempts,
    passed: sharedText.ar.labels.passed,
    failed: "راسب",
    learnersCount: "المتعلمون",
    averageScore: "متوسط النتيجة",
    latestAttempt: "آخر محاولة",
    certificateNumber: sharedText.ar.labels.certificateNumber,
    score: sharedText.ar.labels.score,
    issuedAt: "تاريخ الإصدار",
    revokedAt: "تاريخ الإلغاء",
    records: "سجل",
    previous: uiChrome.ar.previous,
    next: uiChrome.ar.next,
    noResults: "لا توجد بيانات مطابقة.",
    noResultsDescription: "غيّر عوامل التصفية أو عد بعد تسجيل نشاط تدريبي.",
    overviewHint:
      "يُحتسب المتعلمون النشطون من آخر وصول إلى الدورة ضمن الفترة المحددة.",
    courseStatus: {
      DRAFT: sharedText.ar.status.DRAFT,
      PUBLISHED: "منشورة",
      ARCHIVED: "مؤرشفة",
    },
    quizStatus: {
      DRAFT: sharedText.ar.status.DRAFT,
      PUBLISHED: sharedText.ar.status.PUBLISHED,
      ARCHIVED: sharedText.ar.status.ARCHIVED,
    },
    quizPlacement: {
      SECTION: "قسم",
      COURSE_FINAL: "نهائي الدورة",
    },
    certificateStatus: {
      ACTIVE: "نشطة",
      REVOKED: "ملغاة",
    },
  },
  en: {
    navigation: "Reports",
    title: "Training Reports & Analytics",
    description:
      "Analyze learner activity, course completion, quiz performance and certificates by company and course.",
    overview: sharedText.en.labels.overview,
    courses: sharedText.en.labels.courses,
    learners: "Learners",
    quizzes: sharedText.en.labels.quizzes,
    certificates: sharedText.en.labels.certificates,
    allCompanies: sharedText.en.labels.allCompanies,
    allCourses: "All courses",
    allCategories: sharedText.en.labels.allCategories,
    dateFrom: "Date from",
    dateTo: "Date to",
    filter: uiChrome.en.filter,
    clearFilters: sharedText.en.labels.clearFilters,
    exportCsv: "Export CSV",
    activeLearners: "Active learners",
    coursesEngaged: "Courses engaged",
    completions: "Completions",
    quizAttempts: "Quiz attempts",
    quizPassRate: "Quiz pass rate",
    quizAverageScore: "Average quiz score",
    certificatesIssued: "Certificates issued",
    activeCertificates: "Active certificates",
    revokedCertificates: "Revoked certificates",
    course: sharedText.en.labels.course,
    category: sharedText.en.labels.category,
    status: "Status",
    learner: sharedText.en.labels.learner,
    email: "Email",
    company: "Company",
    completedCourses: "Completed courses",
    certificatesCount: "Certificates",
    latestActivity: "Latest activity",
    placement: "Placement",
    attempts: sharedText.en.labels.attempts,
    passed: sharedText.en.labels.passed,
    failed: "Failed",
    learnersCount: "Learners",
    averageScore: "Average score",
    latestAttempt: "Latest attempt",
    certificateNumber: sharedText.en.labels.certificateNumber,
    score: sharedText.en.labels.score,
    issuedAt: "Issued at",
    revokedAt: "Revoked at",
    records: "records",
    previous: uiChrome.en.previous,
    next: uiChrome.en.next,
    noResults: "No matching reporting data.",
    noResultsDescription:
      "Adjust the filters or return after training activity has been recorded.",
    overviewHint:
      "Active learners are counted from course-progress access within the selected period.",
    courseStatus: {
      DRAFT: sharedText.en.status.DRAFT,
      PUBLISHED: sharedText.en.status.PUBLISHED,
      ARCHIVED: sharedText.en.status.ARCHIVED,
    },
    quizStatus: {
      DRAFT: sharedText.en.status.DRAFT,
      PUBLISHED: sharedText.en.status.PUBLISHED,
      ARCHIVED: sharedText.en.status.ARCHIVED,
    },
    quizPlacement: {
      SECTION: "Section",
      COURSE_FINAL: "Course final",
    },
    certificateStatus: {
      ACTIVE: sharedText.en.status.ACTIVE,
      REVOKED: "Revoked",
    },
  },
};
