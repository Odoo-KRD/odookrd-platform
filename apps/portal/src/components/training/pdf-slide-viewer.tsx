"use client";

import type { TrainingCustomerSlideMedia } from "@odookrd/types";
import { useEffect, useRef, useState } from "react";

import type { TrainingMediaDictionary } from "@/lib/i18n/training-media";

interface PdfViewport {
  width: number;
  height: number;
}
interface PdfPage {
  getViewport(input: { scale: number }): PdfViewport;
  render(input: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }): { promise: Promise<void> };
}
interface PdfDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
}
interface PdfLoadingTask {
  destroy(): Promise<void>;
}

export function PdfSlideViewer({
  media,
  labels,
}: {
  media: TrainingCustomerSlideMedia;
  labels: TrainingMediaDictionary;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const documentRef = useRef<PdfDocument | null>(null);
  const loadingTaskRef = useRef<PdfLoadingTask | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(media.pageCount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const source = `/api${media.contentPath}`;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(false);
      }
    });
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/api/training/pdf-worker";
        const task = pdfjs.getDocument({ url: source, withCredentials: true });
        loadingTaskRef.current = task as unknown as PdfLoadingTask;
        const document = (await task.promise) as unknown as PdfDocument;
        if (cancelled) {
          await task.destroy();
          return;
        }
        documentRef.current = document;
        setPageCount(document.numPages);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      documentRef.current = null;
      const currentTask = loadingTaskRef.current;
      loadingTaskRef.current = null;
      if (currentTask) void currentTask.destroy();
    };
  }, [source]);

  useEffect(() => {
    const document = documentRef.current;
    const canvas = canvasRef.current;
    if (!document || !canvas || loading || error) return;
    let cancelled = false;
    void (async () => {
      try {
        const page = await document.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1.5 });
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = "auto";
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable.");
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [error, loading, pageNumber]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-surface-subtle">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto overscroll-contain bg-slate-900/95 p-3 sm:p-6">
        {loading ? (
          <p className="text-sm text-white/75">{labels.loadingSlides}</p>
        ) : error ? (
          <p className="text-sm text-red-200">{labels.slideLoadFailed}</p>
        ) : (
          <canvas
            ref={canvasRef}
            onContextMenu={(event) => event.preventDefault()}
            className="h-auto max-h-full max-w-full bg-white shadow-xl"
          />
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-3 py-3 sm:px-4">
        <button
          type="button"
          disabled={pageNumber <= 1 || loading}
          onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
          className="inline-flex h-9 items-center rounded-md border border-line px-3 text-xs font-semibold text-content hover:bg-surface-subtle disabled:opacity-40"
        >
          {labels.previousPage}
        </button>
        <span className="text-xs font-medium text-muted">
          {labels.page} {pageNumber} {labels.of} {pageCount}
        </span>
        <button
          type="button"
          disabled={pageNumber >= pageCount || loading}
          onClick={() =>
            setPageNumber((value) => Math.min(pageCount, value + 1))
          }
          className="inline-flex h-9 items-center rounded-md border border-line px-3 text-xs font-semibold text-content hover:bg-surface-subtle disabled:opacity-40"
        >
          {labels.nextPage}
        </button>
      </div>
    </div>
  );
}
