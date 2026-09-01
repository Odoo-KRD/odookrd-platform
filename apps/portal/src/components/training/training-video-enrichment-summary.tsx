"use client";

import type { TrainingVideoEnrichmentAdmin } from "@odookrd/types";
import { useEffect, useState } from "react";

const translations = {
  en: {
    title: "Captions & chapters",
    captions: "Captions",
    chapters: "Video chapters",
    manage: "Manage",
  },
  ku: {
    title: "ژێرنووس و بەشەکانی ڤیدیۆ",
    captions: "ژێرنووسەکان",
    chapters: "بەشەکانی ڤیدیۆ",
    manage: "بەڕێوەبردن",
  },
  ar: {
    title: "الترجمات وفصول الفيديو",
    captions: "الترجمات",
    chapters: "فصول الفيديو",
    manage: "إدارة",
  },
} as const;

export function TrainingVideoEnrichmentSummary({
  courseId,
  sectionId,
  lessonId,
}: {
  courseId: string;
  sectionId: string;
  lessonId: string;
}) {
  const [state, setState] = useState<TrainingVideoEnrichmentAdmin | null>(null);
  const locale =
    typeof document === "undefined"
      ? "en"
      : document.documentElement.lang === "ar"
        ? "ar"
        : document.documentElement.lang === "ku"
          ? "ku"
          : "en";
  const labels = translations[locale];
  const base = `/api/training/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/media/enrichment`;

  useEffect(() => {
    let active = true;
    void fetch(base, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as TrainingVideoEnrichmentAdmin;
      })
      .then((next) => {
        if (active) setState(next);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [base]);

  return (
    <div className="rounded-lg border border-line bg-surface-subtle p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-content">{labels.title}</p>
          <p className="mt-1 text-xs text-muted">
            {labels.captions}: {state?.captions.length ?? 0} · {labels.chapters}
            : {state?.chapters.length ?? 0}
          </p>
        </div>
        <a
          href={`/admin/training/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/media/enrichment`}
          className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-content hover:bg-surface-subtle"
        >
          {labels.manage}
        </a>
      </div>
    </div>
  );
}
