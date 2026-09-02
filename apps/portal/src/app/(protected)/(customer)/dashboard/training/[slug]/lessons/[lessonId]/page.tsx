import {
  PERMISSIONS,
  type TrainingCatalogCourseDetail,
  type TrainingCatalogLesson,
  type TrainingCourseProgressDetail,
  type TrainingCustomerLessonDetail,
  type TrainingCustomerVideoEnrichment,
  type TrainingPlayerSettings,
} from "@odookrd/types";
import { NavigationArrowIcon } from "@odookrd/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CoursePlayerChaptersPanel } from "@/components/training/course-player-chapters-panel";
import { CoursePlayerShell } from "@/components/training/course-player-shell";
import { LessonMediaPlayer } from "@/components/training/lesson-media-player";
import { LessonTypeIcon } from "@/components/training/lesson-type-icon";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { trainingCustomerWorkspaceDictionaries } from "@/lib/i18n/training-customer-workspace";
import { trainingAssessmentDictionaries } from "@/lib/i18n/training-assessment";
import { trainingLessonEditorDictionaries } from "@/lib/i18n/training-lesson-editor";
import { trainingMediaDictionaries } from "@/lib/i18n/training-media";
import { getTrainingDictionary } from "@/lib/i18n/training-server";
import { localizeTrainingText } from "@/lib/training-display";

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let amount = value;
  let unit = 0;

  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024;
    unit += 1;
  }

  const precision = unit === 0 || amount >= 100 ? 0 : amount >= 10 ? 1 : 2;
  return `${amount.toFixed(precision)} ${units[unit]}`;
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 fill-none stroke-current"
      strokeWidth="1.7"
    >
      <path d="M7 3.5h6l4 4V20H7z" />
      <path d="M13 3.5V8h4" />
    </svg>
  );
}

function Curriculum({
  course,
  currentLessonId,
  locale,
  progress,
}: {
  course: TrainingCatalogCourseDetail;
  currentLessonId: string;
  locale: "ku" | "ar" | "en";
  progress: TrainingCourseProgressDetail;
}) {
  const workspace = trainingCustomerWorkspaceDictionaries[locale];
  const assessment = trainingAssessmentDictionaries[locale];
  const lessonLabels = trainingLessonEditorDictionaries[locale];

  return (
    <div>
      <div className="border-b border-white/10 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
          {workspace.courseContent}
        </p>
        <h2 className="mt-1 truncate text-sm font-semibold text-white">
          {localizeTrainingText(course.title, course.titleTranslations, locale)}
        </h2>
        <p className="mt-1 text-[11px] text-slate-400">
          {course.sectionCount} {workspace.sectionLabel} · {course.lessonCount}{" "}
          {workspace.lessonLabel}
        </p>
      </div>

      {course.sections.map((section, sectionIndex) => {
        const containsCurrent = section.lessons.some(
          (lesson) => lesson.id === currentLessonId,
        );

        return (
          <details
            key={section.id}
            open={containsCurrent}
            className="group border-b border-white/10"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 bg-slate-800/80 px-4 py-3 marker:hidden hover:bg-slate-800">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white">
                {sectionIndex + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-100">
                  {localizeTrainingText(
                    section.title,
                    section.titleTranslations,
                    locale,
                  )}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {section.lessons.length} {workspace.lessonLabel}
                </p>
              </div>
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="size-4 shrink-0 fill-none stroke-current text-slate-500 transition-transform group-open:rotate-180"
                strokeWidth="1.8"
              >
                <path d="m6 8 4 4 4-4" />
              </svg>
            </summary>

            <div className="divide-y divide-white/5">
              {section.lessons.map((lesson, lessonIndex) => {
                const current = lesson.id === currentLessonId;
                const typeLabel = lesson.contentType
                  ? lessonLabels.contentTypes[lesson.contentType]
                  : workspace.lessonUnavailable;
                const title = localizeTrainingText(
                  lesson.title,
                  lesson.titleTranslations,
                  locale,
                );
                const lessonProgress = progress.lessons.find(
                  (item) => item.lessonId === lesson.id,
                );
                const accessible = lesson.contentReady && !lesson.locked;

                const row = (
                  <>
                    <LessonTypeIcon
                      contentType={lesson.contentType}
                      label={typeLabel}
                      variant="dark"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs leading-5 ${
                          current
                            ? "font-semibold text-white"
                            : "font-medium text-slate-300"
                        }`}
                      >
                        <span className="me-1 text-[10px] text-slate-500">
                          {lessonIndex + 1}.
                        </span>
                        {title}
                      </p>
                      {lessonProgress?.status === "COMPLETED" ? (
                        <p className="mt-0.5 text-[10px] font-semibold text-emerald-400">
                          {workspace.completed}
                        </p>
                      ) : lessonProgress?.status === "IN_PROGRESS" ? (
                        <p className="mt-0.5 text-[10px] font-semibold text-brand">
                          {workspace.inProgress}
                        </p>
                      ) : lesson.locked ? (
                        <p className="mt-0.5 text-[10px] font-semibold text-amber-300">
                          {assessment.locked}
                        </p>
                      ) : null}
                    </div>
                  </>
                );

                return accessible ? (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/training/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lesson.id)}`}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3 transition ${
                      current
                        ? "border-s-2 border-brand bg-brand/20"
                        : "border-s-2 border-transparent hover:bg-white/5"
                    }`}
                  >
                    {row}
                  </Link>
                ) : (
                  <div
                    key={lesson.id}
                    className="flex cursor-not-allowed items-center gap-3 border-s-2 border-transparent px-4 py-3 opacity-45"
                  >
                    {row}
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ResourcesPanel({
  lesson,
  locale,
}: {
  lesson: TrainingCustomerLessonDetail;
  locale: "ku" | "ar" | "en";
}) {
  const workspace = trainingCustomerWorkspaceDictionaries[locale];

  return (
    <div className="box-border w-full ps-4 pe-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
        {workspace.resources}
      </p>

      {lesson.resources.length === 0 ? (
        <p className="mt-4 text-xs leading-5 text-slate-400">
          {workspace.noResources}
        </p>
      ) : (
        <div className="mt-3 grid gap-2">
          {lesson.resources.map((resource) => (
            <div
              key={resource.id}
              className="rounded-lg border border-white/10 bg-white/[0.035] p-3"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-brand/20 text-brand">
                  <FileIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-100">
                    {localizeTrainingText(
                      resource.title,
                      resource.titleTranslations,
                      locale,
                    )}
                  </p>
                  <p
                    dir="auto"
                    className="mt-1 truncate text-[10px] text-slate-500"
                  >
                    {resource.originalFilename} ·{" "}
                    <span dir="ltr">{formatBytes(resource.sizeBytes)}</span>
                  </p>
                </div>
              </div>
              <a
                href={`/api${resource.downloadPath}`}
                className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-md border border-white/10 text-[11px] font-semibold text-slate-200 hover:bg-white/5"
              >
                {workspace.download}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function readyLessons(
  course: TrainingCatalogCourseDetail,
): TrainingCatalogLesson[] {
  return course.sections
    .flatMap((section) => section.lessons)
    .filter((lesson) => lesson.contentReady && !lesson.locked);
}

export default async function CustomerTrainingLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const [{ token }, { locale }, { slug, lessonId }] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.TRAINING_READ),
    getTrainingDictionary(),
    params,
  ]);

  let lesson: TrainingCustomerLessonDetail;
  let course: TrainingCatalogCourseDetail;
  let enrichment: TrainingCustomerVideoEnrichment;
  let playerSettings: TrainingPlayerSettings;
  let courseProgress: TrainingCourseProgressDetail;

  try {
    [lesson, course, enrichment, playerSettings, courseProgress] =
      await Promise.all([
        apiRequest<TrainingCustomerLessonDetail>(
          `/training/catalog/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonId)}`,
          { token },
        ),
        apiRequest<TrainingCatalogCourseDetail>(
          `/training/catalog/${encodeURIComponent(slug)}`,
          { token },
        ),
        apiRequest<TrainingCustomerVideoEnrichment>(
          `/training/catalog/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonId)}/enrichment`,
          { token },
        ),
        apiRequest<TrainingPlayerSettings>("/training/player-settings", {
          token,
        }),
        apiRequest<TrainingCourseProgressDetail>(
          `/training/progress/courses/${encodeURIComponent(slug)}`,
          { token },
        ),
      ]);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  if (
    lesson.courseId !== course.id ||
    !course.sections.some((section) =>
      section.lessons.some((item) => item.id === lesson.id),
    )
  ) {
    notFound();
  }

  const mediaLabels = trainingMediaDictionaries[locale];
  const workspace = trainingCustomerWorkspaceDictionaries[locale];
  const assessment = trainingAssessmentDictionaries[locale];
  const lessonLabels = trainingLessonEditorDictionaries[locale];
  const courseTitle = localizeTrainingText(
    course.title,
    course.titleTranslations,
    locale,
  );
  const lessonTitle = localizeTrainingText(
    lesson.title,
    lesson.titleTranslations,
    locale,
  );

  const sequence = readyLessons(course);
  const currentIndex = sequence.findIndex((item) => item.id === lesson.id);
  const previousLesson =
    currentIndex > 0 ? sequence[currentIndex - 1] : undefined;
  const nextLesson =
    currentIndex >= 0 && currentIndex < sequence.length - 1
      ? sequence[currentIndex + 1]
      : undefined;
  const typeLabel = lesson.contentType
    ? lessonLabels.contentTypes[lesson.contentType]
    : workspace.lessonUnavailable;

  const lessonsPanel = (
    <Curriculum
      course={course}
      currentLessonId={lesson.id}
      locale={locale}
      progress={courseProgress}
    />
  );

  const resourcesPanel = <ResourcesPanel lesson={lesson} locale={locale} />;

  const chaptersPanel =
    lesson.contentType === "VIDEO" &&
    playerSettings.showChapters &&
    enrichment.chapters.length > 0 ? (
      <CoursePlayerChaptersPanel
        chapters={enrichment.chapters}
        locale={locale}
      />
    ) : undefined;

  const currentLessonProgress =
    courseProgress.lessons.find((item) => item.lessonId === lesson.id) ?? null;

  const media = (
    <LessonMediaPlayer
      key={lesson.id}
      lesson={lesson}
      courseSlug={course.slug}
      progress={currentLessonProgress}
      progressLabels={{
        completed: workspace.completed,
        markAsComplete: workspace.markAsComplete,
        markingComplete: workspace.markingComplete,
      }}
      labels={mediaLabels}
      locale={locale}
      enrichment={enrichment}
      playerSettings={playerSettings}
    />
  );

  const lessonMeta = (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="rounded-full bg-brand/25 px-2 py-0.5 font-semibold text-brand">
            {typeLabel}
          </span>
          <span dir="ltr">
            {currentIndex >= 0 ? currentIndex + 1 : 1} / {sequence.length || 1}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-white">
          {lessonTitle}
        </p>
      </div>

      {lesson.description ? (
        <details className="group max-w-xl">
          <summary className="cursor-pointer list-none text-[11px] font-semibold text-slate-400 hover:text-white marker:hidden">
            {workspace.lessonInformation}
          </summary>
          <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-400">
            {localizeTrainingText(
              lesson.description,
              lesson.descriptionTranslations,
              locale,
            )}
          </p>
        </details>
      ) : null}
    </div>
  );

  const navigation = (
    <nav
      aria-label={workspace.curriculum}
      className="flex min-w-0 items-center justify-between gap-3"
    >
      <div>
        {previousLesson ? (
          <Link
            href={`/dashboard/training/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(previousLesson.id)}`}
            className="inline-flex h-8 items-center rounded-md px-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <NavigationArrowIcon
              direction={locale === "en" ? "left" : "right"}
              className="me-2 size-3.5"
            />
            {workspace.previousLesson}
          </Link>
        ) : null}
      </div>

      <div>
        {nextLesson ? (
          <Link
            href={`/dashboard/training/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(nextLesson.id)}`}
            className="inline-flex h-8 items-center rounded-md bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover"
          >
            {workspace.nextLesson}
            <NavigationArrowIcon
              direction={locale === "en" ? "right" : "left"}
              className="ms-2 size-3.5"
            />
          </Link>
        ) : course.finalQuiz?.available ? (
          <Link
            href={`/dashboard/training/${encodeURIComponent(course.slug)}/final-quiz`}
            className="inline-flex h-8 items-center rounded-md bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover"
          >
            {course.finalQuiz.passed
              ? assessment.reviewFinalQuiz
              : assessment.openFinalQuiz}
            <NavigationArrowIcon
              direction={locale === "en" ? "right" : "left"}
              className="ms-2 size-3.5"
            />
          </Link>
        ) : null}
      </div>
    </nav>
  );

  return (
    <div className="h-[100dvh] w-full">
      <CoursePlayerShell
        courseTitle={courseTitle}
        lessonTitle={lessonTitle}
        backHref={`/dashboard/training/${encodeURIComponent(course.slug)}`}
        labels={{
          lessons: workspace.lessonsTab,
          chapters: workspace.chaptersTab,
          resources: workspace.resourcesTab,
          enterFullscreen: workspace.enterFullscreen,
          exitFullscreen: workspace.exitFullscreen,
          collapseSidebar: workspace.collapseCourseSidebar,
          expandSidebar: workspace.expandCourseSidebar,
          closeSidebar: workspace.closeCourseSidebar,
          backToCourse: mediaLabels.backToCourse,
        }}
        lessonsPanel={lessonsPanel}
        chaptersPanel={chaptersPanel}
        resourcesPanel={resourcesPanel}
        lessonsCount={course.lessonCount}
        chaptersCount={
          playerSettings.showChapters ? enrichment.chapters.length : 0
        }
        resourcesCount={lesson.resources.length}
        media={media}
        lessonMeta={lessonMeta}
        navigation={navigation}
      />
    </div>
  );
}
