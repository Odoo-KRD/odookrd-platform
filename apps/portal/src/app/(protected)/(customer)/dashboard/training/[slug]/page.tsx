import {
  PERMISSIONS,
  type TrainingCatalogCourseDetail,
  type TrainingCertificateCourseStatus,
  type TrainingCourseCompletionStatus,
  type TrainingCourseProgressDetail,
} from "@odookrd/types";
import { NavigationArrowIcon, PageHeading, Panel } from "@odookrd/ui";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LessonTypeIcon } from "@/components/training/lesson-type-icon";
import { TrainingCertificateIssuer } from "@/components/training/training-certificate-issuer";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { trainingCertificateDictionaries } from "@/lib/i18n/training/certificates";
import { trainingCustomerDictionaries } from "@/lib/i18n/training/customer";
import { trainingCustomerWorkspaceDictionaries } from "@/lib/i18n/training/customer-workspace";
import { trainingAssessmentDictionaries } from "@/lib/i18n/training/assessment";
import { getTrainingDictionary } from "@/lib/i18n/training/server";
import { trainingLessonEditorDictionaries } from "@/lib/i18n/training/lesson-editor";
import { localizeTrainingText } from "@/lib/training-display";

function CountGlyph({ kind }: { kind: "sections" | "lessons" }) {
  return kind === "sections" ? (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M4 5.5h11a3 3 0 0 1 3 3V20H7a3 3 0 0 1-3-3V5.5Z" />
      <path d="M7 5.5V20M10 9h5M10 13h5" />
    </svg>
  );
}

export default async function CustomerTrainingCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ session, token }, { locale }, { slug }] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.TRAINING_READ),
    getTrainingDictionary(),
    params,
  ]);
  const labels = trainingCustomerDictionaries[locale];
  const workspace = trainingCustomerWorkspaceDictionaries[locale];
  const assessment = trainingAssessmentDictionaries[locale];
  const lessonLabels = trainingLessonEditorDictionaries[locale];

  let course: TrainingCatalogCourseDetail;
  let progress: TrainingCourseProgressDetail;
  let completionStatus: TrainingCourseCompletionStatus;
  let certificateStatus: TrainingCertificateCourseStatus;
  try {
    [course, progress, completionStatus, certificateStatus] = await Promise.all(
      [
        apiRequest<TrainingCatalogCourseDetail>(
          `/training/catalog/${encodeURIComponent(slug)}`,
          { token },
        ),
        apiRequest<TrainingCourseProgressDetail>(
          `/training/progress/courses/${encodeURIComponent(slug)}`,
          { token },
        ),
        apiRequest<TrainingCourseCompletionStatus>(
          `/training/completions/courses/${encodeURIComponent(slug)}`,
          { token },
        ),
        apiRequest<TrainingCertificateCourseStatus>(
          `/training/certificates/courses/${encodeURIComponent(slug)}`,
          { token },
        ),
      ],
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  const title = localizeTrainingText(
    course.title,
    course.titleTranslations,
    locale,
  );
  const category = localizeTrainingText(
    course.category.name,
    course.category.nameTranslations,
    locale,
  );
  const firstReadyLesson = course.sections
    .flatMap((section) => section.lessons)
    .find((lesson) => lesson.contentReady && !lesson.locked);
  const resumeLesson =
    course.sections
      .flatMap((section) => section.lessons)
      .find(
        (lesson) =>
          lesson.id === progress.resumeLessonId &&
          lesson.contentReady &&
          !lesson.locked,
      ) ?? firstReadyLesson;
  const progressByLesson = new Map(
    progress.lessons.map(
      (lessonProgress) => [lessonProgress.lessonId, lessonProgress] as const,
    ),
  );
  const courseActionLabel =
    completionStatus.completed || progress.status === "COMPLETED"
      ? workspace.reviewCourse
      : progress.status === "IN_PROGRESS"
        ? workspace.continueCourse
        : workspace.startCourse;
  const courseActionLesson = completionStatus.completed
    ? firstReadyLesson
    : resumeLesson;

  return (
    <div className="grid gap-7">
      <PageHeading
        title={title}
        description={category}
        actions={
          <>
            {hasPermission(session, PERMISSIONS.TRAINING_ASSIGN) ? (
              <Link
                href="/dashboard/training/manage"
                className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
              >
                {labels.manageTraining}
              </Link>
            ) : null}
            <Link
              href="/dashboard/training"
              className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
            >
              <NavigationArrowIcon
                direction={locale === "en" ? "left" : "right"}
                className="me-2 size-4"
              />
              {labels.backToCatalog}
            </Link>
          </>
        }
      />

      <section className="overflow-hidden rounded-xl border border-line bg-surface-panel shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                {category}
              </span>
              {firstReadyLesson ? (
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {workspace.readyContent}
                </span>
              ) : null}
            </div>

            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-content sm:text-3xl">
              {title}
            </h2>

            {course.summary ? (
              <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-muted sm:text-base">
                {localizeTrainingText(
                  course.summary,
                  course.summaryTranslations,
                  locale,
                )}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-content">
                <CountGlyph kind="sections" />
                <span className="font-semibold">{course.sectionCount}</span>
                <span className="text-muted">{labels.sections}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-content">
                <CountGlyph kind="lessons" />
                <span className="font-semibold">{course.lessonCount}</span>
                <span className="text-muted">{labels.lessons}</span>
              </div>
            </div>

            {progress.totalLessons > 0 ? (
              <div className="mt-7 max-w-xl">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted">
                  <span>{workspace.courseProgress}</span>
                  <span dir="ltr" className="font-semibold text-content">
                    {progress.percentage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  <span dir="ltr">
                    {progress.completedLessons} / {progress.totalLessons}
                  </span>{" "}
                  {workspace.lessonsCompleted}
                </p>
              </div>
            ) : null}

            <div className="mt-7">
              {courseActionLesson ? (
                <Link
                  href={`/dashboard/training/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(courseActionLesson.id)}`}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover"
                >
                  {courseActionLabel}
                </Link>
              ) : (
                <span className="inline-flex h-11 cursor-not-allowed items-center rounded-md border border-line bg-surface-subtle px-5 text-sm font-medium text-muted">
                  {workspace.lessonUnavailable}
                </span>
              )}
            </div>
          </div>

          <div className="min-h-64 bg-surface-subtle lg:min-h-full">
            {course.hasCover ? (
              <Image
                src={`/api/training/catalog/${encodeURIComponent(course.slug)}/cover`}
                alt=""
                width={960}
                height={540}
                unoptimized
                className="aspect-video h-full min-h-64 w-full object-cover lg:aspect-auto"
              />
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center px-8 text-center text-sm font-semibold text-muted">
                {labels.navigation}
              </div>
            )}
          </div>
        </div>
      </section>

      {completionStatus.completion ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-5 fill-none stroke-current"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-emerald-900">
                  {assessment.courseCompleted}
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                  {assessment.courseCompletedDescription}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-emerald-800">
                  <span>
                    {assessment.completedOn}:{" "}
                    {formatDate(
                      completionStatus.completion.completedAt,
                      locale,
                    )}
                  </span>
                  {completionStatus.completion.finalScorePercentage !== null ? (
                    <span>
                      {assessment.finalScore}:{" "}
                      <span dir="ltr">
                        {completionStatus.completion.finalScorePercentage}%
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {completionStatus.completed &&
      (certificateStatus.certificateEnabled || certificateStatus.issued) ? (
        <TrainingCertificateIssuer
          slug={course.slug}
          locale={locale}
          status={certificateStatus}
          labels={trainingCertificateDictionaries[locale]}
        />
      ) : null}

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
              {workspace.courseOverview}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-content">
              {labels.courseOutline}
            </h2>
          </div>
          <p className="text-sm text-muted">
            {course.sectionCount} {labels.sections} · {course.lessonCount}{" "}
            {labels.lessons}
          </p>
        </div>

        {course.sections.length === 0 ? (
          <Panel className="p-6 text-sm text-muted">
            {labels.noPublishedContent}
          </Panel>
        ) : (
          <div className="grid gap-3">
            {course.sections.map((section, sectionIndex) => {
              const sectionTitle = localizeTrainingText(
                section.title,
                section.titleTranslations,
                locale,
              );

              return (
                <details
                  key={section.id}
                  open
                  className="group overflow-hidden rounded-xl border border-line bg-surface-panel shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 marker:hidden sm:px-6">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-sm font-bold text-brand">
                      {sectionIndex + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-content sm:text-base">
                        {sectionTitle}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {section.lessons.length} {labels.lessons}
                      </p>
                    </div>
                    <svg
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      className="size-4 shrink-0 fill-none stroke-current text-muted transition-transform group-open:rotate-180"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 8 4 4 4-4" />
                    </svg>
                    <span className="sr-only">{workspace.expandSection}</span>
                  </summary>

                  <div className="border-t border-line bg-white">
                    {section.description ? (
                      <p className="border-b border-line px-5 py-4 text-sm leading-6 text-muted sm:px-6">
                        {localizeTrainingText(
                          section.description,
                          section.descriptionTranslations,
                          locale,
                        )}
                      </p>
                    ) : null}

                    {section.lessons.length === 0 ? (
                      <p className="px-5 py-5 text-sm text-muted sm:px-6">
                        {labels.noPublishedContent}
                      </p>
                    ) : (
                      <div className="divide-y divide-line">
                        {section.lessons.map((lesson, lessonIndex) => {
                          const lessonTitle = localizeTrainingText(
                            lesson.title,
                            lesson.titleTranslations,
                            locale,
                          );
                          const typeLabel = lesson.contentType
                            ? lessonLabels.contentTypes[lesson.contentType]
                            : workspace.lessonUnavailable;
                          const lessonProgress = progressByLesson.get(
                            lesson.id,
                          );
                          const accessible =
                            lesson.contentReady && !lesson.locked;

                          return (
                            <div
                              key={lesson.id}
                              className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-surface-subtle/60 sm:px-6"
                            >
                              <LessonTypeIcon
                                contentType={lesson.contentType}
                                label={typeLabel}
                              />

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-content">
                                  <span className="me-1 text-muted">
                                    {lessonIndex + 1}.
                                  </span>
                                  {lessonTitle}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                                  <span>{typeLabel}</span>
                                  {lessonProgress?.status === "COMPLETED" ? (
                                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                                      {workspace.completed}
                                    </span>
                                  ) : lessonProgress?.status ===
                                    "IN_PROGRESS" ? (
                                    <span className="inline-flex rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand">
                                      {workspace.inProgress}
                                    </span>
                                  ) : null}
                                  {lesson.requiredToContinue ? (
                                    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                                      {assessment.requiredToContinue}
                                    </span>
                                  ) : null}
                                  {lesson.locked ? (
                                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                                      {assessment.locked}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              {accessible ? (
                                <Link
                                  href={`/dashboard/training/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lesson.id)}`}
                                  className="inline-flex h-9 shrink-0 items-center rounded-md border border-brand/25 bg-brand-soft px-3 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
                                >
                                  {workspace.openLesson}
                                </Link>
                              ) : (
                                <span className="inline-flex h-8 shrink-0 items-center rounded-md border border-line bg-surface-subtle px-2.5 text-xs font-medium text-muted">
                                  {lesson.locked
                                    ? assessment.locked
                                    : workspace.lessonUnavailable}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>

      {course.finalQuiz ? (
        <section className="rounded-xl border border-line bg-surface-panel p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                  {assessment.finalAssessment}
                </span>
                {course.finalQuiz.requiredForCompletion ? (
                  <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {assessment.requiredForCompletion}
                  </span>
                ) : null}
                {course.finalQuiz.passed ? (
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {assessment.finalQuizPassed}
                  </span>
                ) : null}
              </div>

              <h2 className="mt-3 text-lg font-semibold text-content">
                {localizeTrainingText(
                  course.finalQuiz.title,
                  course.finalQuiz.titleTranslations,
                  locale,
                )}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {course.finalQuiz.passed
                  ? assessment.finalQuizPassed
                  : course.finalQuiz.available
                    ? assessment.finalQuizReady
                    : assessment.completeLessonsToUnlock}
              </p>
            </div>

            <div className="shrink-0">
              {course.finalQuiz.available ? (
                <Link
                  href={`/dashboard/training/${encodeURIComponent(course.slug)}/final-quiz`}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
                >
                  {course.finalQuiz.passed
                    ? assessment.reviewFinalQuiz
                    : assessment.openFinalQuiz}
                </Link>
              ) : (
                <span className="inline-flex h-10 cursor-not-allowed items-center rounded-md border border-line bg-surface-subtle px-4 text-sm font-medium text-muted">
                  {assessment.locked}
                </span>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
