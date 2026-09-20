"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";

import { formatFileSize } from "@/lib/format";

const MAX_FILES = 5;
/** SVG is refused by the helpdesk API, so it is not offered here either. */
const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,.gif,.docx,.xlsx,.pptx,.zip,application/pdf,image/png,image/jpeg,image/webp,image/gif";

interface UploadedFile {
  key: string;
  id: string | null;
  name: string;
  size: number;
  error: string | null;
}

export interface TicketAttachmentsLabels {
  attachments: string;
  attachmentsHint: string;
  dropFiles: string;
  browseFiles: string;
  uploading: string;
  removeFile: string;
  uploadFailed: string;
  tooManyFiles: string;
}

function errorMessage(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message: unknown }).message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message) && typeof message[0] === "string") {
      return message[0];
    }
  }

  return fallback;
}

function FileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0 text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

/**
 * Drop zone plus file list. Each file uploads immediately through the portal's
 * /api/files/upload proxy as a company-scoped ATTACHMENT; only the resulting
 * ids are submitted, as hidden `attachmentIds` inputs, and the API re-checks
 * every id when the message is sent.
 */
export function TicketAttachmentsField({
  labels,
  disabled,
  compact = false,
  onBusyChange,
}: {
  labels: TicketAttachmentsLabels;
  disabled?: boolean;
  compact?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // A counter rather than crypto.randomUUID(), which only exists on HTTPS
  // and localhost; the portal may be served over plain HTTP on a dev server.
  const nextKey = useRef(0);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pending, setPending] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    onBusyChange?.(pending > 0);
  }, [pending, onBusyChange]);

  async function upload(file: File, key: string) {
    setPending((count) => count + 1);

    try {
      const payload = new FormData();
      payload.set("kind", "ATTACHMENT");
      payload.set("file", file, file.name || "attachment");

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: payload,
        credentials: "same-origin",
      });
      const body: unknown = await response.json().catch(() => null);
      const id =
        typeof body === "object" && body !== null && "id" in body
          ? String((body as { id: unknown }).id)
          : null;

      setFiles((current) =>
        current.map((entry) =>
          entry.key === key
            ? response.ok && id
              ? { ...entry, id, error: null }
              : { ...entry, error: errorMessage(body, labels.uploadFailed) }
            : entry,
        ),
      );
    } catch {
      setFiles((current) =>
        current.map((entry) =>
          entry.key === key ? { ...entry, error: labels.uploadFailed } : entry,
        ),
      );
    } finally {
      setPending((count) => count - 1);
    }
  }

  function add(list: FileList | File[] | null) {
    const incoming = list ? Array.from(list) : [];

    if (incoming.length === 0 || disabled) {
      return;
    }

    const kept = files.filter((entry) => !entry.error);
    const room = Math.max(MAX_FILES - kept.length, 0);
    const chosen = incoming.slice(0, room);
    setNotice(incoming.length > chosen.length ? labels.tooManyFiles : null);

    const added = chosen.map((file) => ({
      key: `upload-${(nextKey.current += 1)}`,
      id: null,
      name: file.name,
      size: file.size,
      error: null,
    }));

    setFiles([...kept, ...added]);
    added.forEach((entry, index) => {
      void upload(chosen[index], entry.key);
    });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function remove(key: string) {
    setFiles((current) => current.filter((entry) => entry.key !== key));
    setNotice(null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    add(event.dataTransfer.files);
  }

  const full = files.filter((entry) => !entry.error).length >= MAX_FILES;
  const inactive = Boolean(disabled) || full;

  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold text-content">
        {labels.attachments}
      </span>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!inactive) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-4 transition ${
          compact ? "py-3" : "flex-col justify-center py-6 text-center"
        } ${
          dragging
            ? "border-brand bg-brand-soft"
            : "border-line bg-surface-subtle"
        } ${inactive ? "opacity-60" : ""}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`shrink-0 text-muted ${compact ? "size-5" : "size-7"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        <p className="text-sm text-content">
          {labels.dropFiles}{" "}
          <label
            htmlFor={inputId}
            className={`font-semibold text-brand underline-offset-2 hover:underline ${
              inactive ? "pointer-events-none" : "cursor-pointer"
            }`}
          >
            {labels.browseFiles}
          </label>
        </p>
        <p id={hintId} className="text-sm text-muted">
          {labels.attachmentsHint}
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT}
          disabled={inactive}
          aria-describedby={hintId}
          onChange={(event) => add(event.currentTarget.files)}
          className="sr-only"
        />
      </div>

      {files.length > 0 ? (
        <ul className="grid gap-2">
          {files.map((entry) => (
            <li
              key={entry.key}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                entry.error
                  ? "border-red-200 bg-red-50"
                  : "border-line bg-white"
              }`}
            >
              <FileIcon />
              <span className="min-w-0 flex-1">
                <bdi className="block truncate font-medium text-content">
                  {entry.name}
                </bdi>
                <span
                  className={`text-sm ${entry.error ? "text-red-700" : "text-muted"}`}
                >
                  {entry.error ??
                    (entry.id ? (
                      <bdi dir="ltr">{formatFileSize(entry.size)}</bdi>
                    ) : (
                      labels.uploading
                    ))}
                </span>
              </span>
              {entry.id ? (
                <input type="hidden" name="attachmentIds" value={entry.id} />
              ) : null}
              <button
                type="button"
                onClick={() => remove(entry.key)}
                disabled={disabled || (!entry.id && !entry.error)}
                className="shrink-0 rounded-md px-2 py-1 text-sm font-semibold text-muted hover:bg-surface-subtle hover:text-content disabled:opacity-50"
              >
                {labels.removeFile}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {notice ? (
        <p role="status" className="text-sm text-red-700">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
