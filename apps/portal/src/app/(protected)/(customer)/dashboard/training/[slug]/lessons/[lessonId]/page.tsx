import { PERMISSIONS, type TrainingCustomerLessonDetail } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LessonMediaPlayer } from "@/components/training/lesson-media-player";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { trainingMediaDictionaries } from "@/lib/i18n/training-media";
import { getTrainingDictionary } from "@/lib/i18n/training-server";
import { localizeTrainingText } from "@/lib/training-display";

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
  try {
    lesson = await apiRequest<TrainingCustomerLessonDetail>(
      `/training/catalog/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonId)}`,
      { token },
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
  const labels = trainingMediaDictionaries[locale];
  const title = localizeTrainingText(
    lesson.title,
    lesson.titleTranslations,
    locale,
  );
  const resourceHeading =
    locale === "ku" ? "سەرچاوەکان" : locale === "ar" ? "الموارد" : "Resources";
  const downloadLabel =
    locale === "ku" ? "داگرتن" : locale === "ar" ? "تنزيل" : "Download";

  return (
    <div className="grid gap-7">
      <PageHeading
        title={title}
        description={
          lesson.description
            ? localizeTrainingText(
                lesson.description,
                lesson.descriptionTranslations,
                locale,
              )
            : labels.description
        }
        actions={
          <Link
            href={`/dashboard/training/${encodeURIComponent(slug)}`}
            className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            {labels.backToCourse}
          </Link>
        }
      />
      <LessonMediaPlayer lesson={lesson} labels={labels} locale={locale} />
      {lesson.resources.length > 0 ? (
        <Panel className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-content">
            {resourceHeading}
          </h2>
          <div className="mt-4 divide-y divide-line rounded-md border border-line">
            {lesson.resources.map((resource) => (
              <div
                key={resource.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-content">
                    {localizeTrainingText(
                      resource.title,
                      resource.titleTranslations,
                      locale,
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {resource.originalFilename}
                  </p>
                </div>
                <a
                  href={`/api${resource.downloadPath}`}
                  className="inline-flex h-8 items-center rounded-md border border-line px-3 text-xs font-medium text-content hover:bg-surface-subtle"
                >
                  {downloadLabel}
                </a>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
      {lesson.description ? (
        <Panel className="p-5 text-sm leading-7 text-content sm:p-6">
          {localizeTrainingText(
            lesson.description,
            lesson.descriptionTranslations,
            locale,
          )}
        </Panel>
      ) : null}
    </div>
  );
}
