"use client";

import type {
  FileAsset,
  LocalizedRichText,
  LocalizedText,
  TrainingAutomatedUploadInit,
  TrainingLessonContentType,
  TrainingLessonEditorState,
  TrainingLessonResource,
} from "@odookrd/types";
import { FilePicker } from "@odookrd/ui";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { AdminActionMenu } from "@/components/admin/admin-action-menu";
import { TrainingQuizBuilder } from "@/components/training/training-quiz-builder";
import { TrainingVideoEnrichmentSummary } from "@/components/training/training-video-enrichment-summary";
import { LocalizedTextField } from "@/components/i18n/localized-text-fields";
import {
  initializeLocalizedRichText,
  LocalizedRichTextEditor,
  richTextToPlainText,
} from "@/components/training/localized-rich-text-editor";
import type { ContentEditorDictionary } from "@/lib/i18n/types";
import type { TrainingDictionary } from "@/lib/i18n/training";
import type { TrainingLessonEditorDictionary } from "@/lib/i18n/training/lesson-editor";

type EditorTab = "general" | "content" | "resources" | "review";
type VideoSource = "LOCAL" | "AWS" | "URL";

interface VideoMetadata {
  durationSeconds?: number;
  width?: number;
  height?: number;
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body instanceof FormData
        ? {}
        : init?.body
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

async function inspectVideo(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        durationSeconds:
          Number.isFinite(video.duration) && video.duration > 0
            ? Math.max(1, Math.round(video.duration))
            : undefined,
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video metadata could not be read."));
    };
    video.src = url;
  });
}

async function readPdfPageCount(file: File): Promise<number> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/api/training/pdf-worker";
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });
  const document = await task.promise;
  try {
    return document.numPages;
  } finally {
    await task.destroy();
  }
}

function bytes(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

function parseLocalizedText(formData: FormData, field: string): LocalizedText {
  const localized: LocalizedText = {};
  for (const locale of ["ku", "ar", "en"] as const) {
    const value = formData.get(`${field}.${locale}`);
    if (typeof value === "string" && value.trim())
      localized[locale] = value.trim();
  }
  return localized;
}

function primaryTitle(localized: LocalizedText, fallback: string): string {
  return localized.ku ?? localized.en ?? localized.ar ?? fallback;
}

interface TransferProgress {
  phase: "UPLOADING" | "FINALIZING";
  percent: number;
  loaded: number;
  total: number;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = Math.floor(seconds % 60);
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`
    : `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function uploadWithProgress(
  url: string,
  method: "PUT" | "POST",
  body: XMLHttpRequestBodyInit,
  headers: Record<string, string>,
  onProgress: (loaded: number, total: number) => void,
  register: (request: XMLHttpRequest | null) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    register(request);
    request.open(method, url, true);
    const target = new URL(url, window.location.href);
    request.withCredentials = target.origin === window.location.origin;
    Object.entries(headers).forEach(([key, value]) =>
      request.setRequestHeader(key, value),
    );
    request.upload.onprogress = (event) => {
      const total = event.lengthComputable
        ? event.total
        : body instanceof File
          ? body.size
          : 0;
      onProgress(event.loaded, total);
    };
    request.onload = () => {
      register(null);
      if (request.status >= 200 && request.status < 300)
        resolve(request.responseText);
      else {
        let message = "Upload failed.";
        try {
          const payload = JSON.parse(request.responseText) as {
            message?: string | string[];
          };
          message = Array.isArray(payload.message)
            ? payload.message[0]
            : (payload.message ?? message);
        } catch {
          // Keep the safe default.
        }
        reject(new Error(message));
      }
    };
    request.onerror = () => {
      register(null);
      reject(new Error("Upload failed."));
    };
    request.onabort = () => {
      register(null);
      reject(new Error("Upload canceled."));
    };
    request.send(body);
  });
}

async function createVideoThumbnail(
  file: File,
  durationSeconds?: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const cleanup = () => URL.revokeObjectURL(source);
    video.onerror = () => {
      cleanup();
      reject(new Error("Video thumbnail could not be generated."));
    };
    video.onloadedmetadata = () => {
      const duration =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : (durationSeconds ?? 1);
      const preferred = duration > 8 ? duration * 0.1 : duration * 0.35;
      video.currentTime = Math.min(
        Math.max(preferred, 0.2),
        Math.max(duration - 0.15, 0.2),
      );
    };
    video.onseeked = () => {
      const capture = () => {
        const sourceWidth = video.videoWidth || 1280;
        const sourceHeight = video.videoHeight || 720;
        const scale = Math.min(1, 1280 / sourceWidth, 720 / sourceHeight);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(sourceWidth * scale));
        canvas.height = Math.max(1, Math.round(sourceHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          cleanup();
          reject(new Error("Video thumbnail could not be generated."));
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              reject(new Error("Video thumbnail could not be generated."));
              return;
            }
            resolve(
              new File([blob], "video-thumbnail.jpg", { type: "image/jpeg" }),
            );
          },
          "image/jpeg",
          0.86,
        );
      };
      const frameVideo = video as HTMLVideoElement & {
        requestVideoFrameCallback?: (callback: () => void) => number;
      };
      if (frameVideo.requestVideoFrameCallback) {
        frameVideo.requestVideoFrameCallback(capture);
      } else {
        window.setTimeout(capture, 80);
      }
    };
    video.src = source;
  });
}

function VideoDropZone({
  file,
  disabled,
  labels,
  onSelect,
  onRemove,
}: {
  file: File | null;
  disabled: boolean;
  labels: TrainingLessonEditorDictionary["content"];
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <FilePicker
      files={file ? [file] : []}
      onFilesChange={(files) => {
        const selected = files[0];
        if (selected) onSelect(selected);
        else onRemove();
      }}
      accept="video/mp4,.mp4"
      disabled={disabled}
      label={labels.dropTitle}
      description={labels.dropHelp}
      browseLabel={file ? labels.replaceVideo : labels.browseVideo}
      removeLabel={labels.removeSelection}
    />
  );
}

function ProgressBar({
  value,
  indeterminate = false,
}: {
  value: number | null;
  indeterminate?: boolean;
}) {
  const width = value === null ? 36 : Math.max(2, Math.min(100, value));
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value ?? undefined}
    >
      <div
        className={`h-full rounded-full bg-brand transition-[width] duration-300 ${indeterminate ? "animate-pulse" : ""}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

type VideoWorkflowStage =
  "SELECT" | "UPLOADING" | "PROCESSING" | "FINALIZING" | "READY" | "FAILED";

function VideoWorkflowStepper({
  source,
  stage,
  uploadPercent,
  uploadLoaded,
  uploadTotal,
  processingPercent,
  labels,
}: {
  source: VideoSource;
  stage: VideoWorkflowStage;
  uploadPercent: number | null;
  uploadLoaded: number | null;
  uploadTotal: number | null;
  processingPercent: number | null;
  labels: TrainingLessonEditorDictionary["content"];
}) {
  const steps =
    source === "AWS"
      ? [
          { key: "SELECT", label: labels.stepSelect },
          { key: "UPLOADING", label: labels.stepUpload },
          { key: "PROCESSING", label: labels.stepProcess },
          { key: "FINALIZING", label: labels.stepFinalize },
          { key: "READY", label: labels.stepReady },
        ]
      : source === "LOCAL"
        ? [
            { key: "SELECT", label: labels.stepSelect },
            { key: "UPLOADING", label: labels.stepUpload },
            { key: "FINALIZING", label: labels.stepFinalize },
            { key: "READY", label: labels.stepReady },
          ]
        : [
            { key: "SELECT", label: labels.stepConfigure },
            { key: "FINALIZING", label: labels.stepValidate },
            { key: "READY", label: labels.stepReady },
          ];

  const order = steps.map((item) => item.key);
  const currentIndex =
    stage === "FAILED"
      ? Math.max(0, order.indexOf("PROCESSING"))
      : Math.max(0, order.indexOf(stage));

  return (
    <div className="rounded-xl border border-line bg-surface-subtle p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
        <ol className="grid gap-3 sm:grid-flow-col sm:auto-cols-fr sm:gap-0">
          {steps.map((item, index) => {
            const done = stage === "READY" || index < currentIndex;
            const active =
              stage !== "FAILED" && index === currentIndex && stage !== "READY";
            const failed = stage === "FAILED" && index === currentIndex;
            return (
              <li
                key={item.key}
                className="relative flex items-center gap-2 sm:block"
              >
                <div className="flex items-center sm:w-full">
                  <span
                    className={`relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                      failed
                        ? "border-red-300 bg-red-50 text-red-700"
                        : done
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : active
                            ? "border-brand bg-brand text-white"
                            : "border-line bg-white text-muted"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  {index < steps.length - 1 ? (
                    <span
                      className={`hidden h-px flex-1 sm:block ${
                        done ? "bg-emerald-300" : "bg-line"
                      }`}
                    />
                  ) : null}
                </div>
                <span
                  className={`text-xs font-medium sm:mt-2 sm:block sm:pe-3 ${
                    active
                      ? "text-content"
                      : failed
                        ? "text-red-700"
                        : done
                          ? "text-emerald-700"
                          : "text-muted"
                  }`}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="grid gap-2">
          {stage === "UPLOADING" ? (
            <>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-content">
                  {labels.uploadProgress}
                </span>
                <span className="font-mono text-muted">
                  {uploadPercent ?? 0}%
                </span>
              </div>
              <ProgressBar value={uploadPercent ?? 0} />
              {uploadLoaded !== null && uploadTotal !== null ? (
                <p className="text-[11px] text-muted">
                  {bytes(uploadLoaded)} / {bytes(uploadTotal)}
                </p>
              ) : null}
            </>
          ) : stage === "PROCESSING" ? (
            <>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-content">
                  {labels.processingProgress}
                </span>
                {processingPercent !== null ? (
                  <span className="font-mono text-muted">
                    {processingPercent}%
                  </span>
                ) : null}
              </div>
              <ProgressBar
                value={processingPercent}
                indeterminate={processingPercent === null}
              />
            </>
          ) : stage === "FINALIZING" ? (
            <>
              <p className="text-xs font-semibold text-content">
                {labels.finalizing}
              </p>
              <ProgressBar value={null} indeterminate />
            </>
          ) : stage === "FAILED" ? (
            <p className="text-xs font-semibold text-red-700">
              {labels.failed}
            </p>
          ) : stage === "READY" ? (
            <p className="text-xs font-semibold text-emerald-700">
              {labels.ready}
            </p>
          ) : (
            <p className="text-xs text-muted">{labels.stepSelectHelp}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ContentTypeCard({
  type,
  current,
  label,
  help,
  disabled,
  onSelect,
}: {
  type: TrainingLessonContentType;
  current: TrainingLessonContentType | null;
  label: string;
  help: string;
  disabled: boolean;
  onSelect: () => void;
}) {
  const selected = current === type;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`grid min-h-28 gap-2 rounded-lg border p-4 text-start transition disabled:opacity-50 ${
        selected
          ? "border-brand/40 bg-brand-soft/60 ring-2 ring-brand/10"
          : "border-line bg-white hover:border-slate-300 hover:bg-surface-subtle"
      }`}
    >
      <span className="text-sm font-semibold text-content">{label}</span>
      <span className="text-xs leading-5 text-muted">{help}</span>
    </button>
  );
}

function ResourceEditorRow({
  resource,
  index,
  total,
  base,
  contentDictionary,
  labels,
  disabled,
  onChanged,
}: {
  resource: TrainingLessonResource & { __order: string[] };
  index: number;
  total: number;
  base: string;
  contentDictionary: ContentEditorDictionary;
  labels: TrainingLessonEditorDictionary;
  disabled: boolean;
  onChanged: (next: TrainingLessonEditorState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || disabled) return;
    const data = new FormData(event.currentTarget);
    const translations = parseLocalizedText(data, `resource-${resource.id}`);
    const title = primaryTitle(translations, resource.title);
    setBusy(true);
    setError(null);
    try {
      const next = await jsonRequest<TrainingLessonEditorState>(
        `${base}/resources/${resource.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title,
            titleTranslations: translations,
            customerVisible: data.get("customerVisible") === "on",
          }),
        },
      );
      onChanged(next);
    } catch (value) {
      setError(
        value instanceof Error ? value.message : labels.errors.requestFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy || disabled) return;
    if (!window.confirm(labels.resources.remove + "?")) return;
    setBusy(true);
    setError(null);
    try {
      onChanged(
        await jsonRequest<TrainingLessonEditorState>(
          `${base}/resources/${resource.id}`,
          {
            method: "DELETE",
          },
        ),
      );
    } catch (value) {
      setError(
        value instanceof Error ? value.message : labels.errors.requestFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  async function move(direction: -1 | 1) {
    if (busy || disabled) return;
    const all = resource.__order ?? [];
    const target = index + direction;
    if (target < 0 || target >= all.length) return;
    const ordered = [...all];
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    setBusy(true);
    setError(null);
    try {
      onChanged(
        await jsonRequest<TrainingLessonEditorState>(
          `${base}/resources/reorder`,
          {
            method: "POST",
            body: JSON.stringify({ resourceIds: ordered }),
          },
        ),
      );
    } catch (value) {
      setError(
        value instanceof Error ? value.message : labels.errors.requestFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="grid gap-4 rounded-lg border border-line bg-white p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-content">
            {resource.originalFilename}
          </p>
          <p className="mt-1 text-xs text-muted">
            {resource.mimeType} · {bytes(resource.sizeBytes)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || busy || index === 0}
            onClick={() => void move(-1)}
            className="h-8 rounded-md border border-line px-2.5 text-xs text-content hover:bg-surface-subtle disabled:opacity-40"
          >
            {labels.resources.moveUp}
          </button>
          <button
            type="button"
            disabled={disabled || busy || index === total - 1}
            onClick={() => void move(1)}
            className="h-8 rounded-md border border-line px-2.5 text-xs text-content hover:bg-surface-subtle disabled:opacity-40"
          >
            {labels.resources.moveDown}
          </button>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => void remove()}
            className="h-8 rounded-md border border-red-200 px-2.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
          >
            {labels.resources.remove}
          </button>
        </div>
      </div>

      <LocalizedTextField
        field={`resource-${resource.id}`}
        label={labels.resources.displayTitle}
        content={contentDictionary}
        translations={resource.titleTranslations}
        fallback={resource.title}
        maxLength={250}
      />

      <label className="flex items-center gap-2 text-sm text-content">
        <input
          type="checkbox"
          name="customerVisible"
          defaultChecked={resource.customerVisible}
        />
        {labels.resources.customerVisible}
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div>
        <button
          type="submit"
          disabled={disabled || busy}
          className="inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {labels.resources.save}
        </button>
      </div>
    </form>
  );
}

export function TrainingLessonEditor({
  courseId,
  sectionId,
  lessonId,
  initialState,
  initialTab,
  labels,
  training,
  contentDictionary,
}: {
  courseId: string;
  sectionId: string;
  lessonId: string;
  initialState: TrainingLessonEditorState;
  initialTab: EditorTab;
  labels: TrainingLessonEditorDictionary;
  training: TrainingDictionary;
  contentDictionary: ContentEditorDictionary;
}) {
  const [editor, setEditor] = useState(initialState);
  const [tab, setTab] = useState<EditorTab>(initialTab);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [richDescription, setRichDescription] = useState<LocalizedRichText>(
    () =>
      initializeLocalizedRichText(
        initialState.lesson.richDescriptionTranslations,
        initialState.lesson.descriptionTranslations,
        initialState.lesson.description,
      ),
  );
  const [articleContent, setArticleContent] = useState<LocalizedRichText>(() =>
    initializeLocalizedRichText(
      initialState.lesson.articleContentTranslations,
      {},
      null,
    ),
  );
  const [videoSource, setVideoSource] = useState<VideoSource>(() => {
    const delivery = initialState.media.video?.deliveryMode;
    return delivery === "LOCAL"
      ? "LOCAL"
      : delivery === "AWS_MANUAL"
        ? "URL"
        : "AWS";
  });
  const [automatedFile, setAutomatedFile] = useState<File | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [manualUrl, setManualUrl] = useState(
    initialState.media.video?.manualPlaybackUrl ?? "",
  );
  const [selectedVideoMetadata, setSelectedVideoMetadata] =
    useState<VideoMetadata | null>(null);
  const [autoThumbnailFile, setAutoThumbnailFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    null,
  );
  const [transferProgress, setTransferProgress] =
    useState<TransferProgress | null>(null);
  const [showContentTypes, setShowContentTypes] = useState(
    initialState.lesson.contentType === null,
  );
  const [replaceMode, setReplaceMode] = useState(false);
  const uploadRequestRef = useRef<XMLHttpRequest | null>(null);

  const base = useMemo(
    () =>
      `/api/training/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/editor`,
    [courseId, lessonId, sectionId],
  );
  const mediaBase = useMemo(
    () =>
      `/api/training/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/media`,
    [courseId, lessonId, sectionId],
  );

  useEffect(() => {
    if (editor.media.video?.status !== "PROCESSING") return;
    const timer = window.setInterval(() => {
      void jsonRequest<TrainingLessonEditorState>(base)
        .then((next) => setEditor(next))
        .catch(() => undefined);
    }, 3_000);
    return () => window.clearInterval(timer);
  }, [base, editor.media.video?.status]);

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [thumbnailPreviewUrl]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(
      () => setMessage(null),
      error ? 7_000 : 4_500,
    );
    return () => window.clearTimeout(timer);
  }, [error, message]);

  function begin(key: string) {
    setBusy(key);
    setMessage(null);
    setError(false);
  }

  function fail(value: unknown) {
    setMessage(
      value instanceof Error ? value.message : labels.errors.requestFailed,
    );
    setError(true);
    setBusy(null);
  }

  function complete(next: TrainingLessonEditorState, value = labels.saved) {
    setEditor(next);
    setMessage(value);
    setError(false);
    setBusy(null);
  }

  async function saveGeneral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const titleTranslations = parseLocalizedText(data, "title");
    const title = primaryTitle(titleTranslations, editor.lesson.title);
    const descriptionTranslations: LocalizedText = {};
    for (const locale of ["ku", "ar", "en"] as const) {
      const plain = richTextToPlainText(richDescription[locale]).slice(0, 2000);
      if (plain) descriptionTranslations[locale] = plain;
    }
    begin("general");
    try {
      complete(
        await jsonRequest<TrainingLessonEditorState>(`${base}/general`, {
          method: "PATCH",
          body: JSON.stringify({
            title,
            titleTranslations,
            description: descriptionTranslations.ku ?? null,
            descriptionTranslations,
            richDescriptionTranslations: richDescription,
            status: data.get("status"),
          }),
        }),
      );
    } catch (value) {
      fail(value);
    }
  }

  async function chooseContentType(type: TrainingLessonContentType) {
    if (busy || editor.lesson.contentType === type) return;
    begin("content-type");
    try {
      let confirmed = false;
      try {
        const next = await jsonRequest<TrainingLessonEditorState>(
          `${base}/content-type`,
          {
            method: "PUT",
            body: JSON.stringify({ contentType: type }),
          },
        );
        complete(next);
        setShowContentTypes(false);
        return;
      } catch (value) {
        if (!(value instanceof Error) || !value.message.includes("detach"))
          throw value;
        confirmed = window.confirm(labels.content.confirmSwitch);
      }
      if (!confirmed) {
        setBusy(null);
        return;
      }
      complete(
        await jsonRequest<TrainingLessonEditorState>(`${base}/content-type`, {
          method: "PUT",
          body: JSON.stringify({ contentType: type, confirmDetach: true }),
        }),
      );
      setShowContentTypes(false);
    } catch (value) {
      fail(value);
    }
  }

  async function clearContent() {
    if (busy || !editor.lesson.contentType) return;
    if (!window.confirm(labels.content.confirmSwitch)) return;
    begin("clear");
    try {
      complete(
        await jsonRequest<TrainingLessonEditorState>(`${base}/content`, {
          method: "DELETE",
        }),
      );
      setShowContentTypes(true);
      setReplaceMode(false);
    } catch (value) {
      fail(value);
    }
  }

  function clearVideoSelection(source: "AWS" | "LOCAL") {
    if (source === "AWS") setAutomatedFile(null);
    else setLocalFile(null);
    setSelectedVideoMetadata(null);
    setAutoThumbnailFile(null);
    if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    setThumbnailPreviewUrl(null);
  }

  async function prepareVideoSelection(file: File, source: "AWS" | "LOCAL") {
    if (file.type !== "video/mp4") {
      setMessage(labels.errors.invalidMp4);
      setError(true);
      return;
    }
    setMessage(null);
    setError(false);
    if (source === "AWS") setAutomatedFile(file);
    else setLocalFile(file);
    try {
      const metadata = await inspectVideo(file);
      setSelectedVideoMetadata(metadata);
      try {
        const thumbnail = await createVideoThumbnail(
          file,
          metadata.durationSeconds,
        );
        setAutoThumbnailFile(thumbnail);
        if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
        setThumbnailPreviewUrl(URL.createObjectURL(thumbnail));
      } catch {
        setAutoThumbnailFile(null);
      }
    } catch (value) {
      fail(value);
    }
  }

  async function refreshEditorState(): Promise<TrainingLessonEditorState> {
    return jsonRequest<TrainingLessonEditorState>(base);
  }

  async function uploadThumbnail(file: File): Promise<void> {
    const payload = new FormData();
    payload.set("kind", "IMAGE");
    payload.set("file", file, file.name);

    const uploaded = await jsonRequest<FileAsset>("/api/files/upload", {
      method: "POST",
      body: payload,
    });

    // Media mutation endpoints return media state, not the full Lesson Editor aggregate.
    await jsonRequest(`${mediaBase}/thumbnail`, {
      method: "POST",
      body: JSON.stringify({ fileAssetId: uploaded.id }),
    });
  }

  async function saveThumbnail() {
    if (!thumbnailFile || busy || !editor.media.video) return;

    begin("thumbnail");
    try {
      await uploadThumbnail(thumbnailFile);
      setThumbnailFile(null);
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl(null);
      complete(await refreshEditorState(), labels.content.thumbnailUpdated);
    } catch (value) {
      fail(value);
    }
  }

  async function retryProcessing() {
    if (busy) return;

    begin("retry");
    try {
      await jsonRequest(`${mediaBase}/aws-automated/retry`, {
        method: "POST",
      });
      complete(await refreshEditorState(), labels.content.processingStarted);
    } catch (value) {
      fail(value);
    }
  }

  async function deleteVideo() {
    if (busy || !editor.media.video) return;
    if (!window.confirm(labels.content.confirmDeleteVideo)) return;

    begin("delete-video");
    try {
      await jsonRequest(`${mediaBase}/video`, {
        method: "DELETE",
      });

      setAutomatedFile(null);
      setLocalFile(null);
      setSelectedVideoMetadata(null);
      setAutoThumbnailFile(null);
      setThumbnailFile(null);

      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }

      setThumbnailPreviewUrl(null);
      setTransferProgress(null);
      setReplaceMode(false);

      complete(await refreshEditorState(), labels.content.videoDeleted);
    } catch (value) {
      fail(value);
    }
  }

  async function automatedUpload() {
    if (!automatedFile || automatedFile.type !== "video/mp4") {
      setMessage(labels.errors.invalidMp4);
      setError(true);
      return;
    }

    begin("aws");
    setTransferProgress({
      phase: "UPLOADING",
      percent: 0,
      loaded: 0,
      total: automatedFile.size,
    });

    try {
      const metadata =
        selectedVideoMetadata ?? (await inspectVideo(automatedFile));

      const init = await jsonRequest<TrainingAutomatedUploadInit>(
        `${mediaBase}/aws-automated/init`,
        {
          method: "POST",
          body: JSON.stringify({
            filename: automatedFile.name,
            sizeBytes: automatedFile.size,
            ...metadata,
          }),
        },
      );

      await uploadWithProgress(
        init.uploadUrl,
        "PUT",
        automatedFile,
        init.requiredHeaders,
        (loaded, total) => {
          const safeTotal = total || automatedFile.size;
          setTransferProgress({
            phase: "UPLOADING",
            loaded,
            total: safeTotal,
            percent: safeTotal > 0 ? Math.round((loaded / safeTotal) * 100) : 0,
          });
        },
        (request) => {
          uploadRequestRef.current = request;
        },
      );

      setTransferProgress({
        phase: "FINALIZING",
        percent: 100,
        loaded: automatedFile.size,
        total: automatedFile.size,
      });

      // This endpoint returns media state only. Do not assign it to editor state.
      await jsonRequest(`${mediaBase}/aws-automated/complete`, {
        method: "POST",
        body: JSON.stringify({ assetId: init.assetId }),
      });

      if (autoThumbnailFile) {
        try {
          await uploadThumbnail(autoThumbnailFile);
        } catch {
          // Thumbnail generation is optional and must never invalidate a successful video upload.
        }
      }

      setAutomatedFile(null);
      setSelectedVideoMetadata(null);
      setAutoThumbnailFile(null);
      setTransferProgress(null);
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl(null);
      setReplaceMode(false);

      complete(await refreshEditorState(), labels.content.processingStarted);
    } catch (value) {
      setTransferProgress(null);
      fail(value);
    }
  }

  async function localUpload() {
    if (!localFile || localFile.type !== "video/mp4") {
      setMessage(labels.errors.invalidMp4);
      setError(true);
      return;
    }

    begin("local");
    setTransferProgress({
      phase: "UPLOADING",
      percent: 0,
      loaded: 0,
      total: localFile.size,
    });

    try {
      const metadata = selectedVideoMetadata ?? (await inspectVideo(localFile));

      // The local media endpoint also returns media state only.
      await uploadWithProgress(
        mediaBase + "/local",
        "PUT",
        localFile,
        {
          "Content-Type": "video/mp4",
          "X-OdooKRD-Filename": encodeURIComponent(localFile.name),
          "X-OdooKRD-Size": String(localFile.size),
          ...(metadata.durationSeconds
            ? { "X-OdooKRD-Duration": String(metadata.durationSeconds) }
            : {}),
          ...(metadata.width
            ? { "X-OdooKRD-Width": String(metadata.width) }
            : {}),
          ...(metadata.height
            ? { "X-OdooKRD-Height": String(metadata.height) }
            : {}),
        },
        (loaded, total) => {
          const safeTotal = total || localFile.size;
          setTransferProgress({
            phase: "UPLOADING",
            loaded,
            total: safeTotal,
            percent: safeTotal > 0 ? Math.round((loaded / safeTotal) * 100) : 0,
          });
        },
        (request) => {
          uploadRequestRef.current = request;
        },
      );

      if (autoThumbnailFile) {
        try {
          await uploadThumbnail(autoThumbnailFile);
        } catch {
          // An optional thumbnail must not fail a completed local upload.
        }
      }

      setLocalFile(null);
      setSelectedVideoMetadata(null);
      setAutoThumbnailFile(null);
      setTransferProgress(null);
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl(null);
      setReplaceMode(false);

      complete(await refreshEditorState(), labels.content.videoReadyToast);
    } catch (value) {
      setTransferProgress(null);
      fail(value);
    }
  }

  async function saveUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    begin("url");
    const optionalInt = (name: string): number | undefined => {
      const value = String(data.get(name) ?? "").trim();
      if (!value) return undefined;
      const parsed = Number(value);
      return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
    };
    try {
      await jsonRequest(`${mediaBase}/aws-manual`, {
        method: "POST",
        body: JSON.stringify({
          playbackUrl: manualUrl.trim(),
          sourceSizeBytes: optionalInt("sourceSizeBytes"),
          processedSizeBytes: optionalInt("processedSizeBytes"),
          durationSeconds: optionalInt("durationSeconds"),
          width: optionalInt("width"),
          height: optionalInt("height"),
        }),
      });
      setReplaceMode(false);
      complete(
        await jsonRequest<TrainingLessonEditorState>(base),
        labels.content.videoReadyToast,
      );
    } catch (value) {
      fail(value);
    }
  }

  async function attachDocument() {
    if (!documentFile || documentFile.type !== "application/pdf") {
      setMessage(labels.errors.invalidPdf);
      setError(true);
      return;
    }
    begin("document");
    try {
      const pageCount = await readPdfPageCount(documentFile);
      const payload = new FormData();
      payload.set("kind", "DOCUMENT");
      payload.set("file", documentFile, documentFile.name);
      const uploaded = await jsonRequest<FileAsset>("/api/files/upload", {
        method: "POST",
        body: payload,
      });
      const next = await jsonRequest<TrainingLessonEditorState>(
        `${base}/document`,
        {
          method: "POST",
          body: JSON.stringify({ fileAssetId: uploaded.id, pageCount }),
        },
      );
      setDocumentFile(null);
      complete(next);
    } catch (value) {
      fail(value);
    }
  }

  async function saveArticle() {
    if (busy) return;
    begin("article");
    try {
      complete(
        await jsonRequest<TrainingLessonEditorState>(`${base}/article`, {
          method: "PUT",
          body: JSON.stringify({ articleContentTranslations: articleContent }),
        }),
      );
    } catch (value) {
      fail(value);
    }
  }

  async function addResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resourceFile || busy) return;
    const data = new FormData(event.currentTarget);
    const titleTranslations = parseLocalizedText(data, "resource-new");
    const title = primaryTitle(titleTranslations, resourceFile.name);
    begin("resource-add");
    try {
      const upload = new FormData();
      upload.set("kind", "ATTACHMENT");
      upload.set("file", resourceFile, resourceFile.name);
      const uploaded = await jsonRequest<FileAsset>("/api/files/upload", {
        method: "POST",
        body: upload,
      });
      const next = await jsonRequest<TrainingLessonEditorState>(
        `${base}/resources`,
        {
          method: "POST",
          body: JSON.stringify({
            fileAssetId: uploaded.id,
            title,
            titleTranslations,
            customerVisible: data.get("customerVisible") === "on",
          }),
        },
      );
      setResourceFile(null);
      complete(next);
    } catch (value) {
      fail(value);
    }
  }

  async function publish() {
    if (!editor.review.ready || busy) return;
    begin("publish");
    try {
      complete(
        await jsonRequest<TrainingLessonEditorState>(`${base}/general`, {
          method: "PATCH",
          body: JSON.stringify({ status: "PUBLISHED" }),
        }),
      );
    } catch (value) {
      fail(value);
    }
  }

  const tabs: Array<{ key: EditorTab; label: string }> = [
    { key: "general", label: labels.tabs.general },
    { key: "content", label: labels.tabs.content },
    { key: "resources", label: labels.tabs.resources },
    { key: "review", label: labels.tabs.review },
  ];

  const order = editor.resources.map((resource) => resource.id);
  const resourcesWithOrder = editor.resources.map((resource) => ({
    ...resource,
    __order: order,
  }));

  const currentVideo = editor.media.video;
  const currentFile = videoSource === "AWS" ? automatedFile : localFile;
  const currentThumbnail =
    thumbnailPreviewUrl ??
    (currentVideo?.posterFileAssetId
      ? `/api/files/${currentVideo.posterFileAssetId}/content`
      : null);
  const processingPercent = currentVideo?.processingProgress ?? null;
  const sourceLabel = currentFile
    ? videoSource === "LOCAL"
      ? labels.content.local
      : labels.content.aws
    : currentVideo
      ? currentVideo.deliveryMode === "LOCAL"
        ? labels.content.local
        : currentVideo.deliveryMode === "AWS_MANUAL"
          ? labels.content.url
          : labels.content.aws
      : videoSource === "LOCAL"
        ? labels.content.local
        : videoSource === "URL"
          ? labels.content.url
          : labels.content.aws;

  const workflowSource: VideoSource =
    currentFile || replaceMode
      ? videoSource
      : currentVideo?.deliveryMode === "LOCAL"
        ? "LOCAL"
        : currentVideo?.deliveryMode === "AWS_MANUAL"
          ? "URL"
          : "AWS";

  const workflowStage: VideoWorkflowStage =
    transferProgress?.phase === "UPLOADING"
      ? "UPLOADING"
      : transferProgress?.phase === "FINALIZING"
        ? "FINALIZING"
        : currentVideo?.status === "PROCESSING"
          ? currentVideo.processingPhase === "FINALIZING"
            ? "FINALIZING"
            : "PROCESSING"
          : currentVideo?.status === "FAILED" && !replaceMode
            ? "FAILED"
            : currentFile
              ? "SELECT"
              : currentVideo?.status === "READY" && !replaceMode
                ? "READY"
                : "SELECT";

  const videoWorkflowLocked =
    busy !== null ||
    currentVideo?.status === "UPLOADING" ||
    currentVideo?.status === "PROCESSING";

  const showVideoSetup =
    !currentVideo || replaceMode || currentVideo.status === "FAILED";

  const uploadPercent =
    transferProgress?.phase === "UPLOADING" ? transferProgress.percent : null;

  return (
    <div className="grid gap-5">
      <div className="overflow-x-auto border-b border-line">
        <div className="flex min-w-max gap-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === item.key
                  ? "border-brand text-brand"
                  : "border-transparent text-muted hover:text-content"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <div
          role={error ? "alert" : "status"}
          className={`fixed end-5 top-20 z-[100] flex max-w-md items-start gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg ${
            error
              ? "border-red-200 text-red-700"
              : "border-emerald-200 text-emerald-800"
          }`}
        >
          <span
            className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              error
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {error ? "!" : "✓"}
          </span>
          <span className="leading-5">{message}</span>
          <button
            type="button"
            aria-label={labels.content.dismiss}
            onClick={() => setMessage(null)}
            className="ms-auto text-muted hover:text-content"
          >
            ×
          </button>
        </div>
      ) : null}

      {tab === "general" ? (
        <form
          onSubmit={saveGeneral}
          className="grid gap-5 rounded-lg border border-line bg-white p-5 sm:p-6"
        >
          <LocalizedTextField
            field="title"
            label={labels.general.title}
            content={contentDictionary}
            translations={editor.lesson.titleTranslations}
            fallback={editor.lesson.title}
            maxLength={250}
            required
          />
          <div className="grid gap-2">
            <span className="text-sm font-medium text-content">
              {labels.general.description}
            </span>
            <LocalizedRichTextEditor
              value={richDescription}
              onChange={setRichDescription}
              content={contentDictionary}
              training={training}
              disabled={busy !== null}
            />
          </div>
          <label className="grid gap-2 text-sm font-medium text-content">
            {labels.general.status}
            <select
              name="status"
              defaultValue={editor.lesson.status}
              className="h-11 rounded-md border border-line bg-white px-3 font-normal"
            >
              <option value="DRAFT">{labels.general.draft}</option>
              <option value="PUBLISHED">{labels.general.published}</option>
              <option value="ARCHIVED">{labels.general.archived}</option>
            </select>
          </label>
          <div>
            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy === "general" ? labels.saving : labels.save}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "content" ? (
        <div className="grid gap-5">
          <section className="rounded-lg border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-content">
                  {labels.content.title}
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {editor.lesson.contentType
                    ? `${labels.content.currentContent}: ${
                        labels.contentTypes[editor.lesson.contentType]
                      }`
                    : labels.content.help}
                </p>
              </div>

              {editor.lesson.contentType ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={videoWorkflowLocked}
                    onClick={() => setShowContentTypes((value) => !value)}
                    className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-content hover:bg-surface-subtle disabled:opacity-50"
                  >
                    {showContentTypes
                      ? labels.content.cancelChangeType
                      : labels.content.changeContentType}
                  </button>
                  <details className="relative">
                    <summary className="flex h-9 cursor-pointer list-none items-center rounded-md border border-line bg-white px-3 text-sm text-content hover:bg-surface-subtle">
                      •••
                    </summary>
                    <div className="absolute end-0 top-11 z-20 min-w-56 rounded-lg border border-line bg-white p-1.5 shadow-lg">
                      <button
                        type="button"
                        disabled={videoWorkflowLocked}
                        onClick={() => void clearContent()}
                        className="w-full rounded-md px-3 py-2 text-start text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {labels.content.removePrimaryContent}
                      </button>
                    </div>
                  </details>
                </div>
              ) : null}
            </div>

            {showContentTypes || !editor.lesson.contentType ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(["VIDEO", "DOCUMENT", "ARTICLE", "QUIZ"] as const).map(
                  (type) => (
                    <ContentTypeCard
                      key={type}
                      type={type}
                      current={editor.lesson.contentType}
                      label={labels.contentTypes[type]}
                      help={
                        type === "VIDEO"
                          ? labels.content.videoHelp
                          : type === "DOCUMENT"
                            ? labels.content.documentHelp
                            : type === "ARTICLE"
                              ? labels.content.articleHelp
                              : labels.content.quizHelp
                      }
                      disabled={videoWorkflowLocked}
                      onSelect={() => void chooseContentType(type)}
                    />
                  ),
                )}
              </div>
            ) : null}
          </section>

          {editor.lesson.contentType === "VIDEO" ? (
            <section className="grid gap-5 rounded-lg border border-line bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-content">
                      {labels.content.videoWorkspace}
                    </h2>
                    <span className="rounded-full border border-line bg-surface-subtle px-2.5 py-1 text-[11px] font-semibold text-muted">
                      {sourceLabel}
                    </span>
                    {currentVideo ? (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          currentVideo.status === "READY"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : currentVideo.status === "FAILED"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-sky-200 bg-sky-50 text-sky-700"
                        }`}
                      >
                        {currentVideo.status === "READY"
                          ? labels.content.ready
                          : currentVideo.status === "FAILED"
                            ? labels.content.failed
                            : currentVideo.processingPhase === "FINALIZING"
                              ? labels.content.finalizing
                              : labels.content.processing}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {currentVideo?.status === "READY" && !replaceMode
                      ? labels.content.currentVideoHelp
                      : labels.content.videoWorkspaceHelp}
                  </p>
                </div>
              </div>

              {currentVideo ||
              currentFile ||
              busy === "aws" ||
              busy === "local" ? (
                <VideoWorkflowStepper
                  source={workflowSource}
                  stage={workflowStage}
                  uploadPercent={uploadPercent}
                  uploadLoaded={
                    transferProgress?.phase === "UPLOADING"
                      ? transferProgress.loaded
                      : null
                  }
                  uploadTotal={
                    transferProgress?.phase === "UPLOADING"
                      ? transferProgress.total
                      : null
                  }
                  processingPercent={processingPercent}
                  labels={labels.content}
                />
              ) : null}

              {currentVideo?.status === "FAILED" && !replaceMode ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        {labels.content.processingFailedTitle}
                      </p>
                      <p className="mt-1 max-w-3xl text-xs leading-5 text-red-700">
                        {currentVideo.failureMessage ??
                          labels.content.failedHelp}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentVideo.deliveryMode === "AWS_AUTOMATED" ? (
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => void retryProcessing()}
                          className="h-9 rounded-md bg-brand px-3 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {labels.content.retryProcessing}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => setReplaceMode(true)}
                        className="h-9 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 disabled:opacity-50"
                      >
                        {labels.content.replaceVideo}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentVideo?.status === "READY" && !replaceMode ? (
                <div className="overflow-hidden rounded-xl border border-line bg-surface-subtle">
                  <div className="grid lg:grid-cols-[minmax(320px,440px)_minmax(0,1fr)]">
                    <div className="border-b border-line bg-slate-950 lg:border-b-0 lg:border-e">
                      <div className="aspect-video">
                        {currentThumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={currentThumbnail}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-slate-400">
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              className="size-12 fill-none stroke-current"
                              strokeWidth="1.5"
                            >
                              <rect x="3" y="5" width="18" height="14" rx="2" />
                              <path d="m7 15 3-3 2.5 2.5L15 12l3 3" />
                              <circle cx="8" cy="9" r="1" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid content-start gap-5 p-5 sm:p-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {labels.content.currentVideo}
                        </p>
                        <h3 className="mt-1 truncate text-lg font-semibold text-content">
                          {currentVideo.originalFilename}
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                          {sourceLabel} ·{" "}
                          {currentVideo.deliveryMode === "AWS_AUTOMATED"
                            ? labels.content.protectedHls
                            : currentVideo.deliveryMode === "LOCAL"
                              ? labels.content.protectedMp4
                              : labels.content.externalHls}
                        </p>
                      </div>

                      <dl className="grid gap-x-6 gap-y-4 text-xs sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <dt className="text-muted">
                            {labels.content.duration}
                          </dt>
                          <dd className="mt-1 font-semibold text-content">
                            {formatDuration(currentVideo.durationSeconds)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">
                            {labels.content.resolution}
                          </dt>
                          <dd className="mt-1 font-semibold text-content">
                            {currentVideo.width ?? "—"}×
                            {currentVideo.height ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">
                            {labels.content.originalSize}
                          </dt>
                          <dd className="mt-1 font-semibold text-content">
                            {bytes(currentVideo.sizeBytes)}
                          </dd>
                        </div>
                        {currentVideo.deliveryMode === "AWS_AUTOMATED" ? (
                          <div>
                            <dt className="text-muted">
                              {labels.content.processedSizeLabel}
                            </dt>
                            <dd className="mt-1 font-semibold text-content">
                              {bytes(currentVideo.processedSizeBytes)}
                            </dd>
                          </div>
                        ) : null}
                        {currentVideo.outputVariants?.length ? (
                          <div>
                            <dt className="text-muted">
                              {labels.content.variants}
                            </dt>
                            <dd className="mt-1 font-semibold text-content">
                              {currentVideo.outputVariants
                                .map((height) => `${height}p`)
                                .join(" · ")}
                            </dd>
                          </div>
                        ) : null}
                        <div>
                          <dt className="text-muted">
                            {labels.content.playback}
                          </dt>
                          <dd
                            className={`mt-1 font-semibold ${
                              currentVideo.playbackAvailable
                                ? "text-emerald-700"
                                : "text-muted"
                            }`}
                          >
                            {currentVideo.playbackAvailable
                              ? labels.content.available
                              : labels.content.unavailable}
                          </dd>
                        </div>
                      </dl>

                      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                        <button
                          type="button"
                          disabled={videoWorkflowLocked}
                          onClick={() => {
                            setReplaceMode(true);
                            setVideoSource(
                              currentVideo.deliveryMode === "LOCAL"
                                ? "LOCAL"
                                : currentVideo.deliveryMode === "AWS_MANUAL"
                                  ? "URL"
                                  : "AWS",
                            );
                          }}
                          className="h-9 rounded-md bg-brand px-3 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {labels.content.replaceVideo}
                        </button>

                        <FilePicker
                          variant="button"
                          preview="image"
                          files={thumbnailFile ? [thumbnailFile] : []}
                          onFilesChange={(files) => {
                            const selected = files[0] ?? null;
                            setThumbnailFile(selected);
                            if (thumbnailPreviewUrl) {
                              URL.revokeObjectURL(thumbnailPreviewUrl);
                            }
                            setThumbnailPreviewUrl(
                              selected ? URL.createObjectURL(selected) : null,
                            );
                          }}
                          accept="image/jpeg,image/png,image/webp"
                          disabled={busy !== null}
                          label={labels.content.changeThumbnail}
                          browseLabel={labels.content.changeThumbnail}
                          removeLabel={training.cancel}
                        />

                        {thumbnailFile ? (
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => void saveThumbnail()}
                            className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-content disabled:opacity-50"
                          >
                            {labels.content.saveThumbnail}
                          </button>
                        ) : null}

                        <div className="ms-auto">
                          <AdminActionMenu
                            orientation="horizontal"
                            label={training.actions}
                            items={[
                              {
                                key: "delete-video",
                                label: labels.content.deleteVideo,
                                tone: "danger",
                                onSelect: () => {
                                  if (busy === null) void deleteVideo();
                                },
                              },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentVideo?.status === "READY" ? (
                <TrainingVideoEnrichmentSummary
                  courseId={courseId}
                  sectionId={sectionId}
                  lessonId={lessonId}
                />
              ) : null}

              {replaceMode && currentVideo?.status === "READY" ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-amber-900">
                      {labels.content.replacingVideo}
                    </p>
                    <p className="mt-0.5 text-xs text-amber-800">
                      {labels.content.replacingVideoHelp}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={videoWorkflowLocked}
                    onClick={() => {
                      setReplaceMode(false);
                      clearVideoSelection("AWS");
                      clearVideoSelection("LOCAL");
                    }}
                    className="h-8 rounded-md border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-900 disabled:opacity-50"
                  >
                    {labels.content.cancelReplace}
                  </button>
                </div>
              ) : null}

              {showVideoSetup && !videoWorkflowLocked ? (
                <div className="grid gap-5">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                      {labels.content.source}
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {(["LOCAL", "AWS", "URL"] as const).map((source) => (
                        <button
                          key={source}
                          type="button"
                          onClick={() => {
                            setVideoSource(source);
                            setSelectedVideoMetadata(null);
                            setAutoThumbnailFile(null);
                          }}
                          className={`rounded-lg border p-4 text-start transition ${
                            videoSource === source
                              ? "border-brand/40 bg-brand-soft/50"
                              : "border-line hover:bg-surface-subtle"
                          }`}
                        >
                          <span className="block text-sm font-semibold text-content">
                            {source === "LOCAL"
                              ? labels.content.local
                              : source === "AWS"
                                ? labels.content.aws
                                : labels.content.url}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted">
                            {source === "LOCAL"
                              ? labels.content.localHelp
                              : source === "AWS"
                                ? labels.content.awsHelp
                                : labels.content.urlHelp}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {videoSource === "LOCAL" ? (
                    <div className="grid gap-3">
                      <VideoDropZone
                        file={localFile}
                        disabled={false}
                        labels={labels.content}
                        onSelect={(file) =>
                          void prepareVideoSelection(file, "LOCAL")
                        }
                        onRemove={() => clearVideoSelection("LOCAL")}
                      />
                      <div>
                        <button
                          type="button"
                          disabled={!localFile}
                          onClick={() => void localUpload()}
                          className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {currentVideo
                            ? labels.content.uploadReplacement
                            : labels.content.upload}
                        </button>
                      </div>
                    </div>
                  ) : videoSource === "AWS" ? (
                    <div className="grid gap-3">
                      <VideoDropZone
                        file={automatedFile}
                        disabled={false}
                        labels={labels.content}
                        onSelect={(file) =>
                          void prepareVideoSelection(file, "AWS")
                        }
                        onRemove={() => clearVideoSelection("AWS")}
                      />
                      <div>
                        <button
                          type="button"
                          disabled={!automatedFile}
                          onClick={() => void automatedUpload()}
                          className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {currentVideo
                            ? labels.content.uploadReplacementProcess
                            : labels.content.uploadProcess}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={saveUrl}
                      className="grid gap-4 rounded-xl border border-line bg-surface-subtle p-4"
                    >
                      <label className="grid gap-2 text-xs font-semibold text-content">
                        {labels.content.playbackUrl}
                        <input
                          value={manualUrl}
                          onChange={(event) => setManualUrl(event.target.value)}
                          placeholder="https://media.example.com/master.m3u8"
                          className="h-10 rounded-md border border-line bg-white px-3 text-sm font-normal"
                        />
                      </label>
                      <details className="rounded-md border border-line bg-white p-3">
                        <summary className="cursor-pointer text-xs font-semibold text-content">
                          {labels.content.advancedMetadata}
                        </summary>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <input
                            name="sourceSizeBytes"
                            inputMode="numeric"
                            placeholder={labels.content.sourceSize}
                            className="h-10 rounded-md border border-line px-3 text-sm"
                          />
                          <input
                            name="processedSizeBytes"
                            inputMode="numeric"
                            placeholder={labels.content.processedSize}
                            className="h-10 rounded-md border border-line px-3 text-sm"
                          />
                          <input
                            name="durationSeconds"
                            inputMode="numeric"
                            placeholder={labels.content.duration}
                            className="h-10 rounded-md border border-line px-3 text-sm"
                          />
                          <input
                            name="width"
                            inputMode="numeric"
                            placeholder={labels.content.width}
                            className="h-10 rounded-md border border-line px-3 text-sm"
                          />
                          <input
                            name="height"
                            inputMode="numeric"
                            placeholder={labels.content.height}
                            className="h-10 rounded-md border border-line px-3 text-sm"
                          />
                        </div>
                      </details>
                      <div>
                        <button
                          type="submit"
                          disabled={!manualUrl.trim()}
                          className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {labels.save}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : null}

              {videoWorkflowLocked ? (
                <div className="rounded-lg border border-line bg-surface-subtle px-4 py-3 text-xs leading-5 text-muted">
                  {workflowSource === "AWS"
                    ? labels.content.awsLockedHelp
                    : labels.content.localLockedHelp}
                </div>
              ) : null}
            </section>
          ) : null}

          {editor.lesson.contentType === "DOCUMENT" ? (
            <section className="grid gap-4 rounded-lg border border-line bg-white p-5 sm:p-6">
              <div>
                <h2 className="text-sm font-semibold text-content">
                  {labels.content.document}
                </h2>
                {editor.media.document ? (
                  <p className="mt-1 text-xs text-muted">
                    {editor.media.document.originalFilename} ·{" "}
                    {editor.media.document.pageCount} pages ·{" "}
                    {bytes(editor.media.document.sizeBytes)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted">
                    {labels.content.notReady}
                  </p>
                )}
              </div>
              <FilePicker
                files={documentFile ? [documentFile] : []}
                onFilesChange={(files) => setDocumentFile(files[0] ?? null)}
                accept="application/pdf,.pdf"
                disabled={busy !== null}
                label={labels.content.document}
                description={labels.content.notReady}
                browseLabel={labels.content.attachDocument}
                removeLabel={training.cancel}
              />
              <div>
                <button
                  type="button"
                  disabled={!documentFile || busy !== null}
                  onClick={() => void attachDocument()}
                  className="h-9 rounded-md bg-brand px-3 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {labels.content.attachDocument}
                </button>
              </div>
            </section>
          ) : null}

          {editor.lesson.contentType === "ARTICLE" ? (
            <section className="grid gap-4 rounded-lg border border-line bg-white p-5 sm:p-6">
              <LocalizedRichTextEditor
                value={articleContent}
                onChange={setArticleContent}
                content={contentDictionary}
                training={training}
                disabled={busy !== null}
              />
              <div>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void saveArticle()}
                  className="h-9 rounded-md bg-brand px-3 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {labels.content.articleSave}
                </button>
              </div>
            </section>
          ) : null}

          {editor.lesson.contentType === "QUIZ" ? (
            <TrainingQuizBuilder
              target={{ kind: "lesson", courseId, sectionId, lessonId }}
              locale={contentDictionary.locale}
              contentDictionary={contentDictionary}
              onChanged={async () => {
                setEditor(await jsonRequest<TrainingLessonEditorState>(base));
              }}
            />
          ) : null}
        </div>
      ) : null}

      {tab === "resources" ? (
        <div className="grid gap-5">
          <form
            onSubmit={addResource}
            className="grid gap-4 rounded-lg border border-line bg-white p-5 sm:p-6"
          >
            <div>
              <h2 className="text-sm font-semibold text-content">
                {labels.resources.title}
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                {labels.resources.help}
              </p>
            </div>
            <FilePicker
              files={resourceFile ? [resourceFile] : []}
              onFilesChange={(files) => setResourceFile(files[0] ?? null)}
              disabled={busy !== null}
              label={labels.resources.title}
              description={labels.resources.help}
              browseLabel={labels.resources.add}
              removeLabel={training.cancel}
            />
            <LocalizedTextField
              field="resource-new"
              label={labels.resources.displayTitle}
              content={contentDictionary}
              fallback={resourceFile?.name ?? ""}
              maxLength={250}
            />
            <label className="flex items-center gap-2 text-sm text-content">
              <input type="checkbox" name="customerVisible" defaultChecked />
              {labels.resources.customerVisible}
            </label>
            <div>
              <button
                type="submit"
                disabled={!resourceFile || busy !== null}
                className="h-9 rounded-md bg-brand px-3 text-xs font-semibold text-white disabled:opacity-50"
              >
                {labels.resources.add}
              </button>
            </div>
          </form>

          {resourcesWithOrder.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
              {labels.resources.empty}
            </div>
          ) : (
            <div className="grid gap-3">
              {resourcesWithOrder.map((resource, index) => (
                <ResourceEditorRow
                  key={resource.id}
                  resource={resource}
                  index={index}
                  total={resourcesWithOrder.length}
                  base={base}
                  contentDictionary={contentDictionary}
                  labels={labels}
                  disabled={busy !== null}
                  onChanged={setEditor}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "review" ? (
        <section className="grid gap-5 rounded-lg border border-line bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-content">
              {labels.review.title}
            </h2>
            <p
              className={`mt-2 text-sm ${editor.review.ready ? "text-emerald-700" : "text-amber-800"}`}
            >
              {editor.review.ready
                ? labels.review.ready
                : labels.review.notReady}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-surface-subtle p-4">
              <p className="text-xs text-muted">{labels.content.chooseType}</p>
              <p className="mt-1 text-sm font-semibold text-content">
                {editor.lesson.contentType
                  ? labels.contentTypes[editor.lesson.contentType]
                  : labels.content.noContent}
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface-subtle p-4">
              <p className="text-xs text-muted">{labels.general.status}</p>
              <p className="mt-1 text-sm font-semibold text-content">
                {editor.lesson.status}
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface-subtle p-4">
              <p className="text-xs text-muted">{labels.review.resources}</p>
              <p className="mt-1 text-sm font-semibold text-content">
                {editor.review.resourcesCount}
              </p>
            </div>
          </div>
          {editor.review.blockers.length > 0 ? (
            <ul className="grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {editor.review.blockers.map((blocker) => (
                <li key={blocker}>
                  • {labels.review.blockers[blocker] ?? blocker}
                </li>
              ))}
            </ul>
          ) : null}
          <div>
            <button
              type="button"
              disabled={
                !editor.review.ready ||
                busy !== null ||
                editor.lesson.status === "PUBLISHED"
              }
              onClick={() => void publish()}
              className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {labels.review.publish}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
