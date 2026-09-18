"use client";

import { useEffect, useRef, useState } from "react";

export interface CategoryPickerOption {
  id: string;
  label: string;
  depth: number;
  parentPath: string[];
}

/**
 * Category chooser that actually looks like a tree.
 *
 * A native <select> cannot be styled per option, which is why the old version
 * padded labels with non-breaking spaces -- and why that padding then showed on
 * the closed control too. This renders its own listbox instead: the closed
 * button shows the full path, and the open panel shows real indentation with
 * guide lines.
 */
export function KnowledgeCategoryPicker({
  name,
  options,
  initialId,
  placeholder,
  required = false,
}: {
  name: string;
  options: CategoryPickerOption[];
  initialId?: string | null;
  placeholder: string;
  required?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(initialId ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selected = options.find((option) => option.id === selectedId);

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedId} />

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-line bg-surface-panel px-3 py-2 text-start text-sm text-content hover:border-brand"
      >
        <span className="min-w-0 truncate">
          {selected ? (
            <>
              {selected.parentPath.length > 0 ? (
                <span className="text-muted">
                  {selected.parentPath.join(" / ")} /{" "}
                </span>
              ) : null}
              {selected.label}
            </>
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-line bg-white py-1 shadow-lg"
        >
          {!required ? (
            <li>
              <button
                type="button"
                onClick={() => {
                  setSelectedId("");
                  setOpen(false);
                }}
                className="w-full px-3 py-1.5 text-start text-sm text-muted hover:bg-surface-subtle"
              >
                {placeholder}
              </button>
            </li>
          ) : null}

          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={option.id === selectedId}
                onClick={() => {
                  setSelectedId(option.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-1.5 py-1.5 pe-3 text-start text-sm hover:bg-surface-subtle ${
                  option.id === selectedId
                    ? "bg-brand-soft font-medium text-brand"
                    : option.depth === 0
                      ? "font-medium text-content"
                      : "text-content"
                }`}
                style={{
                  paddingInlineStart: `${0.75 + option.depth * 1.1}rem`,
                }}
              >
                {option.depth > 0 ? (
                  <span aria-hidden className="text-muted">
                    ↳
                  </span>
                ) : null}
                <span className="truncate">{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
