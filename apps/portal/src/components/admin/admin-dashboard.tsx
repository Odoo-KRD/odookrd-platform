"use client";

import type {
  DashboardSectionKey,
  DashboardUiPreferences,
} from "@odookrd/types";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminDashboardDictionary } from "@/lib/i18n/admin-dashboard";

export interface AdminDashboardSection {
  id: DashboardSectionKey;
  href: string;
  title: string;
  description: string;
  openLabel: string;
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

export function AdminDashboard({
  sections,
  initialPreferences,
  labels,
}: AdminDashboardProps) {
  const [customizing, setCustomizing] = useState(false);
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
  const [message, setMessage] = useState<string | null>(null);

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
        throw new Error("Preference update failed.");
      }

      setMessage(labels.saved);
      window.setTimeout(() => setMessage(null), 1800);
      return true;
    } catch {
      setMessage(labels.saveFailed);
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

  function move(id: DashboardSectionKey, delta: number): void {
    const currentIndex = preferences.order.indexOf(id);
    const nextIndex = currentIndex + delta;

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= preferences.order.length
    ) {
      return;
    }

    const nextOrder = [...preferences.order];
    const [item] = nextOrder.splice(currentIndex, 1);
    if (!item) return;
    nextOrder.splice(nextIndex, 0, item);

    void apply({ ...preferences, order: nextOrder });
  }

  function drop(targetId: DashboardSectionKey): void {
    if (!dragging || dragging === targetId) {
      setDragging(null);
      return;
    }

    const nextOrder = [...preferences.order];
    const sourceIndex = nextOrder.indexOf(dragging);
    const targetIndex = nextOrder.indexOf(targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
      setDragging(null);
      return;
    }

    const [item] = nextOrder.splice(sourceIndex, 1);
    if (!item) return;
    nextOrder.splice(targetIndex, 0, item);
    setDragging(null);

    void apply({ ...preferences, order: nextOrder });
  }

  function toggleCollapsed(id: DashboardSectionKey): void {
    const collapsed = preferences.collapsed.includes(id)
      ? preferences.collapsed.filter((value) => value !== id)
      : [...preferences.collapsed, id];

    void apply({ ...preferences, collapsed });
  }

  function hide(id: DashboardSectionKey): void {
    if (preferences.hidden.includes(id)) return;
    void apply({
      ...preferences,
      hidden: [...preferences.hidden, id],
    });
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
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {message ? (
          <span
            role="status"
            className={`text-xs ${
              message === labels.saveFailed
                ? "text-red-700"
                : "text-emerald-700"
            }`}
          >
            {message}
          </span>
        ) : null}

        {customizing ? (
          <button
            type="button"
            onClick={reset}
            className="h-9 rounded-md border border-line bg-white px-3 text-xs font-medium text-content hover:bg-slate-50"
          >
            {labels.reset}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setCustomizing((value) => !value)}
          className="h-9 rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand-hover"
        >
          {customizing ? labels.done : labels.customize}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleSections.map((section, index) => {
          const collapsed = preferences.collapsed.includes(section.id);

          return (
            <section
              key={section.id}
              draggable={customizing}
              onDragStart={() => setDragging(section.id)}
              onDragEnd={() => setDragging(null)}
              onDragOver={(event) => {
                if (customizing) event.preventDefault();
              }}
              onDrop={() => drop(section.id)}
              className={`rounded-lg border bg-white p-6 transition ${
                dragging === section.id
                  ? "border-brand opacity-60"
                  : "border-line"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-content">
                    {section.title}
                  </h2>
                  {customizing ? (
                    <p className="mt-1 text-[11px] text-muted">{labels.drag}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(section.id)}
                    title={collapsed ? labels.expand : labels.collapse}
                    aria-label={collapsed ? labels.expand : labels.collapse}
                    aria-expanded={!collapsed}
                    className="flex size-8 items-center justify-center rounded-md border border-line text-muted hover:bg-slate-50 hover:text-content"
                  >
                    {collapsed ? "+" : "−"}
                  </button>

                  {customizing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => move(section.id, -1)}
                        disabled={index === 0}
                        title={labels.moveUp}
                        aria-label={labels.moveUp}
                        className="flex size-8 items-center justify-center rounded-md border border-line text-muted hover:bg-slate-50 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(section.id, 1)}
                        disabled={index === visibleSections.length - 1}
                        title={labels.moveDown}
                        aria-label={labels.moveDown}
                        className="flex size-8 items-center justify-center rounded-md border border-line text-muted hover:bg-slate-50 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => hide(section.id)}
                        title={labels.hide}
                        aria-label={labels.hide}
                        className="flex size-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        ×
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {!collapsed ? (
                <>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-muted">
                    {section.description}
                  </p>
                  <Link
                    href={section.href}
                    className="mt-5 inline-flex text-sm font-medium text-brand hover:text-brand-hover"
                  >
                    {section.openLabel}
                  </Link>
                </>
              ) : null}
            </section>
          );
        })}
      </div>

      {customizing && hiddenSections.length > 0 ? (
        <section className="rounded-lg border border-dashed border-line bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-content">
            {labels.hiddenSections}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {hiddenSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => restore(section.id)}
                className="rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-content hover:bg-slate-50"
              >
                {labels.restore}: {section.title}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
