"use client";

import type { Locale, TrainingCustomerVideoChapter } from "@odookrd/types";
import { useEffect, useMemo, useState } from "react";

function localize(
  chapter: TrainingCustomerVideoChapter,
  locale: Locale,
): string {
  return (
    chapter.titleTranslations[locale] ??
    chapter.titleTranslations.ku ??
    chapter.titleTranslations.en ??
    chapter.titleTranslations.ar ??
    chapter.title
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = Math.floor(seconds % 60);
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`
    : `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export function CoursePlayerChaptersPanel({
  chapters,
  locale,
}: {
  chapters: TrainingCustomerVideoChapter[];
  locale: Locale;
}) {
  const [position, setPosition] = useState(0);
  const ordered = useMemo(
    () => [...chapters].sort((a, b) => a.startSeconds - b.startSeconds),
    [chapters],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const video = document.querySelector<HTMLVideoElement>(
        ".odookrd-video-player video",
      );
      if (video && Number.isFinite(video.currentTime)) {
        setPosition(video.currentTime);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  const currentIndex = ordered.reduce(
    (result, chapter, index) =>
      chapter.startSeconds <= position ? index : result,
    -1,
  );

  function seek(seconds: number): void {
    const video = document.querySelector<HTMLVideoElement>(
      ".odookrd-video-player video",
    );
    if (!video) return;
    video.currentTime = seconds;
    void video.play().catch(() => undefined);
  }

  return (
    <div className="divide-y divide-white/5">
      {ordered.map((chapter, index) => {
        const current = index === currentIndex;
        return (
          <button
            key={chapter.id}
            type="button"
            onClick={() => seek(chapter.startSeconds)}
            className={`flex w-full items-start gap-3 border-s-2 px-4 py-3 text-start transition ${
              current
                ? "border-brand bg-brand/20"
                : "border-transparent hover:bg-white/5"
            }`}
          >
            <span
              dir="ltr"
              className="mt-0.5 min-w-12 text-[11px] font-semibold tabular-nums text-slate-400"
            >
              {formatTime(chapter.startSeconds)}
            </span>
            <span
              className={`text-xs leading-5 ${
                current
                  ? "font-semibold text-white"
                  : "font-medium text-slate-300"
              }`}
            >
              {localize(chapter, locale)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
