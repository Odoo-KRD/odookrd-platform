import { PERMISSIONS, type TrainingCatalogCourseDetail } from "@odookrd/types";
import { NavigationArrowIcon } from "@odookrd/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrainingQuizPlayer } from "@/components/training/training-quiz-player";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { trainingAssessmentDictionaries } from "@/lib/i18n/training/assessment";
import { getTrainingDictionary } from "@/lib/i18n/training/server";
import { localizeTrainingText } from "@/lib/training-display";

export default async function CustomerTrainingFinalQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ token }, { locale }, { slug }] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.TRAINING_READ),
    getTrainingDictionary(),
    params,
  ]);

  let course: TrainingCatalogCourseDetail;
  try {
    course = await apiRequest<TrainingCatalogCourseDetail>(
      `/training/catalog/${encodeURIComponent(slug)}`,
      { token },
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  if (!course.finalQuiz?.available) notFound();

  const assessment = trainingAssessmentDictionaries[locale];
  const courseTitle = localizeTrainingText(
    course.title,
    course.titleTranslations,
    locale,
  );
  const quizTitle = localizeTrainingText(
    course.finalQuiz.title,
    course.finalQuiz.titleTranslations,
    locale,
  );

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-slate-950">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-slate-950/95 px-4 py-3 sm:px-6">
        <Link
          href={`/dashboard/training/${encodeURIComponent(course.slug)}`}
          className="inline-flex h-9 shrink-0 items-center rounded-md border border-white/10 px-3 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <NavigationArrowIcon
            direction={locale === "en" ? "left" : "right"}
            className="me-2 size-3.5"
          />
          {assessment.backToCourse}
        </Link>

        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-brand">
            {assessment.finalAssessment}
          </p>
          <p className="truncate text-sm font-semibold text-white">
            {courseTitle} · {quizTitle}
          </p>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <TrainingQuizPlayer
          courseSlug={course.slug}
          quizId={course.finalQuiz.id}
          locale={locale}
        />
      </main>
    </div>
  );
}
