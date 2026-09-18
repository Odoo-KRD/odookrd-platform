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

export interface KnowledgeRowActionLabels {
  edit: string;
  more: string;
  publish: string;
  unpublish: string;
  archive: string;
  activate: string;
  deactivate: string;
  delete: string;
  deleteConfirm: string;
}

/**
 * Edit stays inline; everything else lives behind the "..." menu, matching the
 * course rows. Four inline buttons per row made the table unreadable.
 */
export function KnowledgeRowActions({
  id,
  status,
  editHref,
  labels,
  publishAction,
  unpublishAction,
  archiveAction,
  activateAction,
  deactivateAction,
  deleteAction,
}: {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "ACTIVE" | "INACTIVE";
  editHref: string;
  labels: KnowledgeRowActionLabels;
  publishAction?: (id: string) => Promise<ActionResult>;
  unpublishAction?: (id: string) => Promise<ActionResult>;
  archiveAction?: (id: string) => Promise<ActionResult>;
  activateAction?: (id: string) => Promise<ActionResult>;
  deactivateAction?: (id: string) => Promise<ActionResult>;
  deleteAction: (id: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: (id: string) => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const result = await action(id);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  };

  const items: AdminActionMenuItem[] = [];

  if (publishAction && status !== "PUBLISHED") {
    items.push({
      key: "publish",
      label: labels.publish,
      onSelect: () => run(publishAction),
    });
  }

  if (unpublishAction && status === "PUBLISHED") {
    items.push({
      key: "unpublish",
      label: labels.unpublish,
      tone: "warning",
      onSelect: () => run(unpublishAction),
    });
  }

  if (activateAction && status === "INACTIVE") {
    items.push({
      key: "activate",
      label: labels.activate,
      onSelect: () => run(activateAction),
    });
  }

  if (deactivateAction && status === "ACTIVE") {
    items.push({
      key: "deactivate",
      label: labels.deactivate,
      tone: "warning",
      onSelect: () => run(deactivateAction),
    });
  }

  if (archiveAction && status !== "ARCHIVED" && status !== "ACTIVE") {
    items.push({
      key: "archive",
      label: labels.archive,
      tone: "warning",
      icon: "archive",
      onSelect: () => run(archiveAction),
    });
  }

  items.push({
    key: "delete",
    label: labels.delete,
    tone: "danger",
    icon: "delete",
    separatorBefore: true,
    onSelect: () => {
      if (window.confirm(labels.deleteConfirm)) run(deleteAction);
    },
  });

  return (
    <div className="flex items-center justify-end gap-1.5">
      {error ? <span className="text-xs text-red-600">{error}</span> : null}

      <Link
        href={editHref}
        className="inline-flex h-8 items-center rounded-md border border-line bg-white px-2.5 text-xs font-medium text-content hover:bg-surface-subtle"
      >
        {labels.edit}
      </Link>

      <AdminActionMenu label={labels.more} items={items} />
    </div>
  );
}
