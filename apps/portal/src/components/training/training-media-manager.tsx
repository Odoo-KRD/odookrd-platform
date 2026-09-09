"use client";

import type {
  FileAsset,
  TrainingAutomatedUploadInit,
  TrainingLessonMediaAdmin,
} from "@odookrd/types";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { TrainingMediaDictionary } from "@/lib/i18n/training/media";

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
  const body = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
  } & T;
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
      reject(new Error("The MP4 metadata could not be read."));
    };
    video.src = url;
  });
}

async function readPdfPageCount(file: File): Promise<number> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/api/training/pdf-worker";
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const document = await task.promise;
  try {
    return document.numPages;
  } finally {
    await task.destroy();
  }
}

function bytes(value: number | null): string {
  if (value === null) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

export function TrainingMediaManager({
  courseId,
  sectionId,
  lessonId,
  initialMedia,
  labels,
}: {
  courseId: string;
  sectionId: string;
  lessonId: string;
  initialMedia: TrainingLessonMediaAdmin;
  labels: TrainingMediaDictionary;
}) {
  const [media, setMedia] = useState(initialMedia);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [automatedFile, setAutomatedFile] = useState<File | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [manualUrl, setManualUrl] = useState(
    initialMedia.video?.manualPlaybackUrl ?? "",
  );
  const [manualSourceSize, setManualSourceSize] = useState("");
  const [manualProcessedSize, setManualProcessedSize] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualWidth, setManualWidth] = useState("");
  const [manualHeight, setManualHeight] = useState("");

  const base = useMemo(
    () =>
      `/api/training/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/media`,
    [courseId, lessonId, sectionId],
  );

  const refresh = useCallback(async () => {
    try {
      const next = await jsonRequest<TrainingLessonMediaAdmin>(base);
      setMedia(next);
    } catch {
      // Polling must not replace a useful processing state with a transient error.
    }
  }, [base]);

  useEffect(() => {
    if (media.video?.status !== "PROCESSING") return;
    const timer = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(timer);
  }, [media.video?.status, refresh]);

  function begin(key: string): void {
    setBusy(key);
    setMessage(null);
    setError(false);
  }

  function finishFailure(value: unknown): void {
    setMessage(value instanceof Error ? value.message : labels.actionFailed);
    setError(true);
    setBusy(null);
  }

  async function automatedUpload(): Promise<void> {
    if (!automatedFile || automatedFile.type !== "video/mp4") {
      setMessage(labels.invalidMp4);
      setError(true);
      return;
    }
    begin("automated");
    try {
      const metadata = await inspectVideo(automatedFile);
      const init = await jsonRequest<TrainingAutomatedUploadInit>(
        `${base}/aws-automated/init`,
        {
          method: "POST",
          body: JSON.stringify({
            filename: automatedFile.name,
            sizeBytes: automatedFile.size,
            ...metadata,
          }),
        },
      );
      const upload = await fetch(init.uploadUrl, {
        method: "PUT",
        headers: init.requiredHeaders,
        body: automatedFile,
      });
      if (!upload.ok) throw new Error(labels.uploadFailed);
      const next = await jsonRequest<TrainingLessonMediaAdmin>(
        `${base}/aws-automated/complete`,
        {
          method: "POST",
          body: JSON.stringify({ assetId: init.assetId }),
        },
      );
      setMedia(next);
      setAutomatedFile(null);
      setMessage(labels.processing);
      setBusy(null);
    } catch (value) {
      finishFailure(value);
    }
  }

  async function localUpload(): Promise<void> {
    if (!localFile || localFile.type !== "video/mp4") {
      setMessage(labels.invalidMp4);
      setError(true);
      return;
    }
    begin("local");
    try {
      const metadata = await inspectVideo(localFile);
      const response = await fetch(`${base}/local`, {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "video/mp4",
          "x-odookrd-filename": encodeURIComponent(localFile.name),
          "x-odookrd-size": String(localFile.size),
          ...(metadata.durationSeconds
            ? { "x-odookrd-duration": String(metadata.durationSeconds) }
            : {}),
          ...(metadata.width
            ? { "x-odookrd-width": String(metadata.width) }
            : {}),
          ...(metadata.height
            ? { "x-odookrd-height": String(metadata.height) }
            : {}),
        },
        body: localFile,
      });
      const next = (await response.json().catch(() => ({}))) as
        TrainingLessonMediaAdmin | { message?: string };
      if (!response.ok || !("lessonId" in next)) {
        throw new Error(
          "message" in next && next.message
            ? next.message
            : labels.uploadFailed,
        );
      }
      setMedia(next);
      setLocalFile(null);
      setMessage(labels.ready);
      setBusy(null);
    } catch (value) {
      finishFailure(value);
    }
  }

  function optionalInteger(value: string): number | undefined {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  async function saveManual(): Promise<void> {
    begin("manual");
    try {
      const next = await jsonRequest<TrainingLessonMediaAdmin>(
        `${base}/aws-manual`,
        {
          method: "POST",
          body: JSON.stringify({
            playbackUrl: manualUrl.trim(),
            sourceSizeBytes: optionalInteger(manualSourceSize),
            processedSizeBytes: optionalInteger(manualProcessedSize),
            durationSeconds: optionalInteger(manualDuration),
            width: optionalInteger(manualWidth),
            height: optionalInteger(manualHeight),
          }),
        },
      );
      setMedia(next);
      setMessage(labels.ready);
      setBusy(null);
    } catch (value) {
      finishFailure(value);
    }
  }

  async function attachPdf(): Promise<void> {
    if (!pdfFile || pdfFile.type !== "application/pdf") {
      setMessage(labels.invalidPdf);
      setError(true);
      return;
    }
    begin("slides");
    try {
      const pageCount = await readPdfPageCount(pdfFile);
      const formData = new FormData();
      formData.set("kind", "DOCUMENT");
      formData.set("file", pdfFile, pdfFile.name);
      const uploaded = await jsonRequest<FileAsset>("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      const next = await jsonRequest<TrainingLessonMediaAdmin>(
        `${base}/slides`,
        {
          method: "POST",
          body: JSON.stringify({
            fileAssetId: uploaded.id,
            pageCount,
          }),
        },
      );
      setMedia(next);
      setPdfFile(null);
      setMessage(labels.ready);
      setBusy(null);
    } catch (value) {
      finishFailure(value);
    }
  }

  async function clearMedia(): Promise<void> {
    begin("clear");
    try {
      const next = await jsonRequest<TrainingLessonMediaAdmin>(base, {
        method: "DELETE",
      });
      setMedia(next);
      setMessage(labels.ready);
      setBusy(null);
    } catch (value) {
      finishFailure(value);
    }
  }

  const statusLabel = media.video
    ? {
        UPLOADING: labels.uploading,
        PROCESSING: labels.processing,
        READY: labels.ready,
        FAILED: labels.failed,
        ARCHIVED: labels.archived,
      }[media.video.status]
    : null;

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-content">
              {labels.currentMedia}
            </h2>
            {media.video ? (
              <div className="mt-3 grid gap-1 text-sm text-muted">
                <p>
                  {media.video.deliveryMode} · {statusLabel}
                </p>
                <p>{media.video.originalFilename}</p>
                <p>
                  {labels.sourceSize}: {bytes(media.video.sizeBytes)} ·{" "}
                  {labels.processedSize}:{" "}
                  {bytes(media.video.processedSizeBytes)}
                </p>
                <p>
                  {labels.duration}: {media.video.durationSeconds ?? "—"}s ·{" "}
                  {labels.resolution}:{" "}
                  {media.video.width && media.video.height
                    ? `${media.video.width}×${media.video.height}`
                    : "—"}
                </p>
                {media.video.failureMessage ? (
                  <p className="text-red-700">{media.video.failureMessage}</p>
                ) : null}
              </div>
            ) : media.slides ? (
              <div className="mt-3 grid gap-1 text-sm text-muted">
                <p>{media.slides.originalFilename}</p>
                <p>
                  {media.slides.pageCount} pages ·{" "}
                  {bytes(media.slides.sizeBytes)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">{labels.noMedia}</p>
            )}
          </div>
          {media.video || media.slides ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void clearMedia()}
              className="inline-flex h-9 items-center rounded-md border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {labels.clearMedia}
            </button>
          ) : null}
        </div>
        {message ? (
          <p
            className={`mt-4 text-sm ${error ? "text-red-700" : "text-emerald-700"}`}
          >
            {message}
          </p>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-5">
          <h3 className="text-sm font-semibold text-content">
            {labels.automated}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {labels.automatedHelp}
          </p>
          <input
            type="file"
            accept="video/mp4,.mp4"
            disabled={busy !== null}
            onChange={(event) =>
              setAutomatedFile(event.target.files?.[0] ?? null)
            }
            className="mt-4 block w-full text-sm text-content"
          />
          <button
            type="button"
            disabled={busy !== null || !automatedFile}
            onClick={() => void automatedUpload()}
            className="mt-4 inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {labels.uploadProcess}
          </button>
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <h3 className="text-sm font-semibold text-content">
            {labels.manual}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {labels.manualHelp}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 grid gap-1 text-xs font-medium text-content">
              {labels.playbackUrl}
              <input
                value={manualUrl}
                onChange={(event) => setManualUrl(event.target.value)}
                type="url"
                className="h-10 rounded-md border border-line px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-content">
              {labels.sourceSize}
              <input
                value={manualSourceSize}
                onChange={(event) => setManualSourceSize(event.target.value)}
                inputMode="numeric"
                className="h-10 rounded-md border border-line px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-content">
              {labels.processedSize}
              <input
                value={manualProcessedSize}
                onChange={(event) => setManualProcessedSize(event.target.value)}
                inputMode="numeric"
                className="h-10 rounded-md border border-line px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-content">
              {labels.duration}
              <input
                value={manualDuration}
                onChange={(event) => setManualDuration(event.target.value)}
                inputMode="numeric"
                className="h-10 rounded-md border border-line px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-content">
              Width
              <input
                value={manualWidth}
                onChange={(event) => setManualWidth(event.target.value)}
                inputMode="numeric"
                className="h-10 rounded-md border border-line px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-content">
              Height
              <input
                value={manualHeight}
                onChange={(event) => setManualHeight(event.target.value)}
                inputMode="numeric"
                className="h-10 rounded-md border border-line px-3 text-sm"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busy !== null || !manualUrl.trim()}
            onClick={() => void saveManual()}
            className="mt-4 inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {labels.saveManual}
          </button>
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <h3 className="text-sm font-semibold text-content">{labels.local}</h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {labels.localHelp}
          </p>
          <input
            type="file"
            accept="video/mp4,.mp4"
            disabled={busy !== null}
            onChange={(event) => setLocalFile(event.target.files?.[0] ?? null)}
            className="mt-4 block w-full text-sm text-content"
          />
          <button
            type="button"
            disabled={busy !== null || !localFile}
            onClick={() => void localUpload()}
            className="mt-4 inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {labels.uploadLocal}
          </button>
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <h3 className="text-sm font-semibold text-content">
            {labels.slides}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {labels.slidesHelp}
          </p>
          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={busy !== null}
            onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
            className="mt-4 block w-full text-sm text-content"
          />
          <button
            type="button"
            disabled={busy !== null || !pdfFile}
            onClick={() => void attachPdf()}
            className="mt-4 inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {labels.attachSlides}
          </button>
        </section>
      </div>
    </div>
  );
}
