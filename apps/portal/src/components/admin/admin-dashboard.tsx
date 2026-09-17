"use client";

import type {
  DashboardSectionKey,
  DashboardUiPreferences,
} from "@odookrd/types";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import type { AdminDashboardDictionary } from "@/lib/i18n/admin/dashboard";

export type AdminDashboardMetricTone = "neutral" | "positive" | "attention";

export interface AdminDashboardMetric {
  label: string;
  value: string;
  tone?: AdminDashboardMetricTone;
}

export interface AdminDashboardLink {
  href: string;
  label: string;
}

export interface AdminDashboardSection {
  id: DashboardSectionKey;
  href: string;
  title: string;
  description: string;
  openLabel: string;
  metrics?: AdminDashboardMetric[];
  links?: AdminDashboardLink[];
}

interface AdminDashboardProps {
  sections: AdminDashboardSection[];
  initialPreferences: DashboardUiPreferences;
  labels: AdminDashboardDictionary;
}

function normalizeOrder(
  sections: readonly AdminDashboardSection[],
  requested: readonly DashboardSectionKey[],
): DashboardSectionKey[] {
  const available = new Set(sections.map((section) => section.id));
  const ordered = requested.filter((id) => available.has(id));

  for (const section of sections) {
    if (!ordered.includes(section.id)) {
      ordered.push(section.id);
    }
  }

  return ordered;
}

const METRIC_TONE: Record<AdminDashboardMetricTone, string> = {
  neutral: "text-content",
  positive: "text-content",
  attention: "text-amber-600",
};

function GripIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="currentColor"
    >
      <circle cx="9" cy="5" r="1.4" />
      <circle cx="15" cy="5" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="19" r="1.4" />
      <circle cx="15" cy="19" r="1.4" />
    </svg>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`size-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 rtl:-scale-x-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function AdminDashboard({
  sections,
  initialPreferences,
  labels,
}: AdminDashboardProps) {
  const [preferences, setPreferences] = useState<DashboardUiPreferences>(
    () => ({
      order: normalizeOrder(sections, initialPreferences.order),
      hidden: initialPreferences.hidden.filter((id) =>
        sections.some((section) => section.id === id),
      ),
      collapsed: initialPreferences.collapsed.filter((id) =>
        sections.some((section) => section.id === id),
      ),
    }),
  );
  const [dragging, setDragging] = useState<DashboardSectionKey | null>(null);
  const [handleHeld, setHandleHeld] = useState<DashboardSectionKey | null>(
    null,
  );
  const [keyboardHeld, setKeyboardHeld] = useState<DashboardSectionKey | null>(
    null,
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  // The order a drag started from, so a cancelled drag rolls back cleanly.
  const dragOrigin = useRef<DashboardSectionKey[] | null>(null);

  const sectionMap = useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [sections],
  );

  const orderedSections = preferences.order
    .map((id) => sectionMap.get(id))
    .filter((section): section is AdminDashboardSection => Boolean(section));

  const visibleSections = orderedSections.filter(
    (section) => !preferences.hidden.includes(section.id),
  );
  const hiddenSections = orderedSections.filter((section) =>
    preferences.hidden.includes(section.id),
  );

  async function persist(next: DashboardUiPreferences): Promise<boolean> {
    try {
      const response = await fetch("/api/preferences/ui", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardPreferences: next }),
      });

      if (!response.ok) {
        // Surface what the server actually said; a bare "could not be saved"
        // hides whether the portal route or the API rejected the layout.
        const detail = await response
          .json()
          .then((body: unknown) =>
            typeof body === "object" && body !== null && "message" in body
              ? String((body as { message: unknown }).message)
              : "",
          )
          .catch(() => "");

        setFailure(
          detail
            ? `${labels.saveFailed} (${String(response.status)}: ${detail})`
            : `${labels.saveFailed} (${String(response.status)})`,
        );
        return false;
      }

      setFailure(null);
      setMessage(labels.saved);
      window.setTimeout(() => setMessage(null), 1800);
      return true;
    } catch {
      setFailure(labels.saveFailed);
      return false;
    }
  }

  async function apply(next: DashboardUiPreferences): Promise<void> {
    const previous = preferences;
    setPreferences(next);

    if (!(await persist(next))) {
      setPreferences(previous);
    }
  }

  function reorder(
    order: readonly DashboardSectionKey[],
    id: DashboardSectionKey,
    targetIndex: number,
  ): DashboardSectionKey[] {
    const next = [...order];
    const currentIndex = next.indexOf(id);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= next.length) {
      return next;
    }

    const [item] = next.splice(currentIndex, 1);
    if (!item) return next;
    next.splice(targetIndex, 0, item);
    return next;
  }

  /** Live preview while dragging: the card slides into the hovered slot. */
  function previewDropOn(targetId: DashboardSectionKey): void {
    if (!dragging || dragging === targetId) return;

    const targetIndex = preferences.order.indexOf(targetId);
    if (targetIndex < 0) return;

    setPreferences((current) => ({
      ...current,
      order: reorder(current.order, dragging, targetIndex),
    }));
  }

  function endDrag(): void {
    const origin = dragOrigin.current;
    dragOrigin.current = null;
    setDragging(null);
    setHandleHeld(null);

    if (!origin) return;
    if (origin.join("|") === preferences.order.join("|")) return;

    void persist(preferences);
  }

  /** Keyboard reordering: space picks a card up, arrows move it. */
  function moveByKeyboard(id: DashboardSectionKey, delta: number): void {
    const visibleIndex = visibleSections.findIndex(
      (section) => section.id === id,
    );
    const neighbour = visibleSections[visibleIndex + delta];
    if (!neighbour) return;

    const targetIndex = preferences.order.indexOf(neighbour.id);
    setPreferences((current) => ({
      ...current,
      order: reorder(current.order, id, targetIndex),
    }));
  }

  function toggleCollapsed(id: DashboardSectionKey): void {
    const collapsed = preferences.collapsed.includes(id)
      ? preferences.collapsed.filter((value) => value !== id)
      : [...preferences.collapsed, id];

    void apply({ ...preferences, collapsed });
  }

  function remove(id: DashboardSectionKey): void {
    if (preferences.hidden.includes(id)) return;
    void apply({ ...preferences, hidden: [...preferences.hidden, id] });
  }

  function restore(id: DashboardSectionKey): void {
    void apply({
      ...preferences,
      hidden: preferences.hidden.filter((value) => value !== id),
    });
  }

  function reset(): void {
    void apply({
      order: sections.map((section) => section.id),
      hidden: [],
      collapsed: [],
    });
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">{labels.dragHint}</p>

        <div className="flex flex-wrap items-center gap-2">
          {message ? (
            <span role="status" className="text-xs text-emerald-700">
              {message}
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setCustomizeOpen((value) => !value)}
            aria-expanded={customizeOpen}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-content hover:bg-surface-subtle"
          >
            {labels.customize}
            {hiddenSections.length > 0 ? (
              <span className="inline-flex min-w-5 justify-center rounded-full bg-brand-soft px-1.5 text-[11px] font-bold text-brand">
                {hiddenSections.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {failure ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {failure}
        </p>
      ) : null}

      {customizeOpen ? (
        <section className="rounded-xl border border-line bg-surface-panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-content">
                {labels.hiddenSections}
              </h2>
              <p className="mt-1 text-xs text-muted">{labels.customizeHint}</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="h-9 rounded-md border border-line bg-white px-3 text-xs font-medium text-content hover:bg-surface-subtle"
            >
              {labels.reset}
            </button>
          </div>

          {hiddenSections.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{labels.noHiddenSections}</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {hiddenSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => restore(section.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-content hover:bg-surface-subtle"
                >
                  <span className="text-brand">+</span>
                  {section.title}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* A masonry column flow: cards keep their natural height instead of
          stretching to the tallest card in the row. */}
      <div className="columns-1 gap-5 md:columns-2 xl:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
        {visibleSections.map((section) => {
          const collapsed = preferences.collapsed.includes(section.id);
          const isDragging = dragging === section.id;
          const isHeld = keyboardHeld === section.id;

          return (
            <section
              key={section.id}
              aria-label={section.title}
              draggable={handleHeld === section.id}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                // Firefox only starts a drag once data is set.
                event.dataTransfer.setData("text/plain", section.id);
                dragOrigin.current = [...preferences.order];
                setDragging(section.id);
              }}
              onDragEnter={() => previewDropOn(section.id)}
              onDragOver={(event) => {
                if (!dragging) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => {
                event.preventDefault();
                endDrag();
              }}
              onDragEnd={endDrag}
              className={`rounded-xl border bg-surface-panel transition ${
                isDragging
                  ? "border-brand opacity-60 shadow-lg ring-2 ring-brand/25"
                  : isHeld
                    ? "border-brand shadow-md ring-2 ring-brand/20"
                    : "border-line shadow-sm hover:shadow-md"
              }`}
            >
              <div
                className={`flex items-center gap-2 px-5 ${
                  collapsed ? "py-3.5" : "pt-5 pb-2"
                }`}
              >
                <button
                  type="button"
                  aria-label={labels.drag}
                  title={labels.drag}
                  aria-pressed={isHeld}
                  onPointerDown={() => setHandleHeld(section.id)}
                  onPointerUp={() => setHandleHeld(null)}
                  onKeyDown={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      if (isHeld) {
                        setKeyboardHeld(null);
                        void persist(preferences);
                      } else {
                        setKeyboardHeld(section.id);
                      }
                      return;
                    }

                    if (!isHeld) return;

                    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                      event.preventDefault();
                      moveByKeyboard(section.id, 1);
                    }
                    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                      event.preventDefault();
                      moveByKeyboard(section.id, -1);
                    }
                    if (event.key === "Escape") {
                      setKeyboardHeld(null);
                    }
                  }}
                  onBlur={() => setKeyboardHeld(null)}
                  className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 transition hover:bg-surface-subtle hover:text-muted active:cursor-grabbing"
                >
                  <GripIcon />
                </button>

                <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-content">
                  {section.title}
                </h2>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(section.id)}
                    title={collapsed ? labels.expand : labels.collapse}
                    aria-label={collapsed ? labels.expand : labels.collapse}
                    aria-expanded={!collapsed}
                    className="flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-surface-subtle hover:text-content"
                  >
                    <ChevronIcon collapsed={collapsed} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(section.id)}
                    title={labels.remove}
                    aria-label={labels.remove}
                    className="flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-red-50 hover:text-red-600"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              {!collapsed ? (
                <div className="px-5 pb-5">
                  <p className="text-sm leading-6 text-muted">
                    {section.description}
                  </p>

                  {section.metrics && section.metrics.length > 0 ? (
                    <dl className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4">
                      {section.metrics.map((metric) => (
                        <div key={metric.label} className="min-w-16">
                          <dd
                            className={`text-3xl font-semibold leading-none tabular-nums ${
                              METRIC_TONE[metric.tone ?? "neutral"]
                            }`}
                          >
                            {metric.value}
                          </dd>
                          <dt className="mt-1.5 text-xs text-muted">
                            {metric.label}
                          </dt>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {section.links && section.links.length > 0 ? (
                    <div className="mt-5 grid gap-1.5 border-t border-line pt-4">
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="truncate text-sm text-muted transition hover:text-brand"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  <Link
                    href={section.href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover"
                  >
                    {section.openLabel}
                    <ArrowIcon />
                  </Link>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
