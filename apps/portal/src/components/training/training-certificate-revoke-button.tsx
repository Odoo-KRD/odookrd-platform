"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { TrainingCertificateDictionary } from "@/lib/i18n/training/certificates";

export function TrainingCertificateRevokeButton({
  certificateId,
  labels,
}: {
  certificateId: string;
  labels: TrainingCertificateDictionary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/training/certificates/admin/${encodeURIComponent(certificateId)}/revoke`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        },
      );

      const body = (await response.json()) as {
        message?: string | string[];
      };
      if (!response.ok) {
        throw new Error(
          Array.isArray(body.message)
            ? body.message[0]
            : body.message || "Certificate revocation failed.",
        );
      }

      setOpen(false);
      router.refresh();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Certificate revocation failed.",
      );
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center rounded-md border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50"
      >
        {labels.revoke}
      </button>
    );
  }

  return (
    <div className="grid min-w-64 gap-2 rounded-md border border-red-200 bg-red-50 p-3">
      <label className="grid gap-1 text-xs font-semibold text-red-900">
        {labels.revokeReason}
        <textarea
          value={reason}
          onChange={(event) => setReason(event.currentTarget.value)}
          minLength={3}
          maxLength={1000}
          rows={3}
          className="rounded-md border border-red-200 bg-white p-2 text-xs font-normal text-content outline-none"
        />
      </label>

      {error ? <p className="text-xs text-red-700">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || reason.trim().length < 3}
          onClick={() => void revoke()}
          className="inline-flex h-8 items-center rounded-md bg-red-700 px-2.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? labels.revoking : labels.revokeConfirm}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => setOpen(false)}
          className="inline-flex h-8 items-center rounded-md border border-line bg-white px-2.5 text-xs font-medium text-content"
        >
          {labels.cancel}
        </button>
      </div>
    </div>
  );
}
