"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  AdminActionMenu,
  type AdminActionMenuItem,
} from "@/components/admin/admin-action-menu";

interface ActionResult {
  ok: boolean;
  message: string;
}

export interface TreeCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  depth: number;
  status: "ACTIVE" | "INACTIVE";
  articles: number;
  children: number;
}

export interface TreeLabels {
  edit: string;
  more: string;
  activate: string;
  deactivate: string;
  delete: string;
  deleteConfirm: string;
  articleCount: string;
  inactive: string;
  dragHint: string;
  saving: string;
  saved: string;
  newSubcategory: string;
}

/**
 * The category tree, ordered by dragging a row's handle.
 *
 * This replaces the data table: categories are a hierarchy of maybe a few dozen
 * rows that people arrange, not a dataset they page through -- so ordering is
 * done here rather than on a separate screen, and saved as soon as a row is
 * dropped.
 *
 * Dragging is confined to a row's own sibling group, because sortOrder only has
 * meaning among siblings. Changing a category's parent is the edit form's job.
 */
export function KnowledgeCategoryTree({
  categories,
  labels,
  reorderAction,
  activateAction,
  deactivateAction,
  deleteAction,
}: {
  categories: TreeCategory[];
  labels: TreeLabels;
  reorderAction: (orderedIds: string[]) => Promise<ActionResult>;
  activateAction: (id: string) => Promise<ActionResult>;
  deactivateAction: (id: string) => Promise<ActionResult>;
  deleteAction: (id: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(categories);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  const run = (action: () => Promise<ActionResult>) => {
    startTransition(async () => {
      const result = await action();

      setStatus(result.ok ? null : result.message);

      if (result.ok) router.refresh();
    });
  };

  const drop = (targetId: string) => {
    const sourceId = dragging;

    setDragging(null);
    setOver(null);

    if (!sourceId || sourceId === targetId) return;

    const source = rows.find((row) => row.id === sourceId);
    const target = rows.find((row) => row.id === targetId);

    // Same parent only: a drop anywhere else is ignored rather than guessed at.
    if (!source || !target || source.parentId !== target.parentId) return;

    const siblings = rows.filter((row) => row.parentId === source.parentId);
    const from = siblings.findIndex((row) => row.id === sourceId);
    const to = siblings.findIndex((row) => row.id === targetId);

    const reordered = [...siblings];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    // Rebuild the flat list so the tree keeps parents above their children.
    const byParent = new Map<string | null, TreeCategory[]>();
    for (const row of rows) {
      const key = row.parentId;
      byParent.set(key, [...(byParent.get(key) ?? []), row]);
    }
    byParent.set(source.parentId, reordered);

    const flatten = (parentId: string | null): TreeCategory[] =>
      (byParent.get(parentId) ?? []).flatMap((row) => [
        row,
        ...flatten(row.id),
      ]);

    setRows(flatten(null));
    setStatus(labels.saving);
    run(async () => {
      const result = await reorderAction(reordered.map((row) => row.id));

      if (result.ok) setStatus(labels.saved);

      return result;
    });
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{labels.dragHint}</p>
        {status ? <p className="text-xs text-muted">{status}</p> : null}
      </div>

      <ul className="overflow-hidden rounded-md border border-line bg-surface-panel">
        {rows.map((category) => {
          const items: AdminActionMenuItem[] = [
            {
              key: "add-child",
              label: labels.newSubcategory,
              href: `/admin/knowledge/categories/new?parentId=${category.id}`,
            },
            category.status === "ACTIVE"
              ? {
                  key: "deactivate",
                  label: labels.deactivate,
                  tone: "warning",
                  onSelect: () => run(() => deactivateAction(category.id)),
                }
              : {
                  key: "activate",
                  label: labels.activate,
                  onSelect: () => run(() => activateAction(category.id)),
                },
            {
              key: "delete",
              label: labels.delete,
              tone: "danger",
              separatorBefore: true,
              onSelect: () => {
                if (window.confirm(labels.deleteConfirm)) {
                  run(() => deleteAction(category.id));
                }
              },
            },
          ];

          return (
            <li
              key={category.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", category.id);
                event.dataTransfer.effectAllowed = "move";
                setDragging(category.id);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOver(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setOver(category.id);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(event) => {
                event.preventDefault();
                drop(category.id);
              }}
              className={`flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0 ${
                dragging === category.id ? "opacity-40" : ""
              } ${over === category.id ? "bg-brand-soft" : "hover:bg-surface-subtle"}`}
            >
              <span
                aria-hidden
                title={labels.dragHint}
                className="cursor-grab select-none text-base leading-none text-muted active:cursor-grabbing"
              >
                ⠿
              </span>

              <span
                className="flex min-w-0 flex-1 items-center gap-2"
                style={{ paddingInlineStart: `${category.depth * 1.5}rem` }}
              >
                {category.depth > 0 ? (
                  <span aria-hidden className="text-muted">
                    ↳
                  </span>
                ) : null}
                <span className="min-w-0">
                  <span
                    className={`block truncate ${
                      category.depth === 0
                        ? "font-semibold text-content"
                        : "text-content"
                    }`}
                  >
                    {category.name}
                    {category.status === "INACTIVE" ? (
                      <span className="ms-2 rounded bg-surface-subtle px-1.5 py-0.5 text-[11px] font-normal text-muted">
                        {labels.inactive}
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-muted" dir="ltr">
                    /{category.slug}
                  </span>
                </span>
              </span>

              <span className="shrink-0 text-xs text-muted">
                {category.articles} {labels.articleCount}
              </span>

              <span className="flex shrink-0 items-center gap-1.5">
                <Link
                  href={`/admin/knowledge/categories/${category.id}`}
                  className="inline-flex h-8 items-center rounded-md border border-line bg-white px-2.5 text-xs font-medium text-content hover:bg-surface-subtle"
                >
                  {labels.edit}
                </Link>
                <AdminActionMenu label={labels.more} items={items} />
              </span>
            </li>
          );
        })}
      </ul>

      {pending ? <span className="sr-only">{labels.saving}</span> : null}
    </div>
  );
}
