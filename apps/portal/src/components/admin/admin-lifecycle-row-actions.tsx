"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";

import {
  AdminActionButton,
  AdminActionGroup,
  AdminActionLink,
  type AdminActionTone,
} from "@/components/admin/admin-action-controls";
import type { AdminActionIconName } from "@/components/admin/admin-action-icons";

import type { AdminLifecycleLabels } from "@/lib/i18n/admin-lifecycle";

type LifecycleOperation = "archive" | "restore" | "delete";

interface ActionResult {
  ok: boolean;
  message: string;
}

interface AdminLifecycleRowActionsProps {
  id: string;
  name: string;
  status:
    | "ACTIVE"
    | "SUSPENDED"
    | "ARCHIVED"
    | "INVITED"
    | "INACTIVE"
    | "DRAFT"
    | "PUBLISHED";
  editHref: string;
  extraActions?: readonly {
    key: string;
    label: string;
    href: string;
    tone?: AdminActionTone;
    icon?: AdminActionIconName;
  }[];
  labels: AdminLifecycleLabels;
  archiveAction: (id: string) => Promise<ActionResult>;
  restoreAction: (id: string) => Promise<ActionResult>;
  deleteAction: (id: string) => Promise<ActionResult>;
}

function dialogText(
  operation: LifecycleOperation,
  labels: AdminLifecycleLabels,
  name: string,
): { title: string; description: string } {
  const replaceName = (value: string) => value.replace("{name}", name);

  if (operation === "archive") {
    return {
      title: labels.archiveTitle,
      description: replaceName(labels.archiveDescription),
    };
  }

  if (operation === "restore") {
    return {
      title: labels.restoreTitle,
      description: replaceName(labels.restoreDescription),
    };
  }

  return {
    title: labels.deleteTitle,
    description: replaceName(labels.deleteDescription),
  };
}

export function AdminLifecycleRowActions({
  id,
  name,
  status,
  editHref,
  extraActions = [],
  labels,
  archiveAction,
  restoreAction,
  deleteAction,
}: AdminLifecycleRowActionsProps) {
  const router = useRouter();
  const [operation, setOperation] = useState<LifecycleOperation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const archived = status === "ARCHIVED" || status === "INACTIVE";
  const selectedText = operation ? dialogText(operation, labels, name) : null;

  function run(): void {
    if (!operation || pending) return;

    const action =
      operation === "archive"
        ? archiveAction
        : operation === "restore"
          ? restoreAction
          : deleteAction;

    setMessage(null);

    startTransition(async () => {
      try {
        const result = await action(id);

        if (!result.ok) {
          setMessage(result.message || labels.failed);
          return;
        }

        setOperation(null);
        router.refresh();
      } catch {
        setMessage(labels.failed);
      }
    });
  }

  const dialog =
    operation && selectedText && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/35 p-4"
            role="presentation"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
              if (event.target === event.currentTarget && !pending) {
                setOperation(null);
                setMessage(null);
              }
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`lifecycle-title-${id}`}
              className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-xl"
            >
              <h2
                id={`lifecycle-title-${id}`}
                className="text-base font-semibold text-content"
              >
                {selectedText.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {selectedText.description}
              </p>

              {message ? (
                <p
                  role="alert"
                  className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {message}
                </p>
              ) : null}

              <div className="mt-5 flex justify-end gap-2">
                <AdminActionButton
                  disabled={pending}
                  onClick={() => {
                    setOperation(null);
                    setMessage(null);
                  }}
                >
                  {labels.cancel}
                </AdminActionButton>
                <AdminActionButton
                  disabled={pending}
                  onClick={run}
                  tone={operation === "delete" ? "danger" : "primary"}
                >
                  {pending ? `${labels.confirm}…` : labels.confirm}
                </AdminActionButton>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <AdminActionGroup>
        <AdminActionLink href={editHref} icon="edit">
          {labels.edit}
        </AdminActionLink>

        {extraActions.map((action) => (
          <AdminActionLink
            key={action.key}
            href={action.href}
            tone={action.tone}
            icon={action.icon}
          >
            {action.label}
          </AdminActionLink>
        ))}

        {archived ? (
          <AdminActionButton
            tone="primary"
            icon="archive"
            onClick={() => {
              setMessage(null);
              setOperation("restore");
            }}
          >
            {labels.restore}
          </AdminActionButton>
        ) : (
          <AdminActionButton
            tone="warning"
            icon="archive"
            onClick={() => {
              setMessage(null);
              setOperation("archive");
            }}
          >
            {labels.archive}
          </AdminActionButton>
        )}

        <AdminActionButton
          tone="danger"
          icon="delete"
          onClick={() => {
            setMessage(null);
            setOperation("delete");
          }}
        >
          {labels.delete}
        </AdminActionButton>
      </AdminActionGroup>

      {dialog}
    </>
  );
}
