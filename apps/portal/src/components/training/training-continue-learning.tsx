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
    <section className="grid gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
          {labels.continueLearning}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-content">
          {labels.continueLearningDescription}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            ? `/dashboard/training/${encodeURIComponent(item.course.slug)}/lessons/${encodeURIComponent(item.progress.resumeLessonId)}`
            : `/dashboard/training/${encodeURIComponent(item.course.slug)}`;

          return (
            <article
              key={item.course.id}
              className="overflow-hidden rounded-xl border border-line bg-surface-panel shadow-sm"
            >
              <Link href={href} className="block bg-surface-subtle">
                <div className="aspect-video overflow-hidden">
                  {item.course.hasCover ? (
                    <Image
                      src={`/api/training/catalog/${encodeURIComponent(item.course.slug)}/cover`}
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

              <div className="p-4">
                <p className="truncate text-[11px] font-semibold text-brand">
                  {category}
                </p>
                <Link
                  href={href}
                  className="mt-1 block line-clamp-2 text-sm font-semibold leading-5 text-content hover:text-brand"
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
                  className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-md bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover"
                >
                  {labels.continueCourse}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
