import { PERMISSIONS, type TrainingCatalogPage } from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Image from "next/image";
import Link from "next/link";

import { apiRequest } from "@/lib/api";
import { getCustomerApiContext, hasPermission } from "@/lib/authorization";
import { trainingCustomerDictionaries } from "@/lib/i18n/training-customer";
import { trainingCustomerWorkspaceDictionaries } from "@/lib/i18n/training-customer-workspace";
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

function CountIcon({ kind }: { kind: "sections" | "lessons" }) {
  return kind === "sections" ? (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M4 5.5h11a3 3 0 0 1 3 3V20H7a3 3 0 0 1-3-3V5.5Z" />
      <path d="M7 5.5V20M10 9h5M10 13h5" />
    </svg>
  );
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
  const workspace = trainingCustomerWorkspaceDictionaries[locale];
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
              className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
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
          <section className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                  {workspace.courseLibrary}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-content">
                  {workspace.availableCourses}
                </h2>
              </div>
              <p className="text-sm text-muted">
                {result.pagination.total} {labels.records}
              </p>
            </div>

            <Panel className="p-4">
              <form
                className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_minmax(220px,320px)_auto_auto]"
                method="get"
              >
                <input
                  name="q"
                  defaultValue={search}
                  placeholder={labels.searchPlaceholder}
                  className="h-10 min-w-0 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
                <select
                  name="categoryId"
                  defaultValue={categoryId}
                  className="h-10 min-w-0 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
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
                  className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
                >
                  {labels.filter}
                </button>
                {search || categoryId ? (
                  <Link
                    href="/dashboard/training"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
                  >
                    {labels.clear}
                  </Link>
                ) : (
                  <span className="hidden lg:block" />
                )}
              </form>
            </Panel>
          </section>

          {result.items.length === 0 ? (
            <Panel className="p-6 sm:p-8">
              <EmptyState
                title={labels.noCoursesTitle}
                description={labels.noCoursesDescription}
              />
            </Panel>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {result.items.map((course) => {
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

                return (
                  <article
                    key={course.id}
                    className="group flex min-h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-panel shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <Link
                      href={`/dashboard/training/${encodeURIComponent(course.slug)}`}
                      className="block overflow-hidden bg-surface-subtle"
                      aria-label={title}
                    >
                      <div className="aspect-video overflow-hidden">
                        {course.hasCover ? (
                          <Image
                            src={`/api/training/catalog/${encodeURIComponent(course.slug)}/cover`}
                            alt=""
                            width={640}
                            height={360}
                            unoptimized
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-surface-subtle px-6 text-center text-sm font-semibold text-muted">
                            {labels.navigation}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex max-w-full rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
                          <span className="truncate">{category}</span>
                        </span>
                      </div>

                      <Link
                        href={`/dashboard/training/${encodeURIComponent(course.slug)}`}
                        className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-content hover:text-brand"
                      >
                        {title}
                      </Link>

                      {course.summary ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                          {localizeTrainingText(
                            course.summary,
                            course.summaryTranslations,
                            locale,
                          )}
                        </p>
                      ) : (
                        <div className="min-h-[4.5rem]" />
                      )}

                      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <CountIcon kind="sections" />
                          {course.sectionCount} {labels.sections}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CountIcon kind="lessons" />
                          {course.lessonCount} {labels.lessons}
                        </span>
                      </div>

                      <Link
                        href={`/dashboard/training/${encodeURIComponent(course.slug)}`}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
                      >
                        {labels.viewCourse}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm text-muted">
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
                  className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 font-medium text-content hover:bg-surface-subtle"
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
                  className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 font-medium text-content hover:bg-surface-subtle"
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
