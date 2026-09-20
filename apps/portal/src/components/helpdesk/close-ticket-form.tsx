"use client";

import { useActionState } from "react";

import type { HelpdeskFormState } from "@/lib/helpdesk-forms";

export function CloseTicketForm({
  action,
  labels,
}: {
  action: (
    previousState: HelpdeskFormState,
    formData: FormData,
  ) => Promise<HelpdeskFormState>;
  labels: { closeTicket: string; closeConfirm: string; closing: string };
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(labels.closeConfirm)) {
          event.preventDefault();
        }
      }}
      className="grid gap-2"
    >
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 w-full items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-content transition hover:bg-surface-subtle disabled:opacity-50"
      >
        {pending ? labels.closing : labels.closeTicket}
      </button>
      {state.message && !state.success ? (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
