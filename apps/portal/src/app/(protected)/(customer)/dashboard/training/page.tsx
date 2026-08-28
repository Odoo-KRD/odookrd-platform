import { PERMISSIONS, type TrainingCatalogPage } from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Image from "next/image";
import Link from "next/link";

import { apiRequest } from "@/lib/api";
import { getCustomerApiContext, hasPermission } from "@/lib/authorization";
import { trainingCustomerDictionaries } from "@/lib/i18n/training-customer";
import { getTrainingDictionary } from "@/lib/i18n/training-server";
import { localizeTrainingText } from "@/lib/training-display";

interface TrainingCatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function queryValue(
  value: string | string[] | undefined,
  maxLength: number,
): string {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

export default async function CustomerTrainingCatalogPage({
  searchParams,
}: TrainingCatalogPageProps) {
  const [{ session, token }, { locale }, parameters] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.TRAINING_READ),
    getTrainingDictionary(),
    searchParams,
  ]);
  const labels = trainingCustomerDictionaries[locale];
  const search = queryValue(parameters.q, 250).trim();
  const categoryId = queryValue(parameters.categoryId, 36);
  const rawOffset = Number(queryValue(parameters.offset, 12));
  const offset =
    Number.isSafeInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  const query = new URLSearchParams({
    limit: "24",
    offset: String(offset),
  });
  if (search) query.set("search", search);
  if (/^[0-9a-f-]{36}$/i.test(categoryId)) {
    query.set("categoryId", categoryId);
  }

  const result = await apiRequest<TrainingCatalogPage>(
    `/training/catalog?${query.toString()}`,
    { token },
  );
  const canAssign = hasPermission(session, PERMISSIONS.TRAINING_ASSIGN);

  const pageHref = (nextOffset: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (nextOffset > 0) params.set("offset", String(nextOffset));
    const suffix = params.toString();
    return suffix ? `/dashboard/training?${suffix}` : "/dashboard/training";
  };

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.catalogTitle}
        description={labels.catalogDescription}
        actions={
          canAssign && result.enabled ? (
            <Link
              href="/dashboard/training/manage"
              className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
            >
              {labels.manageTraining}
            </Link>
          ) : undefined
        }
      />

      {!result.enabled ? (
        <Panel className="p-6 sm:p-8">
          <EmptyState
            title={labels.disabledTitle}
            description={labels.disabledDescription}
          />
        </Panel>
      ) : (
        <>
          <Panel className="p-4">
            <form className="flex flex-wrap items-center gap-3" method="get">
              <input
                name="q"
                defaultValue={search}
                placeholder={labels.searchPlaceholder}
                className="h-10 min-w-[220px] flex-1 rounded-md border border-line bg-white px-3 text-sm text-content"
              />
              <select
                name="categoryId"
                defaultValue={categoryId}
                className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
              >
                <option value="">{labels.allCategories}</option>
                {result.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {localizeTrainingText(
                      category.name,
                      category.nameTranslations,
                      locale,
                    )}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
              >
                {labels.filter}
              </button>
              {search || categoryId ? (
                <Link
                  href="/dashboard/training"
                  className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
                >
                  {labels.clear}
                </Link>
              ) : null}
            </form>
          </Panel>

          {result.items.length === 0 ? (
            <Panel className="p-6 sm:p-8">
              <EmptyState
                title={labels.noCoursesTitle}
                description={labels.noCoursesDescription}
              />
            </Panel>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((course) => (
                <article
                  key={course.id}
                  className="overflow-hidden rounded-md border border-line bg-white"
                >
                  <div className="aspect-video bg-surface-subtle">
                    {course.hasCover ? (
                      <Image
                        src={`/api/training/catalog/${encodeURIComponent(course.slug)}/cover`}
                        alt=""
                        width={640}
                        height={360}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium text-muted">
                        {labels.navigation}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 p-5">
                    <div>
                      <p className="text-xs font-medium text-brand">
                        {localizeTrainingText(
                          course.category.name,
                          course.category.nameTranslations,
                          locale,
                        )}
                      </p>
                      <h2 className="mt-2 text-base font-semibold text-content">
                        {localizeTrainingText(
                          course.title,
                          course.titleTranslations,
                          locale,
                        )}
                      </h2>
                      {course.summary ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                          {localizeTrainingText(
                            course.summary,
                            course.summaryTranslations,
                            locale,
                          )}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>
                        {course.sectionCount} {labels.sections}
                      </span>
                      <span>
                        {course.lessonCount} {labels.lessons}
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/training/${encodeURIComponent(course.slug)}`}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-3 text-sm font-medium text-white hover:bg-brand-hover"
                    >
                      {labels.viewCourse}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <p>
              {result.pagination.total} {labels.records}
            </p>
            <div className="flex items-center gap-2">
              {result.pagination.offset > 0 ? (
                <Link
                  href={pageHref(
                    Math.max(
                      0,
                      result.pagination.offset - result.pagination.limit,
                    ),
                  )}
                  className="inline-flex h-9 items-center rounded-md border border-line px-3 font-medium text-content hover:bg-surface-subtle"
                >
                  {labels.previous}
                </Link>
              ) : null}
              {result.pagination.offset + result.pagination.limit <
              result.pagination.total ? (
                <Link
                  href={pageHref(
                    result.pagination.offset + result.pagination.limit,
                  )}
                  className="inline-flex h-9 items-center rounded-md border border-line px-3 font-medium text-content hover:bg-surface-subtle"
                >
                  {labels.next}
                </Link>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
