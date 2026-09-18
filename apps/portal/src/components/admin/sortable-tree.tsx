"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";

export interface SortableTreeItem {
  id: string;
  parentId: string | null;
  depth: number;
  /** Row content; the component supplies the handle, indent and spacing. */
  content: ReactNode;
  trailing?: ReactNode;
}

/** Ids whose children are hidden, and a toggle, when rows are collapsible. */
export interface SortableTreeCollapse {
  collapsed: ReadonlySet<string>;
  onToggle: (id: string) => void;
  expandLabel: string;
  collapseLabel: string;
}

/**
 * A tree whose siblings can be reordered by dragging.
 *
 * Two behaviours matter and are easy to get wrong:
 *
 *   - Dropping INSERTS at a position rather than swapping two rows. The drop
 *     point is the gap above or below the row under the pointer, decided by
 *     which half of the row it is over, and shown as a line in that gap.
 *   - Dragging a parent carries its descendants. The subtree is lifted out of
 *     the list and reinserted whole, so a section keeps its pages.
 *
 * Reordering is confined to one sibling group: sortOrder only means anything
 * among siblings, and a drop on another parent's row is ignored rather than
 * guessed at. Moving between parents belongs in an edit form.
 */
export function SortableTree({
  items,
  onReorder,
  disabled = false,
  dragHint,
  emptyHint,
  collapse,
}: {
  items: SortableTreeItem[];
  /** Called with the parent whose children changed and their new order. */
  onReorder: (parentId: string | null, orderedIds: string[]) => void;
  disabled?: boolean;
  dragHint?: string;
  emptyHint?: ReactNode;
  collapse?: SortableTreeCollapse;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [drop, setDrop] = useState<{
    id: string;
    position: "before" | "after";
  } | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const descendantsOf = useMemo(() => {
    const map = new Map<string, Set<string>>();

    const collect = (id: string): Set<string> => {
      const cached = map.get(id);
      if (cached) return cached;

      const direct = items.filter((item) => item.parentId === id);
      const all = new Set<string>();

      for (const child of direct) {
        all.add(child.id);
        for (const nested of collect(child.id)) all.add(nested);
      }

      map.set(id, all);
      return all;
    };

    for (const item of items) collect(item.id);

    return map;
  }, [items]);

  /** Walks up from `id` until it finds the row sharing `parentId`. */
  const anchorFor = (id: string, parentId: string | null) => {
    let current = items.find((item) => item.id === id) ?? null;

    for (let guard = 0; current && guard < 10; guard += 1) {
      if (current.parentId === parentId) return current;

      const next: string | null = current.parentId;
      current = next ? (items.find((item) => item.id === next) ?? null) : null;
    }

    return null;
  };

  const finishDrag = () => {
    setDragging(null);
    setDrop(null);
  };

  const handleDrop = () => {
    const sourceId = dragging;
    const target = drop;

    finishDrag();

    if (!sourceId || !target || sourceId === target.id) return;

    const source = items.find((item) => item.id === sourceId);
    const destination = items.find((item) => item.id === target.id);

    if (!source || !destination) return;
    if (source.parentId !== destination.parentId) return;

    const siblings = items.filter((item) => item.parentId === source.parentId);
    const without = siblings.filter((item) => item.id !== sourceId);
    const anchor = without.findIndex((item) => item.id === target.id);

    if (anchor < 0) return;

    const insertAt = target.position === "before" ? anchor : anchor + 1;
    const next = [...without];
    next.splice(insertAt, 0, source);

    const orderedIds = next.map((item) => item.id);
    const unchanged = siblings.every(
      (item, index) => item.id === orderedIds[index],
    );

    if (unchanged) return;

    onReorder(source.parentId, orderedIds);
  };

  const hidden = dragging
    ? (descendantsOf.get(dragging) ?? new Set<string>())
    : new Set<string>();

  const collapsedAway = useMemo(() => {
    const out = new Set<string>();

    if (!collapse) return out;

    for (const id of collapse.collapsed) {
      for (const descendant of descendantsOf.get(id) ?? []) out.add(descendant);
    }

    return out;
  }, [collapse, descendantsOf]);

  const visible = items.filter((item) => !collapsedAway.has(item.id));

  return (
    <div className="grid gap-2">
      {dragHint ? <p className="text-xs text-muted">{dragHint}</p> : null}

      <ul
        ref={listRef}
        onDragEnd={finishDrag}
        className="grid gap-1"
      >
        {visible.map((item) => {
          const isDragging = dragging === item.id;
          const inDraggedSubtree = hidden.has(item.id);
          const showBefore =
            drop?.id === item.id && drop.position === "before";
          const showAfter = drop?.id === item.id && drop.position === "after";
          const hasChildren = items.some((entry) => entry.parentId === item.id);
          const isCollapsed = collapse?.collapsed.has(item.id) ?? false;

          return (
            <li
              key={item.id}
              draggable={!disabled}
              onDragStart={(event) => {
                // Firefox will not begin a drag without data on the transfer.
                event.dataTransfer.setData("text/plain", item.id);
                event.dataTransfer.effectAllowed = "move";
                setDragging(item.id);
              }}
              onDragOver={(event) => {
                if (!dragging) return;

                const source = items.find((entry) => entry.id === dragging);
                if (!source) return;
                // Never drop a branch inside itself.
                if (descendantsOf.get(dragging)?.has(item.id)) return;

                // Hovering a subcategory of a sibling section targets that
                // section: dragging a top-level branch over any part of another
                // branch should land beside it, not do nothing.
                const anchor = anchorFor(item.id, source.parentId);
                if (!anchor || anchor.id === dragging) return;

                event.preventDefault();
                event.dataTransfer.dropEffect = "move";

                const rect = event.currentTarget.getBoundingClientRect();
                const position =
                  event.clientY < rect.top + rect.height / 2
                    ? "before"
                    : "after";

                setDrop((current) =>
                  current?.id === anchor.id && current.position === position
                    ? current
                    : { id: anchor.id, position },
                );
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop();
              }}
              style={{
                // The card itself steps in, so a subcategory reads as nested
                // rather than as a full-width row with a hole punched in it.
                marginInlineStart: `${item.depth * 2}rem`,
              }}
              className={`rounded-md border border-line bg-surface-panel ${
                isDragging || inDraggedSubtree ? "opacity-40" : ""
              }`}
            >
              {/* The insertion gap: a real space, so rows part to show where
                  the item will land rather than merely highlighting a row. */}
              <span
                aria-hidden
                className={`block rounded-full bg-brand transition-all ${
                  showBefore ? "mb-1 h-1.5" : "h-0"
                }`}
              />

              <div
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 ${
                  isDragging ? "" : "hover:bg-surface-subtle"
                }`}
              >
                <span
                  aria-hidden
                  title={dragHint}
                  className={`select-none text-base leading-none text-muted ${
                    disabled ? "" : "cursor-grab active:cursor-grabbing"
                  }`}
                >
                  ⠿
                </span>

                {collapse ? (
                  hasChildren ? (
                    <button
                      type="button"
                      onClick={() => collapse.onToggle(item.id)}
                      aria-expanded={!isCollapsed}
                      aria-label={
                        isCollapsed ? collapse.expandLabel : collapse.collapseLabel
                      }
                      className="flex size-5 shrink-0 items-center justify-center text-muted hover:text-content"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className={`size-3.5 transition-transform ${
                          isCollapsed ? "rtl:-scale-x-100" : "rotate-90"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.4}
                        aria-hidden
                      >
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </button>
                  ) : null
                ) : null}

                <span className="min-w-0 flex-1">{item.content}</span>

                {item.trailing ? (
                  <span className="flex shrink-0 items-center gap-1.5">
                    {item.trailing}
                  </span>
                ) : null}
              </div>

              <span
                aria-hidden
                className={`block rounded-full bg-brand transition-all ${
                  showAfter ? "mt-1 h-1.5" : "h-0"
                }`}
              />
            </li>
          );
        })}
      </ul>

      {items.length === 0 ? emptyHint : null}
    </div>
  );
}
