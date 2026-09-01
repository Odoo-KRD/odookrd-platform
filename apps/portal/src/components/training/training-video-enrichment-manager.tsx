"use client";

import type {
  Locale,
  LocalizedText,
  TrainingVideoCaptionTrackAdmin,
  TrainingVideoChapterAdmin,
  TrainingVideoEnrichmentAdmin,
} from "@odookrd/types";
import { FilePicker } from "@odookrd/ui";
import { useMemo, useState } from "react";

import { BrandedVideoPlayer } from "@/components/training/branded-video-player";

const languageOptions = [
  { code: "ku", label: "کوردی" },
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
];

const text = {
  en: {
    captions: "Captions",
    chapters: "Video chapters",
    captionHelp:
      "Upload private WebVTT subtitle tracks. Learners only receive protected caption URLs.",
    chaptersHelp:
      "Create multilingual navigation chapters using precise video timestamps.",
    file: "Drop a WebVTT caption file here",
    browse: "Choose VTT file",
    remove: "Remove",
    language: "Language",
    label: "Display label",
    defaultCaption: "Default caption",
    upload: "Upload caption",
    noCaptions: "No caption tracks have been added.",
    save: "Save",
    delete: "Delete",
    default: "Default",
    preview: "Video preview",
    currentTime: "Use current video time",
    start: "Start time",
    ku: "Kurdish title",
    ar: "Arabic title",
    en: "English title",
    addChapter: "Add chapter",
    noChapters: "No video chapters have been added.",
    requestFailed: "The request failed.",
    confirmDelete: "Delete this item?",
    replacement:
      "Uploading the same language again replaces its existing caption file.",
  },
  ku: {
    captions: "ژێرنووسەکان",
    chapters: "بەشەکانی ڤیدیۆ",
    captionHelp:
      "فایلی WebVTT ـی تایبەت زیاد بکە. فێرخواز تەنها بەستەری پارێزراوی ژێرنووس وەردەگرێت.",
    chaptersHelp: "بەشە فرەزمانەکان بە کاتی وردی ڤیدیۆ دروست بکە.",
    file: "فایلی WebVTT لێرە دابنێ",
    browse: "هەڵبژاردنی فایلی VTT",
    remove: "لابردن",
    language: "زمان",
    label: "ناوی پیشاندان",
    defaultCaption: "ژێرنووسی بنەڕەت",
    upload: "بارکردنی ژێرنووس",
    noCaptions: "هیچ ژێرنووسێک زیاد نەکراوە.",
    save: "پاشەکەوتکردن",
    delete: "سڕینەوە",
    default: "بنەڕەت",
    preview: "پێشبینینی ڤیدیۆ",
    currentTime: "بەکارهێنانی کاتی ئێستای ڤیدیۆ",
    start: "کاتی دەستپێک",
    ku: "ناونیشانی کوردی",
    ar: "ناونیشانی عەرەبی",
    en: "ناونیشانی ئینگلیزی",
    addChapter: "زیادکردنی بەش",
    noChapters: "هیچ بەشێکی ڤیدیۆ زیاد نەکراوە.",
    requestFailed: "داواکارییەکە سەرکەوتوو نەبوو.",
    confirmDelete: "ئەم دانەیە بسڕدرێتەوە؟",
    replacement: "بارکردنی هەمان زمان جارێکی تر فایلی ژێرنووسی پێشوو دەگۆڕێت.",
  },
  ar: {
    captions: "الترجمات",
    chapters: "فصول الفيديو",
    captionHelp:
      "ارفع ملفات WebVTT خاصة. يحصل المتعلم فقط على روابط ترجمة محمية.",
    chaptersHelp: "أنشئ فصول فيديو متعددة اللغات باستخدام توقيتات دقيقة.",
    file: "أسقط ملف WebVTT هنا",
    browse: "اختيار ملف VTT",
    remove: "إزالة",
    language: "اللغة",
    label: "اسم العرض",
    defaultCaption: "الترجمة الافتراضية",
    upload: "رفع الترجمة",
    noCaptions: "لم تتم إضافة أي ترجمات.",
    save: "حفظ",
    delete: "حذف",
    default: "افتراضي",
    preview: "معاينة الفيديو",
    currentTime: "استخدام وقت الفيديو الحالي",
    start: "وقت البداية",
    ku: "العنوان الكردي",
    ar: "العنوان العربي",
    en: "العنوان الإنجليزي",
    addChapter: "إضافة فصل",
    noChapters: "لم تتم إضافة فصول للفيديو.",
    requestFailed: "فشل الطلب.",
    confirmDelete: "حذف هذا العنصر؟",
    replacement: "رفع نفس اللغة مرة أخرى سيستبدل ملف الترجمة الحالي.",
  },
} as const;

function toSeconds(value: string): number | null {
  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));
  if (
    parts.length < 2 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isFinite(part) || part < 0)
  ) {
    return null;
  }
  const normalized = parts.length === 2 ? [0, parts[0], parts[1]] : parts;
  const [hours, minutes, seconds] = normalized;
  if (minutes >= 60 || seconds >= 60) return null;
  return Math.floor(hours * 3600 + minutes * 60 + seconds);
}

function toClock(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body && typeof init.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message[0]
      : body.message;
    throw new Error(message || "Request failed.");
  }
  return body;
}

function CaptionRow({
  track,
  base,
  labels,
  onChange,
}: {
  track: TrainingVideoCaptionTrackAdmin;
  base: string;
  labels: (typeof text)[Locale];
  onChange: (next: TrainingVideoEnrichmentAdmin) => void;
}) {
  const [languageCode, setLanguageCode] = useState(track.languageCode);
  const [label, setLabel] = useState(track.label);
  const [busy, setBusy] = useState(false);

  async function save(): Promise<void> {
    setBusy(true);
    try {
      onChange(
        await requestJson<TrainingVideoEnrichmentAdmin>(
          `${base}/captions/${track.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              languageCode,
              label,
              isDefault: track.isDefault,
            }),
          },
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function makeDefault(): Promise<void> {
    setBusy(true);
    try {
      onChange(
        await requestJson<TrainingVideoEnrichmentAdmin>(
          `${base}/captions/${track.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ isDefault: true }),
          },
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(): Promise<void> {
    if (!window.confirm(labels.confirmDelete)) return;
    setBusy(true);
    try {
      onChange(
        await requestJson<TrainingVideoEnrichmentAdmin>(
          `${base}/captions/${track.id}`,
          { method: "DELETE" },
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-white p-4 lg:grid-cols-[150px_minmax(220px,1fr)_auto]">
      <select
        value={languageCode}
        disabled={busy}
        onChange={(event) => setLanguageCode(event.target.value)}
        className="h-9 rounded-md border border-line bg-white px-2 text-sm text-content"
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label} · {option.code}
          </option>
        ))}
      </select>
      <div className="min-w-0">
        <input
          value={label}
          disabled={busy}
          onChange={(event) => setLabel(event.target.value)}
          className="h-9 w-full rounded-md border border-line bg-white px-3 text-sm text-content"
        />
        <p className="mt-1 truncate text-xs text-muted">
          {track.originalFilename} · {(track.sizeBytes / 1024).toFixed(1)} KB
          {track.isDefault ? ` · ${labels.default}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-content"
        >
          {labels.save}
        </button>
        {!track.isDefault ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void makeDefault()}
            className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-content"
          >
            {labels.default}
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void remove()}
          className="h-9 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700"
        >
          {labels.delete}
        </button>
      </div>
    </div>
  );
}

function ChapterRow({
  chapter,
  base,
  labels,
  onChange,
}: {
  chapter: TrainingVideoChapterAdmin;
  base: string;
  labels: (typeof text)[Locale];
  onChange: (next: TrainingVideoEnrichmentAdmin) => void;
}) {
  const initial = chapter.titleTranslations as LocalizedText;
  const [clock, setClock] = useState(toClock(chapter.startSeconds));
  const [ku, setKu] = useState(initial.ku ?? "");
  const [ar, setAr] = useState(initial.ar ?? "");
  const [en, setEn] = useState(initial.en ?? "");
  const [busy, setBusy] = useState(false);

  async function save(): Promise<void> {
    const startSeconds = toSeconds(clock);
    if (startSeconds === null) return;
    const translations = { ku, ar, en };
    const title = ku.trim() || en.trim() || ar.trim() || chapter.title;
    setBusy(true);
    try {
      onChange(
        await requestJson<TrainingVideoEnrichmentAdmin>(
          `${base}/chapters/${chapter.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              startSeconds,
              title,
              titleTranslations: translations,
            }),
          },
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(): Promise<void> {
    if (!window.confirm(labels.confirmDelete)) return;
    setBusy(true);
    try {
      onChange(
        await requestJson<TrainingVideoEnrichmentAdmin>(
          `${base}/chapters/${chapter.id}`,
          { method: "DELETE" },
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-white p-4 xl:grid-cols-[130px_repeat(3,minmax(160px,1fr))_auto]">
      <input
        value={clock}
        disabled={busy}
        onChange={(event) => setClock(event.target.value)}
        className="h-9 rounded-md border border-line px-3 text-sm tabular-nums"
      />
      <input
        value={ku}
        disabled={busy}
        placeholder={labels.ku}
        onChange={(event) => setKu(event.target.value)}
        className="h-9 rounded-md border border-line px-3 text-sm"
        dir="rtl"
      />
      <input
        value={ar}
        disabled={busy}
        placeholder={labels.ar}
        onChange={(event) => setAr(event.target.value)}
        className="h-9 rounded-md border border-line px-3 text-sm"
        dir="rtl"
      />
      <input
        value={en}
        disabled={busy}
        placeholder={labels.en}
        onChange={(event) => setEn(event.target.value)}
        className="h-9 rounded-md border border-line px-3 text-sm"
        dir="ltr"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="h-9 rounded-md border border-line px-3 text-xs font-semibold text-content"
        >
          {labels.save}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void remove()}
          className="h-9 rounded-md border border-red-200 px-3 text-xs font-semibold text-red-700"
        >
          {labels.delete}
        </button>
      </div>
    </div>
  );
}

export function TrainingVideoEnrichmentManager({
  courseId,
  sectionId,
  lessonId,
  locale,
  initialState,
}: {
  courseId: string;
  sectionId: string;
  lessonId: string;
  locale: Locale;
  initialState: TrainingVideoEnrichmentAdmin;
}) {
  const labels = text[locale];
  const [state, setState] = useState(initialState);
  const [captionFile, setCaptionFile] = useState<File | null>(null);
  const [captionLanguage, setCaptionLanguage] = useState("ku");
  const [captionLabel, setCaptionLabel] = useState("کوردی");
  const [captionDefault, setCaptionDefault] = useState(
    initialState.captions.length === 0,
  );
  const [chapterClock, setChapterClock] = useState("00:00:00");
  const [chapterKu, setChapterKu] = useState("");
  const [chapterAr, setChapterAr] = useState("");
  const [chapterEn, setChapterEn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = useMemo(
    () =>
      `/api/training/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/media/enrichment`,
    [courseId, lessonId, sectionId],
  );

  function chooseLanguage(value: string): void {
    setCaptionLanguage(value);
    setCaptionLabel(
      languageOptions.find((option) => option.code === value)?.label ?? value,
    );
  }

  async function uploadCaption(): Promise<void> {
    if (!captionFile || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${base}/captions`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "text/vtt; charset=utf-8",
          "x-odookrd-size": String(captionFile.size),
          "x-odookrd-filename": encodeURIComponent(captionFile.name),
          "x-odookrd-caption-language": encodeURIComponent(captionLanguage),
          "x-odookrd-caption-label": encodeURIComponent(captionLabel),
          "x-odookrd-caption-default": String(captionDefault),
        },
        body: captionFile,
      });
      const body = (await response.json().catch(() => ({}))) as
        TrainingVideoEnrichmentAdmin | { message?: string | string[] };
      if (!response.ok) {
        const message =
          "message" in body
            ? Array.isArray(body.message)
              ? body.message[0]
              : body.message
            : undefined;
        throw new Error(message || labels.requestFailed);
      }
      setState(body as TrainingVideoEnrichmentAdmin);
      setCaptionFile(null);
      setCaptionDefault(false);
    } catch (value) {
      setError(value instanceof Error ? value.message : labels.requestFailed);
    } finally {
      setBusy(false);
    }
  }

  function captureCurrentTime(): void {
    const video = document.querySelector<HTMLVideoElement>(
      ".odookrd-video-player video",
    );
    if (!video || !Number.isFinite(video.currentTime)) return;
    setChapterClock(toClock(Math.floor(video.currentTime)));
  }

  async function addChapter(): Promise<void> {
    const startSeconds = toSeconds(chapterClock);
    if (startSeconds === null || busy) return;
    const title = chapterKu.trim() || chapterEn.trim() || chapterAr.trim();
    if (!title) return;
    setBusy(true);
    setError(null);
    try {
      const next = await requestJson<TrainingVideoEnrichmentAdmin>(
        `${base}/chapters`,
        {
          method: "POST",
          body: JSON.stringify({
            startSeconds,
            title,
            titleTranslations: {
              ku: chapterKu,
              ar: chapterAr,
              en: chapterEn,
            },
          }),
        },
      );
      setState(next);
      setChapterKu("");
      setChapterAr("");
      setChapterEn("");
    } catch (value) {
      setError(value instanceof Error ? value.message : labels.requestFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-content">
            {labels.preview}
          </h2>
        </div>
        <div className="aspect-video max-h-[620px] bg-slate-950">
          <BrandedVideoPlayer
            media={state.preview}
            title={labels.preview}
            locale={locale}
            autoPlay={false}
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-xl border border-line bg-surface-panel p-5">
        <div>
          <h2 className="text-lg font-semibold text-content">
            {labels.captions}
          </h2>
          <p className="mt-1 text-sm text-muted">{labels.captionHelp}</p>
        </div>

        <div className="grid gap-4 rounded-lg border border-line bg-surface-subtle p-4 lg:grid-cols-[minmax(280px,1fr)_180px_minmax(180px,1fr)_auto]">
          <FilePicker
            variant="compact"
            files={captionFile ? [captionFile] : []}
            onFilesChange={(files) => setCaptionFile(files[0] ?? null)}
            accept=".vtt,text/vtt"
            disabled={busy}
            label={labels.file}
            browseLabel={labels.browse}
            removeLabel={labels.remove}
          />
          <div>
            <label className="text-xs font-semibold text-muted">
              {labels.language}
            </label>
            <select
              value={captionLanguage}
              disabled={busy}
              onChange={(event) => chooseLanguage(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label} · {option.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">
              {labels.label}
            </label>
            <input
              value={captionLabel}
              disabled={busy}
              onChange={(event) => setCaptionLabel(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-content">
              <input
                type="checkbox"
                checked={captionDefault}
                disabled={busy}
                onChange={(event) => setCaptionDefault(event.target.checked)}
              />
              {labels.defaultCaption}
            </label>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={!captionFile || busy}
              onClick={() => void uploadCaption()}
              className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {labels.upload}
            </button>
          </div>
        </div>

        <p className="text-xs text-muted">{labels.replacement}</p>

        {state.captions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-5 text-sm text-muted">
            {labels.noCaptions}
          </p>
        ) : (
          <div className="grid gap-2">
            {state.captions.map((track) => (
              <CaptionRow
                key={track.id}
                track={track}
                base={base}
                labels={labels}
                onChange={setState}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-xl border border-line bg-surface-panel p-5">
        <div>
          <h2 className="text-lg font-semibold text-content">
            {labels.chapters}
          </h2>
          <p className="mt-1 text-sm text-muted">{labels.chaptersHelp}</p>
        </div>

        <div className="grid gap-3 rounded-lg border border-line bg-surface-subtle p-4 xl:grid-cols-[150px_repeat(3,minmax(180px,1fr))_auto]">
          <div>
            <label className="text-xs font-semibold text-muted">
              {labels.start}
            </label>
            <input
              value={chapterClock}
              disabled={busy}
              onChange={(event) => setChapterClock(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm tabular-nums"
            />
            <button
              type="button"
              disabled={busy}
              onClick={captureCurrentTime}
              className="mt-2 text-xs font-semibold text-brand hover:underline"
            >
              {labels.currentTime}
            </button>
          </div>
          <input
            value={chapterKu}
            disabled={busy}
            placeholder={labels.ku}
            onChange={(event) => setChapterKu(event.target.value)}
            className="h-10 self-end rounded-md border border-line bg-white px-3 text-sm"
            dir="rtl"
          />
          <input
            value={chapterAr}
            disabled={busy}
            placeholder={labels.ar}
            onChange={(event) => setChapterAr(event.target.value)}
            className="h-10 self-end rounded-md border border-line bg-white px-3 text-sm"
            dir="rtl"
          />
          <input
            value={chapterEn}
            disabled={busy}
            placeholder={labels.en}
            onChange={(event) => setChapterEn(event.target.value)}
            className="h-10 self-end rounded-md border border-line bg-white px-3 text-sm"
            dir="ltr"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void addChapter()}
            className="h-10 self-end rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {labels.addChapter}
          </button>
        </div>

        {state.chapters.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-5 text-sm text-muted">
            {labels.noChapters}
          </p>
        ) : (
          <div className="grid gap-2">
            {state.chapters.map((chapter) => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                base={base}
                labels={labels}
                onChange={setState}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
