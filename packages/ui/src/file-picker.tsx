"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

export type FilePickerVariant = "dropzone" | "compact" | "button";
export type FilePickerPreview = "none" | "image";

export interface FilePickerProps {
  files: readonly File[];
  onFilesChange: (files: File[]) => void;
  label: string;
  browseLabel: string;
  removeLabel: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  variant?: FilePickerVariant;
  preview?: FilePickerPreview;
  className?: string;
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let amount = value;
  let unit = 0;
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024;
    unit += 1;
  }
  const precision = unit === 0 || amount >= 100 ? 0 : amount >= 10 ? 1 : 2;
  return `${amount.toFixed(precision)} ${units[unit]}`;
}

function FileGlyph({ image }: { image: boolean }) {
  return image ? (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 fill-none stroke-current"
      strokeWidth="1.7"
    >
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m5.5 17 4.5-4.5 3 3 2-2 3.5 3.5" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 fill-none stroke-current"
      strokeWidth="1.7"
    >
      <path d="M7 3.5h6l4 4V20H7z" />
      <path d="M13 3.5V8h4" />
    </svg>
  );
}

export function FilePicker({
  files,
  onFilesChange,
  label,
  browseLabel,
  removeLabel,
  description,
  accept,
  multiple = false,
  disabled = false,
  variant = "dropzone",
  preview = "none",
  className = "",
}: FilePickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const firstFile = files[0] ?? null;

  const previewUrl = useMemo(() => {
    if (
      preview !== "image" ||
      !firstFile ||
      !firstFile.type.startsWith("image/")
    ) {
      return null;
    }
    return URL.createObjectURL(firstFile);
  }, [firstFile, preview]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function choose(next: FileList | File[]): void {
    if (disabled) return;
    const selected = Array.from(next);
    onFilesChange(multiple ? selected : selected.slice(0, 1));
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number): void {
    if (disabled) return;
    onFilesChange(files.filter((_, current) => current !== index));
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      className="sr-only"
      onChange={(event) => {
        if (event.currentTarget.files) choose(event.currentTarget.files);
      }}
    />
  );

  if (variant === "button") {
    return (
      <div className={`flex min-w-0 flex-wrap items-center gap-2 ${className}`}>
        {hiddenInput}
        <label
          htmlFor={inputId}
          className={`inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-content transition hover:bg-surface-subtle ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          <FileGlyph image={preview === "image"} />
          {browseLabel}
        </label>
        {firstFile ? (
          <div className="flex min-w-0 items-center gap-2">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                className="size-9 rounded-md border border-line object-cover"
              />
            ) : null}
            <span className="max-w-52 truncate text-xs text-muted">
              {firstFile.name}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(0)}
              className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
            >
              {removeLabel}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const selectedFiles =
    files.length > 0 ? (
      <div className="grid gap-2">
        {files.map((file, index) => {
          const isImage = file.type.startsWith("image/");
          return (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              className="flex min-w-0 items-center gap-3 rounded-lg border border-line bg-white px-3 py-3 text-start"
            >
              {index === 0 && previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="size-12 shrink-0 rounded-md border border-line object-cover"
                />
              ) : (
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <FileGlyph image={isImage} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-content">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {file.type || "File"} · {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(index)}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {removeLabel}
              </button>
            </div>
          );
        })}
        <label
          htmlFor={inputId}
          className={`w-fit rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-content hover:bg-surface-subtle ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          {browseLabel}
        </label>
      </div>
    ) : (
      <label
        htmlFor={inputId}
        className={`block ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-6 fill-none stroke-current"
            strokeWidth="1.8"
          >
            <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
            <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
        </span>
        <p className="mt-3 text-sm font-semibold text-content">{label}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-muted">
            {description}
          </p>
        ) : null}
        <span className="mt-3 inline-flex rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">
          {browseLabel}
        </span>
      </label>
    );

  return (
    <div
      onDragEnter={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled && event.dataTransfer.files.length > 0) {
          choose(event.dataTransfer.files);
        }
      }}
      className={`${variant === "compact" ? "p-3" : "p-6"} rounded-xl border border-dashed text-center transition ${
        dragging
          ? "border-brand bg-brand-soft/60"
          : "border-line bg-surface-subtle"
      } ${className}`}
    >
      {hiddenInput}
      {selectedFiles}
    </div>
  );
}
