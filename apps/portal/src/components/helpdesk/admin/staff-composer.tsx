"use client";

import { TICKET_STATUSES } from "@odookrd/types";
import { startTransition, useActionState, useState } from "react";

import { TicketAttachmentsField } from "@/components/helpdesk/ticket-attachments-field";
import type { HelpdeskFormState } from "@/lib/helpdesk-forms";
import type { HelpdeskDictionary } from "@/lib/i18n/helpdesk";
import type { HelpdeskAdminDictionary } from "@/lib/i18n/helpdesk-admin";

type MessageAction = (
  previousState: HelpdeskFormState,
  formData: FormData,
) => Promise<HelpdeskFormState>;

/**
 * One composer with two tabs. The tab decides `isInternal`, which the API
 * requires explicitly, and the chosen mode is impossible to miss: the internal
 * tab turns the whole box amber and states that the customer cannot see it.
 * Attachments are hidden on the note tab, because the API refuses them there.
 */
export function StaffComposer({
  action,
  labels,
  fileLabels,
}: {
  action: MessageAction;
  labels: HelpdeskAdminDictionary;
  fileLabels: HelpdeskDictionary;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <ComposerBody
      key={state.submittedAt ?? 0}
      formAction={formAction}
      pending={pending}
      message={state.success ? null : state.message}
      labels={labels}
      fileLabels={fileLabels}
    />
  );
}

function ComposerBody({
  formAction,
  pending,
  message,
  labels,
  fileLabels,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  message: string | null;
  labels: HelpdeskAdminDictionary;
  fileLabels: HelpdeskDictionary;
}) {
  const [internal, setInternal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const tabClass = (active: boolean, note: boolean) =>
    `inline-flex h-10 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition ${
      active
        ? note
          ? "border-amber-500 text-amber-700"
          : "border-brand text-brand"
        : "border-transparent text-muted hover:text-content"
    }`;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className={`overflow-hidden rounded-xl border shadow-sm transition ${
        internal
          ? "border-amber-300 bg-amber-50/60"
          : "border-line bg-surface-panel"
      }`}
    >
      <input
        type="hidden"
        name="isInternal"
        value={internal ? "true" : "false"}
      />

      <div
        role="tablist"
        aria-label={labels.reply}
        className={`flex gap-1 border-b px-2 ${internal ? "border-amber-200" : "border-line"}`}
      >
        <button
          type="button"
          role="tab"
          aria-selected={!internal}
          onClick={() => setInternal(false)}
          className={tabClass(!internal, false)}
        >
          {labels.replyTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={internal}
          onClick={() => setInternal(true)}
          className={tabClass(internal, true)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M10 3.5 2.5 16.5h15L10 3.5Zm0 5v3.5m0 2.2v.3" />
          </svg>
          {labels.noteTab}
        </button>
      </div>

      <div className="grid gap-4 p-5">
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            internal
              ? "border-amber-300 bg-amber-100/70 font-medium text-amber-900"
              : "border-line bg-surface-subtle text-muted"
          }`}
        >
          {internal ? labels.noteWarning : labels.replyWarning}
        </p>

        <textarea
          name="body"
          required
          rows={6}
          maxLength={10_000}
          disabled={pending}
          placeholder={
            internal ? labels.notePlaceholder : labels.replyPlaceholder
          }
          className={`min-h-36 w-full resize-y rounded-md border bg-white px-3 py-2.5 text-[15px] leading-7 text-content outline-none transition placeholder:text-slate-400 disabled:bg-surface-subtle ${
            internal
              ? "border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              : "border-line focus:border-brand focus:ring-2 focus:ring-brand/10"
          }`}
        />

        {internal ? (
          <p className="text-xs text-amber-800">{labels.noteNoAttachments}</p>
        ) : (
          <>
            <TicketAttachmentsField
              labels={fileLabels}
              disabled={pending}
              compact
              onBusyChange={setUploading}
            />
            <label className="grid w-full max-w-xs gap-2">
              <span className="text-sm font-semibold text-content">
                {labels.statusAfterReply}
              </span>
              <select
                name="status"
                defaultValue=""
                disabled={pending}
                className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
              >
                <option value="">{labels.keepStatus}</option>
                {TICKET_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {labels.statuses[status]}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {message ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {message}
          </p>
        ) : null}
      </div>

      <div
        className={`flex justify-end border-t px-5 py-3 ${
          internal ? "border-amber-200" : "border-line bg-surface-subtle"
        }`}
      >
        <button
          type="submit"
          disabled={pending || uploading}
          className={`inline-flex h-10 items-center rounded-md px-5 text-sm font-semibold text-white transition disabled:opacity-50 ${
            internal
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-brand hover:bg-brand-hover"
          }`}
        >
          {pending ? labels.sending : internal ? labels.sendNote : labels.send}
        </button>
      </div>
    </form>
  );
}
