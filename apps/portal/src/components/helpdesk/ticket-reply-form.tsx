"use client";

import { startTransition, useActionState, useState } from "react";

import type { HelpdeskFormState } from "@/lib/helpdesk-forms";
import type { HelpdeskDictionary } from "@/lib/i18n/helpdesk";

import { TicketAttachmentsField } from "./ticket-attachments-field";

type ReplyAction = (
  previousState: HelpdeskFormState,
  formData: FormData,
) => Promise<HelpdeskFormState>;

export function TicketReplyForm({
  action,
  labels,
  hint,
}: {
  action: ReplyAction;
  labels: HelpdeskDictionary;
  hint?: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  // Remounting after each successful reply clears the text and attachments;
  // after an error the fields keep what the customer wrote.
  return (
    <ReplyFields
      key={state.submittedAt ?? 0}
      formAction={formAction}
      pending={pending}
      message={state.success ? null : state.message}
      labels={labels}
      hint={hint}
    />
  );
}

function ReplyFields({
  formAction,
  pending,
  message,
  labels,
  hint,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  message: string | null;
  labels: HelpdeskDictionary;
  hint?: string | null;
}) {
  const [uploading, setUploading] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="overflow-hidden rounded-xl border border-line bg-surface-panel shadow-sm"
    >
      <div className="border-b border-line px-5 py-3">
        <h2 className="text-[15px] font-semibold text-content">
          {labels.reply}
        </h2>
      </div>

      <div className="grid gap-4 p-5">
        {hint ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            {hint}
          </p>
        ) : null}

        <label className="grid gap-2">
          <span className="sr-only">{labels.reply}</span>
          <textarea
            name="body"
            required
            rows={5}
            maxLength={10_000}
            placeholder={labels.replyPlaceholder}
            disabled={pending}
            className="min-h-32 w-full resize-y rounded-md border border-line bg-white px-3 py-2.5 text-[15px] leading-7 text-content outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:bg-surface-subtle"
          />
        </label>

        <TicketAttachmentsField
          labels={labels}
          disabled={pending}
          compact
          onBusyChange={setUploading}
        />

        {message ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {message}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end border-t border-line bg-surface-subtle px-5 py-3">
        <button
          type="submit"
          disabled={pending || uploading}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
        >
          {pending
            ? labels.sending
            : uploading
              ? labels.uploading
              : labels.sendReply}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4 rtl:-scale-x-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M3 10h13m0 0-5-5m5 5-5 5" />
          </svg>
        </button>
      </div>
    </form>
  );
}
