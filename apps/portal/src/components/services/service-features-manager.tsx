"use client";

import type {
  Locale,
  ManagedServiceFeature,
  ServiceFeatureDefinition,
} from "@odookrd/types";
import { EmptyState } from "@odookrd/ui";
import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { ServiceFeatureAttachmentForm } from "@/components/services/service-feature-attachment-form";
import type { FormState } from "@/lib/forms";
import type { ServiceFeaturesDictionary } from "@/lib/i18n/service-features";
import type { ServicesDictionary } from "@/lib/i18n/services";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

interface FeatureOrderResult {
  ok: boolean;
  message: string | null;
}

interface ServiceFeaturesManagerProps {
  locale: Locale;
  items: ManagedServiceFeature[];
  total: number;
  definitions: ServiceFeatureDefinition[];
  services: ServicesDictionary;
  labels: ServiceFeaturesDictionary;
  content: ContentEditorDictionary;
  attachAction: (
    previousState: FormState,
    formData: FormData,
  ) => Promise<FormState>;
  updateAction: (
    featureId: string,
    previousState: FormState,
    formData: FormData,
  ) => Promise<FormState>;
  moveAction: (featureId: string, direction: "up" | "down") => Promise<void>;
  reorderAction: (ids: string[]) => Promise<FeatureOrderResult>;
}

type FeatureDialog = { mode: "add" } | { mode: "edit"; featureId: string };

type FeatureOrderOperation = () => Promise<FeatureOrderResult | void>;

function formattedValue(
  feature: ManagedServiceFeature,
  locale: Locale,
  labels: ServiceFeaturesDictionary,
): string {
  if (feature.valueType === "BOOLEAN") {
    return feature.defaultValue ? labels.yes : labels.no;
  }

  if (feature.valueType === "TEXT") {
    return feature.valueTranslations[locale] ?? String(feature.defaultValue);
  }

  return `${String(feature.defaultValue)}${feature.unit ? ` ${feature.unit}` : ""}`;
}

export function ServiceFeaturesManager({
  locale,
  items,
  total,
  definitions,
  services,
  labels,
  content,
  attachAction,
  updateAction,
  moveAction,
  reorderAction,
}: ServiceFeaturesManagerProps) {
  const dialogTitleId = useId();
  const dialogReference = useRef<HTMLElement>(null);
  const [dialog, setDialog] = useState<FeatureDialog | null>(null);
  const [optimisticOrder, setOptimisticOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const orderedFeatures = useMemo(() => {
    if (!optimisticOrder) return items;

    const byId = new Map(items.map((feature) => [feature.id, feature]));
    const ordered = optimisticOrder
      .map((id) => byId.get(id))
      .filter((feature): feature is ManagedServiceFeature => Boolean(feature));
    const included = new Set(ordered.map((feature) => feature.id));

    return [
      ...ordered,
      ...items.filter((feature) => !included.has(feature.id)),
    ];
  }, [items, optimisticOrder]);

  const editingFeature =
    dialog?.mode === "edit"
      ? (orderedFeatures.find((feature) => feature.id === dialog.featureId) ??
        null)
      : null;

  useEffect(() => {
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.body.style.overflow = "hidden";

    const focusTimeout = window.setTimeout(() => {
      dialogReference.current
        ?.querySelector<HTMLElement>(
          'select:not([disabled]), input:not([type="hidden"]):not([disabled]), button:not([disabled])',
        )
        ?.focus();
    }, 0);

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;

      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"]') !== dialogReference.current
      ) {
        return;
      }

      setDialog(null);
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.clearTimeout(focusTimeout);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [dialog]);

  function closeDialog(): void {
    setDialog(null);
  }

  function persistOrder(
    next: ManagedServiceFeature[],
    previous: ManagedServiceFeature[],
    operation: FeatureOrderOperation,
  ): void {
    setOptimisticOrder(next.map((feature) => feature.id));
    setNotice(null);

    startTransition(async () => {
      try {
        const result = await operation();

        if (result !== undefined && !result.ok) {
          throw new Error(result.message ?? labels.orderSaveFailed);
        }

        setNotice({ tone: "success", message: labels.orderSaved });
      } catch (error: unknown) {
        setOptimisticOrder(previous.map((feature) => feature.id));
        setNotice({
          tone: "error",
          message:
            error instanceof Error && error.message
              ? error.message
              : labels.orderSaveFailed,
        });
      }
    });
  }

  function moveFeature(featureId: string, direction: "up" | "down"): void {
    if (pending) return;

    const currentIndex = orderedFeatures.findIndex(
      (feature) => feature.id === featureId,
    );
    const nextIndex = currentIndex + (direction === "up" ? -1 : 1);

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= orderedFeatures.length
    ) {
      return;
    }

    const next = [...orderedFeatures];
    const [feature] = next.splice(currentIndex, 1);
    if (!feature) return;
    next.splice(nextIndex, 0, feature);

    persistOrder(next, orderedFeatures, () => moveAction(featureId, direction));
  }

  function dropFeature(targetId: string): void {
    setDropTargetId(null);

    if (!draggingId || draggingId === targetId || pending) {
      setDraggingId(null);
      return;
    }

    const sourceIndex = orderedFeatures.findIndex(
      (feature) => feature.id === draggingId,
    );
    const targetIndex = orderedFeatures.findIndex(
      (feature) => feature.id === targetId,
    );

    if (sourceIndex < 0 || targetIndex < 0) {
      setDraggingId(null);
      return;
    }

    const next = [...orderedFeatures];
    const [feature] = next.splice(sourceIndex, 1);

    if (!feature) {
      setDraggingId(null);
      return;
    }

    next.splice(targetIndex, 0, feature);
    setDraggingId(null);
    persistOrder(next, orderedFeatures, () =>
      reorderAction(next.map((item) => item.id)),
    );
  }

  return (
    <section className="grid gap-3" aria-busy={pending}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h2 className="text-base font-semibold text-slate-900">
            {labels.features}
          </h2>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-600">
            {total}
          </span>
          {orderedFeatures.length > 1 ? (
            <span className="hidden text-xs text-slate-400 sm:inline">
              {labels.dragToReorder}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/services/features"
            className="inline-flex h-9 items-center rounded-md px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            {labels.manageDefinitions}
          </Link>
          <button
            type="button"
            onClick={() => setDialog({ mode: "add" })}
            aria-haspopup="dialog"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition-colors hover:bg-brand-hover"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="size-4"
            >
              <path d="M10 4v12M4 10h12" strokeLinecap="round" />
            </svg>
            {labels.addFeature}
          </button>
        </div>
      </header>

      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className={`text-xs ${
            notice.tone === "error" ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {notice.message}
        </p>
      ) : null}

      {orderedFeatures.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState
            title={labels.emptyFeaturesTitle}
            description={labels.emptyFeaturesDescription}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {orderedFeatures.map((feature, index) => (
            <article
              key={feature.id}
              draggable={!pending && orderedFeatures.length > 1}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", feature.id);
                setDraggingId(feature.id);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDropTargetId(null);
              }}
              onDragOver={(event) => {
                if (!draggingId || draggingId === feature.id) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropTargetId(feature.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                dropFeature(feature.id);
              }}
              className={`group flex items-start gap-3 border-b px-3 py-3.5 transition-colors last:border-b-0 sm:items-center sm:px-4 ${
                draggingId === feature.id
                  ? "border-brand/30 bg-brand-soft/60 opacity-70"
                  : dropTargetId === feature.id
                    ? "border-brand/40 bg-brand-soft/40"
                    : "border-slate-100 hover:bg-slate-50/70"
              }`}
            >
              <button
                type="button"
                title={labels.dragToReorder}
                aria-label={`${labels.dragToReorder}: ${feature.name}`}
                disabled={pending || orderedFeatures.length < 2}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveFeature(feature.id, "up");
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveFeature(feature.id, "down");
                  }
                }}
                className="mt-0.5 inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing disabled:cursor-default disabled:opacity-40 sm:mt-0"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4"
                >
                  <circle cx="7" cy="5" r="1.2" />
                  <circle cx="13" cy="5" r="1.2" />
                  <circle cx="7" cy="10" r="1.2" />
                  <circle cx="13" cy="10" r="1.2" />
                  <circle cx="7" cy="15" r="1.2" />
                  <circle cx="13" cy="15" r="1.2" />
                </svg>
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {feature.name}
                  </h3>
                  <span
                    dir="ltr"
                    className="truncate font-mono text-[11px] text-slate-400"
                  >
                    {feature.key}
                  </span>
                  <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-flex">
                    {labels.valueTypes[feature.valueType]}
                  </span>
                </div>

                {feature.description ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {feature.description}
                  </p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600">
                    {feature.parameterLabel ? `${feature.parameterLabel}:` : ""}
                    <span
                      dir={feature.valueType === "TEXT" ? undefined : "ltr"}
                      className="font-semibold text-slate-800"
                    >
                      {formattedValue(feature, locale, labels)}
                    </span>
                  </span>

                  <span
                    className={`inline-flex rounded border px-1.5 py-0.5 text-[11px] font-medium ${
                      feature.status === "ACTIVE"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {services.catalogStatusLabels[feature.status]}
                  </span>

                  <span className="inline-flex rounded border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-500">
                    {feature.customerVisible
                      ? labels.visibleToCustomer
                      : labels.platformOnly}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => moveFeature(feature.id, "up")}
                  title={labels.moveUp}
                  aria-label={`${labels.moveUp}: ${feature.name}`}
                  disabled={pending || index === 0}
                  className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="size-4"
                  >
                    <path
                      d="m5.5 12 4.5-4.5 4.5 4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => moveFeature(feature.id, "down")}
                  title={labels.moveDown}
                  aria-label={`${labels.moveDown}: ${feature.name}`}
                  disabled={pending || index + 1 === orderedFeatures.length}
                  className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="size-4"
                  >
                    <path
                      d="m5.5 8 4.5 4.5L14.5 8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDialog({ mode: "edit", featureId: feature.id })
                  }
                  aria-haspopup="dialog"
                  className="inline-flex h-8 items-center rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-brand/30 hover:bg-brand-soft hover:text-brand"
                >
                  {labels.editAction}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {dialog ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[1px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            ref={dialogReference}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-950/10"
          >
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id={dialogTitleId}
                  className="truncate text-base font-semibold text-slate-900"
                >
                  {dialog.mode === "add"
                    ? labels.addFeature
                    : labels.editFeature}
                </h2>
                {editingFeature ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {editingFeature.name}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={closeDialog}
                aria-label={labels.closeDialog}
                className="inline-flex size-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="size-4"
                >
                  <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              {dialog.mode === "add" ? (
                <ServiceFeatureAttachmentForm
                  key="new-feature"
                  action={attachAction}
                  labels={services}
                  features={labels}
                  content={content}
                  definitions={definitions}
                  cancelAction={closeDialog}
                  successAction={closeDialog}
                />
              ) : editingFeature ? (
                <ServiceFeatureAttachmentForm
                  key={editingFeature.id}
                  action={updateAction.bind(null, editingFeature.id)}
                  labels={services}
                  features={labels}
                  content={content}
                  initial={editingFeature}
                  cancelAction={closeDialog}
                  successAction={closeDialog}
                />
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
