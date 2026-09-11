"use client";

import type {
  Locale,
  TrainingCustomerArticleContent,
  TrainingCustomerLessonDetail,
  TrainingCustomerVideoEnrichment,
  TrainingLessonProgressState,
  TrainingPlayerSettings,
} from "@odookrd/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { TrainingMediaDictionary } from "@/lib/i18n/training/media";
import { BrandedVideoPlayer } from "./branded-video-player";
import { RichTextViewer } from "@/components/i18n/rich-text-viewer";
import { PdfSlideViewer } from "./pdf-slide-viewer";
import { TrainingQuizPlayer } from "./training-quiz-player";

function hasRenderableArticleNode(value: unknown, depth = 0): boolean {
  if (depth > 40 || !value || typeof value !== "object") return false;

  const node = value as Record<string, unknown>;
  if (typeof node.text === "string" && node.text.trim().length > 0) return true;

  if (node.type === "image") {
    const attrs =
      node.attrs && typeof node.attrs === "object"
        ? (node.attrs as Record<string, unknown>)
        : {};
    return typeof attrs.src === "string" && attrs.src.trim().length > 0;
  }

  if (node.type === "separator") return true;

  return (
    Array.isArray(node.content) &&
    node.content.some((child) => hasRenderableArticleNode(child, depth + 1))
  );
}

function articleDocument(
  content: TrainingCustomerArticleContent,
  locale: Locale,
): unknown {
  const translations = content.contentTranslations;
  const fallbackOrder: Locale[] = [locale, "ku", "ar", "en"].filter(
    (candidate, index, values): candidate is Locale =>
      values.indexOf(candidate) === index,
  );

  for (const candidate of fallbackOrder) {
    const document = translations[candidate];
    if (hasRenderableArticleNode(document)) return document;
  }

  return (
    translations[locale] ??
    translations.ku ??
    translations.ar ??
    translations.en ??
    null
  );
}

async function sendProgress(
  courseSlug: string,
  lessonId: string,
  method: "POST" | "PATCH",
  suffix: "" | "/start" | "/complete",
  body?: Record<string, number>,
): Promise<TrainingLessonProgressState | null> {
  try {
    const response = await fetch(
      `/api/training/progress/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonId)}${suffix}`,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
        credentials: "same-origin",
        cache: "no-store",
        keepalive: true,
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as TrainingLessonProgressState;
  } catch {
    return null;
  }
}

export function LessonMediaPlayer({
  lesson,
  courseSlug,
  progress,
  progressLabels,
  labels,
  locale,
  enrichment,
  playerSettings,
}: {
  lesson: TrainingCustomerLessonDetail;
  courseSlug: string;
  progress: TrainingLessonProgressState | null;
  progressLabels: {
    completed: string;
    markAsComplete: string;
    markingComplete: string;
  };
  labels: TrainingMediaDictionary;
  locale: Locale;
  enrichment?: TrainingCustomerVideoEnrichment;
  playerSettings?: TrainingPlayerSettings;
}) {
  const router = useRouter();
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(false);
  const progressRef = useRef(progress);
  const [resumeProgress] = useState(progress);
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());

  const applyProgress = useCallback(
    (next: TrainingLessonProgressState) => {
      const previous = progressRef.current;
      progressRef.current = next;
      if (mountedRef.current) setCurrentProgress(next);

      if (
        next.status === "COMPLETED" &&
        previous?.status !== "COMPLETED" &&
        mountedRef.current
      ) {
        router.refresh();
      }
    },
    [router],
  );

  const enqueue = useCallback(
    (
      method: "POST" | "PATCH",
      suffix: "" | "/start" | "/complete",
      body?: Record<string, number>,
    ) => {
      writeChainRef.current = writeChainRef.current.then(async () => {
        const next = await sendProgress(
          courseSlug,
          lesson.id,
          method,
          suffix,
          body,
        );
        if (next) applyProgress(next);
      });
    },
    [applyProgress, courseSlug, lesson.id],
  );

  useEffect(() => {
    mountedRef.current = true;
    enqueue("POST", "/start");
    return () => {
      mountedRef.current = false;
    };
  }, [enqueue]);

  const persistVideo = useCallback(
    (positionSeconds: number) => {
      enqueue("PATCH", "", { positionSeconds });
    },
    [enqueue],
  );

  const persistPage = useCallback(
    (pageNumber: number) => {
      enqueue("PATCH", "", { pageNumber });
    },
    [enqueue],
  );

  const completeArticle = useCallback(() => {
    setSaving(true);
    writeChainRef.current = writeChainRef.current.then(async () => {
      const next = await sendProgress(
        courseSlug,
        lesson.id,
        "POST",
        "/complete",
      );
      if (next) applyProgress(next);
      if (mountedRef.current) setSaving(false);
    });
  }, [applyProgress, courseSlug, lesson.id]);

  const content = lesson.content ?? lesson.media ?? null;
  if (!content) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center text-sm text-muted">
        {labels.lessonUnavailable}
      </div>
    );
  }

  if (content.type === "QUIZ") {
    return (
      <TrainingQuizPlayer
        courseSlug={courseSlug}
        quizId={content.quizId}
        locale={locale}
      />
    );
  }

  if (content.type === "VIDEO") {
    return (
      <BrandedVideoPlayer
        media={content}
        enrichment={enrichment}
        locale={locale}
        playerSettings={playerSettings}
        chapterTrackLabel={labels.chapters}
        initialPositionSeconds={resumeProgress?.lastPositionSeconds ?? 0}
        onProgress={persistVideo}
      />
    );
  }

  if (content.type === "DOCUMENT") {
    return (
      <PdfSlideViewer
        media={content}
        labels={labels}
        initialPageNumber={
          resumeProgress?.lastPageNumber && resumeProgress.lastPageNumber > 0
            ? resumeProgress.lastPageNumber
            : 1
        }
        onPageChange={persistPage}
      />
    );
  }

  if (content.type === "ARTICLE") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 bg-slate-950 p-3 sm:p-4">
        <div className="min-h-0 flex-1">
          <RichTextViewer
            document={articleDocument(content, locale)}
            dir={locale === "en" ? "ltr" : "rtl"}
            articleAssetBasePath={`/api/training/catalog/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lesson.id)}/article-assets`}
          />
        </div>
        <div className="flex shrink-0 justify-end">
          {currentProgress?.status === "COMPLETED" ? (
            <span className="inline-flex h-9 items-center rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-300">
              {progressLabels.completed}
            </span>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={completeArticle}
              className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? progressLabels.markingComplete
                : progressLabels.markAsComplete}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-900">
      {labels.lessonUnavailable}
    </div>
  );
}
