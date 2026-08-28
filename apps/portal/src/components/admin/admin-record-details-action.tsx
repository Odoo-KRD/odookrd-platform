"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";

import { AdminActionButton } from "@/components/admin/admin-action-controls";

export interface AdminRecordDetail {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}

interface AdminRecordDetailsActionProps {
  label: string;
  title: string;
  closeLabel: string;
  details: readonly AdminRecordDetail[];
}

export function AdminRecordDetailsAction({
  label,
  title,
  closeLabel,
  details,
}: AdminRecordDetailsActionProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const dialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/35 p-4"
            role="presentation"
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => {
              event.stopPropagation();
              if (event.target === event.currentTarget) setOpen(false);
            }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Escape") setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="w-full max-w-2xl overflow-hidden rounded-lg border border-line bg-white shadow-xl"
            >
              <header className="border-b border-line px-5 py-4">
                <h2
                  id={titleId}
                  className="text-base font-semibold text-content"
                >
                  {title}
                </h2>
              </header>

              <dl className="grid gap-0 sm:grid-cols-2">
                {details.map((detail, index) => (
                  <div
                    key={`${detail.label}-${index}`}
                    className="border-b border-line px-5 py-4 sm:[&:nth-last-child(-n+2)]:border-b-0"
                  >
                    <dt className="text-xs font-medium text-muted">
                      {detail.label}
                    </dt>
                    <dd
                      dir={detail.dir}
                      className="mt-1 break-words text-sm text-content"
                    >
                      {detail.value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>

              <footer className="flex justify-end border-t border-line bg-surface-subtle px-5 py-4">
                <AdminActionButton onClick={() => setOpen(false)}>
                  {closeLabel}
                </AdminActionButton>
              </footer>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <AdminActionButton icon="view" onClick={() => setOpen(true)}>
        {label}
      </AdminActionButton>
      {dialog}
    </>
  );
}
