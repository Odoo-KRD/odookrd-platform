"use client";

import type { TrainingCustomerSlideMedia } from "@odookrd/types";
import { useEffect, useRef, useState } from "react";

import type { TrainingMediaDictionary } from "@/lib/i18n/training/media";

interface PdfViewport {
  width: number;
  height: number;
}
interface PdfRenderTask {
  promise: Promise<void>;
  cancel(): void;
}

interface PdfPage {
  getViewport(input: { scale: number }): PdfViewport;
  render(input: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }): PdfRenderTask;
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
  initialPageNumber = 1,
  onPageChange,
}: {
  media: TrainingCustomerSlideMedia;
  labels: TrainingMediaDictionary;
  initialPageNumber?: number;
  onPageChange?: (pageNumber: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<PdfDocument | null>(null);
  const loadingTaskRef = useRef<PdfLoadingTask | null>(null);
  const [pageNumber, setPageNumber] = useState(
    Math.max(1, Math.floor(initialPageNumber)),
  );
  const [pageCount, setPageCount] = useState(media.pageCount);
  const [viewportRevision, setViewportRevision] = useState(0);
  const lastReportedPageRef = useRef(0);
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
        const task = pdfjs.getDocument({
          url: source,
          withCredentials: true,
          // Some training PDFs contain embedded/subset fonts that browser font
          // loading may substitute or reshape incorrectly. Rendering glyphs
          // through PDF.js path commands preserves the PDF's embedded outlines.
          disableFontFace: true,
          useSystemFonts: false,
        });
        loadingTaskRef.current = task as unknown as PdfLoadingTask;
        const document = (await task.promise) as unknown as PdfDocument;
        if (cancelled) {
          await task.destroy();
          return;
        }
        documentRef.current = document;
        setPageCount(document.numPages);
        setPageNumber((value) =>
          Math.min(Math.max(1, value), document.numPages),
        );
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
    const viewportElement = viewportRef.current;
    if (!viewportElement) return;

    let animationFrame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        setViewportRevision((value) => value + 1);
      });
    });

    observer.observe(viewportElement);

    return () => {
      observer.disconnect();
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  useEffect(() => {
    if (loading || error || pageNumber === lastReportedPageRef.current) return;
    lastReportedPageRef.current = pageNumber;
    onPageChange?.(pageNumber);
  }, [error, loading, onPageChange, pageNumber]);

  useEffect(() => {
    const document = documentRef.current;
    const canvas = canvasRef.current;
    const viewportElement = viewportRef.current;
    if (!document || !canvas || !viewportElement || loading || error) return;

    let cancelled = false;
    let renderTask: PdfRenderTask | null = null;

    void (async () => {
      try {
        const page = await document.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const computed = window.getComputedStyle(viewportElement);
        const horizontalPadding =
          Number.parseFloat(computed.paddingLeft) +
          Number.parseFloat(computed.paddingRight);
        const verticalPadding =
          Number.parseFloat(computed.paddingTop) +
          Number.parseFloat(computed.paddingBottom);
        const availableWidth = Math.max(
          1,
          viewportElement.clientWidth - horizontalPadding,
        );
        const availableHeight = Math.max(
          1,
          viewportElement.clientHeight - verticalPadding,
        );

        const fitScale = Math.min(
          1.5,
          availableWidth / baseViewport.width,
          availableHeight / baseViewport.height,
        );
        const displayScale =
          Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 1;
        const viewport = page.getViewport({ scale: displayScale });
        const ratio = Math.max(1, window.devicePixelRatio || 1);

        canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
        canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable.");
        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
        });
        await renderTask.promise;
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [error, loading, pageNumber, viewportRevision]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-950">
      <div
        ref={viewportRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-auto overscroll-contain bg-slate-950 p-3 sm:p-5"
      >
        {loading ? (
          <p className="text-sm text-white/75">{labels.loadingSlides}</p>
        ) : error ? (
          <p className="text-sm text-red-200">{labels.slideLoadFailed}</p>
        ) : (
          <canvas
            ref={canvasRef}
            onContextMenu={(event) => event.preventDefault()}
            className="block shrink-0 bg-white shadow-2xl"
          />
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-3 py-3 sm:px-4">
        <button
          type="button"
          disabled={pageNumber <= 1 || loading}
          onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
          className="inline-flex h-9 items-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {labels.previousPage}
        </button>
        <span className="text-xs font-medium text-slate-400" dir="ltr">
          {labels.page} {pageNumber} {labels.of} {pageCount}
        </span>
        <button
          type="button"
          disabled={pageNumber >= pageCount || loading}
          onClick={() =>
            setPageNumber((value) => Math.min(pageCount, value + 1))
          }
          className="inline-flex h-9 items-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {labels.nextPage}
        </button>
      </div>
    </div>
  );
}
