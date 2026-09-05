import type { ApiLocale } from '../../i18n/types';
import { resolveLocalizedText } from '../../i18n/localized-content';

interface CourseCsvRow {
  title: string;
  titleTranslations: unknown;
  category: {
    name: string;
    nameTranslations: unknown;
  };
  status: string;
  engagedLearners: number;
  completions: number;
  quizAttempts: number;
  quizPasses: number;
  quizPassRate: number | null;
  quizAverageScore: number | null;
  certificatesIssued: number;
  latestActivityAt: string | null;
}

interface LearnerCsvRow {
  email: string;
  learnerName: string;
  company: {
    name: string;
    nameTranslations: unknown;
  };
  coursesEngaged: number;
  completedCourses: number;
  quizAttempts: number;
  quizPassRate: number | null;
  quizAverageScore: number | null;
  certificatesIssued: number;
  latestActivityAt: string | null;
}

interface QuizCsvRow {
  title: string;
  titleTranslations: unknown;
  placement: string;
  status: string;
  course: {
    title: string;
    titleTranslations: unknown;
  };
  learners: number;
  attempts: number;
  passed: number;
  failed: number;
  passRate: number | null;
  averagePercentage: number | null;
  latestAttemptAt: string | null;
}

interface CertificateCsvRow {
  certificateNumber: string;
  learnerName: string;
  learnerEmail: string;
  companyName: string;
  courseTitle: string;
  courseTitleTranslations: unknown;
  scorePercentage: number | null;
  status: string;
  issuedAt: string;
  revokedAt: string | null;
}

const headers = {
  en: {
    course: 'Course',
    category: 'Category',
    status: 'Status',
    learners: 'Learners',
    completions: 'Completions',
    quizAttempts: 'Quiz attempts',
    quizPasses: 'Quiz passes',
    quizPassRate: 'Quiz pass rate',
    averageScore: 'Average score',
    certificates: 'Certificates',
    latestActivity: 'Latest activity',
    learner: 'Learner',
    email: 'Email',
    company: 'Company',
    coursesEngaged: 'Courses engaged',
    completedCourses: 'Completed courses',
    quiz: 'Quiz',
    placement: 'Placement',
    attempts: 'Attempts',
    passed: 'Passed',
    failed: 'Failed',
    latestAttempt: 'Latest attempt',
    certificateNumber: 'Certificate number',
    score: 'Score',
    issuedAt: 'Issued at',
    revokedAt: 'Revoked at',
  },
  ar: {
    course: 'الدورة',
    category: 'الفئة',
    status: 'الحالة',
    learners: 'المتعلمون',
    completions: 'الإكمالات',
    quizAttempts: 'محاولات الاختبار',
    quizPasses: 'الاختبارات الناجحة',
    quizPassRate: 'نسبة النجاح',
    averageScore: 'متوسط النتيجة',
    certificates: 'الشهادات',
    latestActivity: 'آخر نشاط',
    learner: 'المتعلم',
    email: 'البريد الإلكتروني',
    company: 'الشركة',
    coursesEngaged: 'الدورات النشطة',
    completedCourses: 'الدورات المكتملة',
    quiz: 'الاختبار',
    placement: 'الموضع',
    attempts: 'المحاولات',
    passed: 'ناجح',
    failed: 'راسب',
    latestAttempt: 'آخر محاولة',
    certificateNumber: 'رقم الشهادة',
    score: 'النتيجة',
    issuedAt: 'تاريخ الإصدار',
    revokedAt: 'تاريخ الإلغاء',
  },
  ku: {
    course: 'کۆرس',
    category: 'پۆل',
    status: 'دۆخ',
    learners: 'فێرخوازان',
    completions: 'تەواوکردنەکان',
    quizAttempts: 'هەوڵەکانی تاقیکردنەوە',
    quizPasses: 'هەوڵە سەرکەوتووەکان',
    quizPassRate: 'ڕێژەی سەرکەوتن',
    averageScore: 'تێکڕای نمرە',
    certificates: 'بڕوانامەکان',
    latestActivity: 'دوایین چالاکی',
    learner: 'فێرخواز',
    email: 'ئیمەیڵ',
    company: 'کۆمپانیا',
    coursesEngaged: 'کۆرسە چالاکەکان',
    completedCourses: 'کۆرسە تەواوکراوەکان',
    quiz: 'تاقیکردنەوە',
    placement: 'شوێن',
    attempts: 'هەوڵەکان',
    passed: 'سەرکەوتوو',
    failed: 'شکستخواردوو',
    latestAttempt: 'دوایین هەوڵ',
    certificateNumber: 'ژمارەی بڕوانامە',
    score: 'نمرە',
    issuedAt: 'بەرواری دەرکردن',
    revokedAt: 'بەرواری هەڵوەشاندنەوە',
  },
} as const;

function localized(
  fallback: string,
  translations: unknown,
  locale: ApiLocale,
): string {
  return resolveLocalizedText(translations, locale, fallback) ?? fallback;
}

export function protectTrainingReportCsvCell(value: string): string {
  return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number | null): string {
  const normalized =
    value === null ? '' : protectTrainingReportCsvCell(String(value));
  return `"${normalized.replaceAll('"', '""')}"`;
}

function csv(rows: Array<Array<string | number | null>>): string {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function buildTrainingCourseReportCsv(
  locale: ApiLocale,
  rows: readonly CourseCsvRow[],
): string {
  const label = headers[locale];

  return csv([
    [
      label.course,
      label.category,
      label.status,
      label.learners,
      label.completions,
      label.quizAttempts,
      label.quizPasses,
      label.quizPassRate,
      label.averageScore,
      label.certificates,
      label.latestActivity,
    ],
    ...rows.map((row) => [
      localized(row.title, row.titleTranslations, locale),
      localized(row.category.name, row.category.nameTranslations, locale),
      row.status,
      row.engagedLearners,
      row.completions,
      row.quizAttempts,
      row.quizPasses,
      row.quizPassRate,
      row.quizAverageScore,
      row.certificatesIssued,
      row.latestActivityAt,
    ]),
  ]);
}

export function buildTrainingLearnerReportCsv(
  locale: ApiLocale,
  rows: readonly LearnerCsvRow[],
): string {
  const label = headers[locale];

  return csv([
    [
      label.learner,
      label.email,
      label.company,
      label.coursesEngaged,
      label.completedCourses,
      label.quizAttempts,
      label.quizPassRate,
      label.averageScore,
      label.certificates,
      label.latestActivity,
    ],
    ...rows.map((row) => [
      row.learnerName,
      row.email,
      localized(row.company.name, row.company.nameTranslations, locale),
      row.coursesEngaged,
      row.completedCourses,
      row.quizAttempts,
      row.quizPassRate,
      row.quizAverageScore,
      row.certificatesIssued,
      row.latestActivityAt,
    ]),
  ]);
}

export function buildTrainingQuizReportCsv(
  locale: ApiLocale,
  rows: readonly QuizCsvRow[],
): string {
  const label = headers[locale];

  return csv([
    [
      label.quiz,
      label.course,
      label.placement,
      label.status,
      label.learners,
      label.attempts,
      label.passed,
      label.failed,
      label.quizPassRate,
      label.averageScore,
      label.latestAttempt,
    ],
    ...rows.map((row) => [
      localized(row.title, row.titleTranslations, locale),
      localized(row.course.title, row.course.titleTranslations, locale),
      row.placement,
      row.status,
      row.learners,
      row.attempts,
      row.passed,
      row.failed,
      row.passRate,
      row.averagePercentage,
      row.latestAttemptAt,
    ]),
  ]);
}

export function buildTrainingCertificateReportCsv(
  locale: ApiLocale,
  rows: readonly CertificateCsvRow[],
): string {
  const label = headers[locale];

  return csv([
    [
      label.certificateNumber,
      label.learner,
      label.email,
      label.company,
      label.course,
      label.score,
      label.status,
      label.issuedAt,
      label.revokedAt,
    ],
    ...rows.map((row) => [
      row.certificateNumber,
      row.learnerName,
      row.learnerEmail,
      row.companyName,
      localized(row.courseTitle, row.courseTitleTranslations, locale),
      row.scorePercentage,
      row.status,
      row.issuedAt,
      row.revokedAt,
    ]),
  ]);
}
