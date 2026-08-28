import { PERMISSIONS, type TrainingCatalogCourseDetail } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext, hasPermission } from "@/lib/authorization";
import { trainingCustomerDictionaries } from "@/lib/i18n/training-customer";
import { getTrainingDictionary } from "@/lib/i18n/training-server";
import { localizeTrainingText } from "@/lib/training-display";

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

  const title = localizeTrainingText(
    course.title,
    course.titleTranslations,
    locale,
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={title}
        description={localizeTrainingText(
          course.category.name,
          course.category.nameTranslations,
          locale,
        )}
        actions={
          <>
            {hasPermission(session, PERMISSIONS.TRAINING_ASSIGN) ? (
              <Link
                href="/dashboard/training/manage"
                className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
              >
                {labels.manageTraining}
              </Link>
            ) : null}
            <Link
              href="/dashboard/training"
              className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
            >
              {labels.backToCatalog}
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Panel className="p-6 sm:p-8">
          {course.summary ? (
            <p className="whitespace-pre-line text-sm leading-7 text-content">
              {localizeTrainingText(
                course.summary,
                course.summaryTranslations,
                locale,
              )}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
            <span>
              {course.sectionCount} {labels.sections}
            </span>
            <span>
              {course.lessonCount} {labels.lessons}
            </span>
          </div>
        </Panel>

        <div className="overflow-hidden rounded-md border border-line bg-surface-subtle">
          {course.hasCover ? (
            <Image
              src={`/api/training/catalog/${encodeURIComponent(course.slug)}/cover`}
              alt=""
              width={800}
              height={450}
              unoptimized
              className="aspect-video h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm font-medium text-muted">
              {labels.navigation}
            </div>
          )}
        </div>
      </div>

      <section className="grid gap-4">
        <h2 className="text-base font-semibold text-content">
          {labels.courseOutline}
        </h2>
        {course.sections.length === 0 ? (
          <Panel className="p-6 text-sm text-muted">
            {labels.noPublishedContent}
          </Panel>
        ) : (
          course.sections.map((section, sectionIndex) => (
            <Panel key={section.id} className="p-5 sm:p-6">
              <div>
                <p className="text-xs font-medium text-brand">
                  {labels.sections} {sectionIndex + 1}
                </p>
                <h3 className="mt-1 text-base font-semibold text-content">
                  {localizeTrainingText(
                    section.title,
                    section.titleTranslations,
                    locale,
                  )}
                </h3>
                {section.description ? (
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {localizeTrainingText(
                      section.description,
                      section.descriptionTranslations,
                      locale,
                    )}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 divide-y divide-line border-t border-line">
                {section.lessons.length === 0 ? (
                  <p className="py-4 text-sm text-muted">
                    {labels.noPublishedContent}
                  </p>
                ) : (
                  section.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-content">
                          {lessonIndex + 1}.{" "}
                          {localizeTrainingText(
                            lesson.title,
                            lesson.titleTranslations,
                            locale,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {labels.mediaComing}
                        </p>
                      </div>
                      <span className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-muted">
                        {labels.lessons}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          ))
        )}
      </section>
    </div>
  );
}
