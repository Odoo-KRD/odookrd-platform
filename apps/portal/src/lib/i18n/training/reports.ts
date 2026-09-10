import type {
  Locale,
  TrainingCertificateStatus,
  TrainingCourseStatus,
  TrainingQuizPlacement,
  TrainingQuizStatus,
} from "@odookrd/types";
import { uiChrome } from "../ui-chrome";

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
    overview: "پوختە",
    courses: "کۆرسەکان",
    learners: "فێرخوازان",
    quizzes: "تاقیکردنەوەکان",
    certificates: "بڕوانامەکان",
    allCompanies: "هەموو کۆمپانیاکان",
    allCourses: "هەموو کۆرسەکان",
    allCategories: "هەموو پۆلەکان",
    dateFrom: "لە بەرواری",
    dateTo: "تا بەرواری",
    filter: uiChrome.ku.filter,
    clearFilters: "پاککردنەوە",
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
    course: "کۆرس",
    category: "پۆل",
    status: "دۆخ",
    learner: "فێرخواز",
    email: "ئیمەیڵ",
    company: "کۆمپانیا",
    completedCourses: "کۆرسە تەواوکراوەکان",
    certificatesCount: "بڕوانامەکان",
    latestActivity: "دوایین چالاکی",
    placement: "شوێن",
    attempts: "هەوڵەکان",
    passed: "سەرکەوتوو",
    failed: "شکستخواردوو",
    learnersCount: "فێرخوازان",
    averageScore: "تێکڕای نمرە",
    latestAttempt: "دوایین هەوڵ",
    certificateNumber: "ژمارەی بڕوانامە",
    score: "نمرە",
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
      DRAFT: "ڕەشنووس",
      PUBLISHED: "بڵاوکراوە",
      ARCHIVED: "ئەرشیفکراو",
    },
    quizStatus: {
      DRAFT: "ڕەشنووس",
      PUBLISHED: "بڵاوکراوە",
      ARCHIVED: "ئەرشیفکراو",
    },
    quizPlacement: {
      SECTION: "بەش",
      COURSE_FINAL: "کۆتایی کۆرس",
    },
    certificateStatus: {
      ACTIVE: "چالاک",
      REVOKED: "هەڵوەشێنراو",
    },
  },
  ar: {
    navigation: "التقارير",
    title: "تقارير وتحليلات التدريب",
    description:
      "حلّل نشاط المتعلمين وإكمال الدورات والاختبارات والشهادات حسب الشركة والدورة.",
    overview: "نظرة عامة",
    courses: "الدورات",
    learners: "المتعلمون",
    quizzes: "الاختبارات",
    certificates: "الشهادات",
    allCompanies: "كل الشركات",
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
    course: "الدورة",
    category: "الفئة",
    status: "الحالة",
    learner: "المتعلم",
    email: "البريد الإلكتروني",
    company: "الشركة",
    completedCourses: "الدورات المكتملة",
    certificatesCount: "الشهادات",
    latestActivity: "آخر نشاط",
    placement: "الموضع",
    attempts: "المحاولات",
    passed: "ناجح",
    failed: "راسب",
    learnersCount: "المتعلمون",
    averageScore: "متوسط النتيجة",
    latestAttempt: "آخر محاولة",
    certificateNumber: "رقم الشهادة",
    score: "النتيجة",
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
      DRAFT: "مسودة",
      PUBLISHED: "منشورة",
      ARCHIVED: "مؤرشفة",
    },
    quizStatus: {
      DRAFT: "مسودة",
      PUBLISHED: "منشور",
      ARCHIVED: "مؤرشف",
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
    overview: "Overview",
    courses: "Courses",
    learners: "Learners",
    quizzes: "Quizzes",
    certificates: "Certificates",
    allCompanies: "All companies",
    allCourses: "All courses",
    allCategories: "All categories",
    dateFrom: "Date from",
    dateTo: "Date to",
    filter: uiChrome.en.filter,
    clearFilters: "Clear filters",
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
    course: "Course",
    category: "Category",
    status: "Status",
    learner: "Learner",
    email: "Email",
    company: "Company",
    completedCourses: "Completed courses",
    certificatesCount: "Certificates",
    latestActivity: "Latest activity",
    placement: "Placement",
    attempts: "Attempts",
    passed: "Passed",
    failed: "Failed",
    learnersCount: "Learners",
    averageScore: "Average score",
    latestAttempt: "Latest attempt",
    certificateNumber: "Certificate number",
    score: "Score",
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
      DRAFT: "Draft",
      PUBLISHED: "Published",
      ARCHIVED: "Archived",
    },
    quizStatus: {
      DRAFT: "Draft",
      PUBLISHED: "Published",
      ARCHIVED: "Archived",
    },
    quizPlacement: {
      SECTION: "Section",
      COURSE_FINAL: "Course final",
    },
    certificateStatus: {
      ACTIVE: "Active",
      REVOKED: "Revoked",
    },
  },
};
