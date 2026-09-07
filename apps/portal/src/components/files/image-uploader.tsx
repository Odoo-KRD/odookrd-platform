"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_MAX_BYTES = 10_485_760;
const DEFAULT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ImageUploaderProps {
  name?: string;
  label: string;
  description?: string;
  hint?: string;
  currentImageUrl?: string | null;
  currentAlt?: string;
  emptyLabel?: string;
  selectLabel: string;
  replaceLabel: string;
  removeLabel: string;
  invalidMessage: string;
  disabled?: boolean;
  shape?: "circle" | "rounded";
  maxBytes?: number;
  acceptedMimeTypes?: readonly string[];
  allowCurrentRemove?: boolean;
  onFileChange?: (file: File | null) => void;
  onRemoveChange?: (remove: boolean) => void;
}

export function ImageUploader({
  name,
  label,
  description,
  hint,
  currentImageUrl = null,
  currentAlt = "",
  emptyLabel,
  selectLabel,
  replaceLabel,
  removeLabel,
  invalidMessage,
  disabled = false,
  shape = "rounded",
  maxBytes = DEFAULT_MAX_BYTES,
  acceptedMimeTypes = DEFAULT_MIME_TYPES,
  allowCurrentRemove = false,
  onFileChange,
  onRemoveChange,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectFile(file: File): void {
    if (
      file.size <= 0 ||
      file.size > maxBytes ||
      !acceptedMimeTypes.includes(file.type)
    ) {
      setError(invalidMessage);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPreviewUrl(URL.createObjectURL(file));
    setRemoved(false);
    setError(null);
    onRemoveChange?.(false);
    onFileChange?.(file);
  }

  function remove(): void {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const removingPersistedImage = !previewUrl && Boolean(currentImageUrl);

    setPreviewUrl(null);
    setRemoved(removingPersistedImage);
    setError(null);

    if (inputRef.current) inputRef.current.value = "";

    onFileChange?.(null);
    onRemoveChange?.(removingPersistedImage);
  }

  const imageUrl = previewUrl ?? (!removed ? currentImageUrl : null);
  const canRemove =
    Boolean(previewUrl) || (allowCurrentRemove && Boolean(currentImageUrl));

  return (
    <section className="grid gap-4 rounded-xl border border-line bg-surface-panel p-5 shadow-sm sm:p-6">
      <div>
        <h3 className="text-sm font-semibold text-content">{label}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
        {hint ? (
          <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className={`flex size-28 shrink-0 items-center justify-center overflow-hidden border border-line bg-white ${
            shape === "circle" ? "rounded-full" : "rounded-xl"
          }`}
        >
          {imageUrl ? (
            // Blob previews and authenticated same-origin endpoints are intentionally rendered as img.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={currentAlt}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-3 text-center text-xs leading-5 text-muted">
              {emptyLabel ?? label}
            </span>
          )}
        </div>

        <div className="grid min-w-0 gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {imageUrl ? replaceLabel : selectLabel}
            </button>

            {canRemove ? (
              <button
                type="button"
                disabled={disabled}
                onClick={remove}
                className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removeLabel}
              </button>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <input
          ref={inputRef}
          name={name}
          type="file"
          accept={acceptedMimeTypes.join(",")}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) selectFile(file);
          }}
        />
      </div>
    </section>
  );
}
