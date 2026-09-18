"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface ReorderCategory {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
}

interface ActionResult {
  ok: boolean;
  message: string;
}

/**
 * Drag-and-drop ordering, one sibling group at a time.
 *
 * sortOrder is only meaningful among siblings, so a category can be dragged
 * within its own parent but not into another one -- moving between parents is
 * what the edit form's parent field is for. Ordering is saved per group, which
 * matches the API's reorder endpoint taking a list of ids.
 */
export function KnowledgeCategoryReorder({
  categories,
  labels,
  saveAction,
}: {
  categories: ReorderCategory[];
  labels: {
    save: string;
    saving: string;
    saved: string;
    topLevel: string;
    hint: string;
  };
  saveAction: (orderedIds: string[]) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [groups, setGroups] = useState(() => groupByParent(categories));
  const [dragging, setDragging] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const move = (parentKey: string, fromId: string, toId: string) => {
    if (fromId === toId) return;

    setGroups((current) => {
      const group = current[parentKey];
      if (!group) return current;

      const from = group.findIndex((item) => item.id === fromId);
      const to = group.findIndex((item) => item.id === toId);
      if (from < 0 || to < 0) return current;

      const next = [...group];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      return { ...current, [parentKey]: next };
    });
    setSaved(false);
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      // One call per sibling group: index within the group becomes sortOrder.
      for (const group of Object.values(groups)) {
        const result = await saveAction(group.map((item) => item.id));

        if (!result.ok) {
          setError(result.message);
          return;
        }
      }

      setSaved(true);
      router.refresh();
    });
  };

  const names = new Map(categories.map((item) => [item.id, item.name]));

  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted">{labels.hint}</p>

      {Object.entries(groups).map(([parentKey, group]) => (
        <section key={parentKey} className="grid gap-1.5">
          <h3 className="text-xs font-semibold text-muted">
            {parentKey === "root"
              ? labels.topLevel
              : (names.get(parentKey) ?? "")}
          </h3>

          <ul className="grid gap-1">
            {group.map((item) => (
              <li
                key={item.id}
                draggable
                onDragStart={(event) => {
                  // Firefox refuses to start a drag unless data is set, and
                  // some browsers ignore the drop without an explicit effect.
                  event.dataTransfer.setData("text/plain", item.id);
                  event.dataTransfer.effectAllowed = "move";
                  setDragging(item.id);
                }}
                onDragEnd={() => setDragging(null)}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceId =
                    dragging ?? event.dataTransfer.getData("text/plain");

                  if (sourceId) move(parentKey, sourceId, item.id);
                  setDragging(null);
                }}
                className={`flex cursor-grab items-center gap-2 rounded-md border border-line bg-surface-panel px-3 py-2 text-sm text-content ${
                  dragging === item.id ? "opacity-50" : ""
                }`}
              >
                <span aria-hidden className="text-muted">
                  ⠿
                </span>
                {item.name}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? labels.saving : labels.save}
        </button>
        {saved ? (
          <span className="text-sm text-emerald-700">{labels.saved}</span>
        ) : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>
    </div>
  );
}

function groupByParent(
  categories: ReorderCategory[],
): Record<string, ReorderCategory[]> {
  const groups: Record<string, ReorderCategory[]> = {};

  for (const category of categories) {
    const key = category.parentId ?? "root";

    groups[key] = groups[key] ?? [];
    groups[key].push(category);
  }

  return groups;
}
