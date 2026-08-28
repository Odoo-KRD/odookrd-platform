"use client";

import { useEffect, useRef, useState } from "react";

import type { FileAsset } from "@odookrd/types";

import type { TrainingDictionary } from "@/lib/i18n/training";

const maximumImageBytes = 10_485_760;

export function CourseCoverField({
  labels,
  currentFileId,
  onBusyChange,
}: {
  labels: TrainingDictionary;
  currentFileId: string | null;
  onBusyChange: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [assetId, setAssetId] = useState<string | null>(currentFileId);
  const [changed, setChanged] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    };
  }, [selectedPreview]);

  async function upload(file: File): Promise<void> {
    setError(null);

    if (file.size <= 0 || file.size > maximumImageBytes) {
      setError(labels.coverUploadFailed);
      return;
    }

    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    const preview = URL.createObjectURL(file);
    setSelectedPreview(preview);
    setUploading(true);
    onBusyChange(true);

    try {
      const payload = new FormData();
      payload.set("kind", "IMAGE");
      payload.set("file", file, file.name || "course-cover");

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: payload,
        credentials: "same-origin",
      });

      const body = (await response.json()) as
        FileAsset | { message?: string | string[] };

      if (!response.ok || !("id" in body)) {
        const message =
          "message" in body
            ? Array.isArray(body.message)
              ? body.message[0]
              : body.message
            : null;
        throw new Error(message || labels.coverUploadFailed);
      }

      const verification = await fetch(
        `/api/files/${encodeURIComponent(body.id)}/content`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "image/*" },
        },
      );

      if (!verification.ok) {
        throw new Error(labels.coverUploadFailed);
      }

      const verifiedType = verification.headers.get("content-type") ?? "";
      if (!verifiedType.startsWith("image/")) {
        throw new Error(labels.coverUploadFailed);
      }

      await verification.body?.cancel();

      setAssetId(body.id);
      setChanged(true);
    } catch (uploadError: unknown) {
      setSelectedPreview(null);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : labels.coverUploadFailed,
      );
    } finally {
      setUploading(false);
      onBusyChange(false);
    }
  }

  function remove(): void {
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    setSelectedPreview(null);
    setAssetId(null);
    setChanged(true);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const previewSrc =
    selectedPreview ??
    (assetId ? `/api/files/${encodeURIComponent(assetId)}/content` : null);

  return (
    <section className="grid gap-3 rounded-lg border border-line bg-surface-subtle/40 p-4">
      <div>
        <h3 className="text-sm font-semibold text-content">
          {labels.coverImage}
        </h3>
        <p className="mt-1 text-xs leading-5 text-muted">{labels.coverHelp}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-32 w-full max-w-56 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
          {previewSrc ? (
            // Same-origin authenticated BFF URL is required for private FileAsset content.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={labels.coverImage}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-4 text-center text-xs text-muted">
              {labels.noCover}
            </span>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={`inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-medium text-white ${
                uploading
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-brand-hover"
              }`}
            >
              {uploading
                ? labels.uploadingCover
                : assetId
                  ? labels.replaceCover
                  : labels.uploadCover}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.svg"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
            </label>

            {assetId || selectedPreview ? (
              <button
                type="button"
                disabled={uploading}
                onClick={remove}
                className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-medium text-content hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.removeCover}
              </button>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <input type="hidden" name="coverImageAssetId" value={assetId ?? ""} />
      <input
        type="hidden"
        name="coverImageChanged"
        value={changed ? "true" : "false"}
      />
    </section>
  );
}
