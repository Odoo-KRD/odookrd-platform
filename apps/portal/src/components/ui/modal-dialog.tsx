"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

interface ModalDialogProps {
  title: string;
  description?: string;
  closeLabel: string;
  triggerLabel: string;
  children: ReactNode;
  triggerClassName?: string;
  triggerContent?: ReactNode;
  widthClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ModalDialog({
  title,
  description,
  closeLabel,
  triggerLabel,
  children,
  triggerClassName = "",
  triggerContent,
  widthClassName = "max-w-2xl",
  open,
  onOpenChange,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = open !== undefined;
  const visible = open ?? internalOpen;

  function changeOpen(next: boolean): void {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (visible && !dialog.open) dialog.showModal();
    if (!visible && dialog.open) dialog.close();
  }, [visible]);

  return (
    <>
      {!controlled ? (
        <button
          type="button"
          aria-label={triggerLabel}
          title={triggerLabel}
          onClick={() => changeOpen(true)}
          className={triggerClassName}
        >
          {triggerContent ?? triggerLabel}
        </button>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onCancel={(event) => {
          event.preventDefault();
          changeOpen(false);
        }}
        onClose={() => changeOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          ) {
            changeOpen(false);
          }
        }}
        className={`fixed inset-0 m-auto box-border w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-white p-0 text-content shadow-2xl backdrop:bg-slate-950/45 open:flex ${widthClassName}`}
      >
        <header className="flex min-w-0 shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-content">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 break-words text-sm leading-6 text-muted"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={() => changeOpen(false)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface-subtle hover:text-content"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-5 sm:p-6">
          <div className="min-w-0 w-full [&_fieldset]:min-w-0 [&_input]:min-w-0 [&_input]:max-w-full [&_label]:min-w-0 [&_select]:min-w-0 [&_select]:max-w-full [&_textarea]:min-w-0 [&_textarea]:max-w-full">
            {visible ? children : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
