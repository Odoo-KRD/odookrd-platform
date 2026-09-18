"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  AdminActionMenu,
  type AdminActionMenuItem,
} from "@/components/admin/admin-action-menu";
import {
  SortableTree,
  type SortableTreeItem,
} from "@/components/admin/sortable-tree";

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
  expand: string;
  collapse: string;
}

/**
 * Category management: a sortable tree, saved as soon as a row is dropped.
 *
 * Depth is shown by indentation alone -- no glyph before the name -- with the
 * slug underneath for orientation.
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
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const run = (action: () => Promise<ActionResult>) => {
    startTransition(async () => {
      const result = await action();

      setStatus(result.ok ? null : result.message);

      if (result.ok) router.refresh();
    });
  };

  const reorder = (parentId: string | null, orderedIds: string[]) => {
    // Rebuild the flat list from the new sibling order so parents keep their
    // descendants beneath them.
    const byParent = new Map<string | null, TreeCategory[]>();

    for (const row of rows) {
      byParent.set(row.parentId, [...(byParent.get(row.parentId) ?? []), row]);
    }

    const siblings = byParent.get(parentId) ?? [];
    byParent.set(
      parentId,
      orderedIds
        .map((id) => siblings.find((row) => row.id === id))
        .filter((row): row is TreeCategory => Boolean(row)),
    );

    const flatten = (id: string | null): TreeCategory[] =>
      (byParent.get(id) ?? []).flatMap((row) => [row, ...flatten(row.id)]);

    setRows(flatten(null));
    setStatus(labels.saving);

    run(async () => {
      const result = await reorderAction(orderedIds);

      if (result.ok) setStatus(labels.saved);

      return result;
    });
  };

  const items: SortableTreeItem[] = rows.map((category) => {
    const menu: AdminActionMenuItem[] = [
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
        icon: "delete",
        separatorBefore: true,
        onSelect: () => {
          if (window.confirm(labels.deleteConfirm)) {
            run(() => deleteAction(category.id));
          }
        },
      },
    ];

    return {
      id: category.id,
      parentId: category.parentId,
      depth: category.depth,
      content: (
        <span
          className={`block truncate ${
            category.depth === 0 ? "font-semibold text-content" : "text-content"
          }`}
        >
          {category.name}
          {category.status === "INACTIVE" ? (
            <span className="ms-2 rounded bg-surface-subtle px-1.5 py-0.5 text-[11px] font-normal text-muted">
              {labels.inactive}
            </span>
          ) : null}
        </span>
      ),
      trailing: (
        <>
          <span className="text-xs text-muted">
            {category.articles} {labels.articleCount}
          </span>
          <Link
            href={`/admin/knowledge/categories/${category.id}`}
            className="inline-flex h-8 items-center rounded-md border border-line bg-white px-2.5 text-xs font-medium text-content hover:bg-surface-subtle"
          >
            {labels.edit}
          </Link>
          <AdminActionMenu label={labels.more} items={menu} />
        </>
      ),
    };
  });

  return (
    <div className="grid gap-2">
      {status ? <p className="text-xs text-muted">{status}</p> : null}

      <SortableTree
        items={items}
        onReorder={reorder}
        disabled={pending}
        dragHint={labels.dragHint}
        collapse={{
          collapsed,
          onToggle: (id) =>
            setCollapsed((current) => {
              const next = new Set(current);

              if (next.has(id)) next.delete(id);
              else next.add(id);

              return next;
            }),
          expandLabel: labels.expand,
          collapseLabel: labels.collapse,
        }}
      />
    </div>
  );
}
