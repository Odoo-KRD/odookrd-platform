import type { Locale, TrainingContinueLearningItem } from "@odookrd/types";
import Image from "next/image";
import Link from "next/link";

import { trainingCustomerWorkspaceDictionaries } from "@/lib/i18n/training-customer-workspace";
import { localizeTrainingText } from "@/lib/training-display";

export function TrainingContinueLearning({
  items,
  locale,
}: {
  items: TrainingContinueLearningItem[];
  locale: Locale;
}) {
  if (items.length === 0) return null;

  const labels = trainingCustomerWorkspaceDictionaries[locale];

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface-panel shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            {labels.continueLearning}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-content">
            {labels.continueLearningDescription}
          </h2>
        </div>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
          {items.length}
        </span>
      </div>

      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
        {items.map((item) => {
          const title = localizeTrainingText(
            item.course.title,
            item.course.titleTranslations,
            locale,
          );
          const category = localizeTrainingText(
            item.course.category.name,
            item.course.category.nameTranslations,
            locale,
          );
          const href = item.progress.resumeLessonId
            ? `/dashboard/training/${encodeURIComponent(
                item.course.slug,
              )}/lessons/${encodeURIComponent(item.progress.resumeLessonId)}`
            : `/dashboard/training/${encodeURIComponent(item.course.slug)}`;

          return (
            <article
              key={item.course.id}
              className="grid overflow-hidden rounded-xl border border-line bg-white sm:grid-cols-[180px_minmax(0,1fr)]"
            >
              <Link
                href={href}
                className="block overflow-hidden bg-surface-subtle"
                aria-label={title}
              >
                <div className="aspect-video h-full min-h-36 overflow-hidden sm:aspect-auto">
                  {item.course.hasCover ? (
                    <Image
                      src={`/api/training/catalog/${encodeURIComponent(
                        item.course.slug,
                      )}/cover`}
                      alt=""
                      width={640}
                      height={360}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-5 text-center text-sm font-semibold text-muted">
                      {title}
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex min-w-0 flex-col p-4">
                <p className="truncate text-[11px] font-semibold text-brand">
                  {category}
                </p>
                <Link
                  href={href}
                  className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-content hover:text-brand"
                >
                  {title}
                </Link>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] text-muted">
                    <span>{labels.courseProgress}</span>
                    <span dir="ltr" className="font-semibold text-content">
                      {item.progress.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${item.progress.percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted">
                    <span dir="ltr">
                      {item.progress.completedLessons} /{" "}
                      {item.progress.totalLessons}
                    </span>{" "}
                    {labels.lessonsCompleted}
                  </p>
                </div>

                <Link
                  href={href}
                  className="mt-auto pt-4 text-sm font-semibold text-brand hover:text-brand-hover"
                >
                  {labels.continueCourse}
                  <span aria-hidden="true" className="ms-2 rtl:-scale-x-100">
                    →
                  </span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
