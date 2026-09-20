"use client";

import type { TicketDepartmentOption } from "@odookrd/types";
import { startTransition, useActionState, useState } from "react";

import type { HelpdeskFormState } from "@/lib/helpdesk-forms";
import type { HelpdeskDictionary } from "@/lib/i18n/helpdesk";

import { TicketAttachmentsField } from "./ticket-attachments-field";

const fieldClass =
  "w-full rounded-md border border-line bg-white px-3 text-sm text-content outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:bg-surface-subtle";

function Step({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
        {number}
      </span>
      <h2 className="text-base font-semibold text-content">{title}</h2>
    </div>
  );
}

export function NewTicketForm({
  action,
  departments,
  labels,
}: {
  action: (
    previousState: HelpdeskFormState,
    formData: FormData,
  ) => Promise<HelpdeskFormState>;
  departments: TicketDepartmentOption[];
  labels: HelpdeskDictionary;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const [uploading, setUploading] = useState(false);

  return (
    <form
      // Submitted manually so React does not clear the fields when the API
      // rejects the ticket; on success the action redirects to the ticket.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="grid gap-8"
    >
      <fieldset className="grid gap-4" disabled={pending}>
        <Step number={1} title={labels.stepDepartment} />
        <div className="grid gap-3 sm:grid-cols-2">
          {departments.map((department, index) => (
            <label
              key={department.id}
              className="group relative flex cursor-pointer gap-3 rounded-lg border border-line bg-white p-4 transition hover:border-slate-300 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/20"
            >
              <input
                type="radio"
                name="departmentId"
                value={department.id}
                required
                defaultChecked={departments.length === 1 && index === 0}
                className="mt-0.5 size-4 shrink-0 accent-brand"
              />
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-content">
                  {department.name}
                </span>
                {department.description ? (
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    {department.description}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-5" disabled={pending}>
        <Step number={2} title={labels.stepDetails} />

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-content">
            {labels.subject}
          </span>
          <input
            name="subject"
            required
            maxLength={250}
            placeholder={labels.subjectPlaceholder}
            className={`h-11 ${fieldClass}`}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-content">
            {labels.message}
          </span>
          <textarea
            name="body"
            required
            rows={8}
            maxLength={10_000}
            placeholder={labels.messagePlaceholder}
            className={`min-h-40 resize-y py-2.5 leading-6 ${fieldClass}`}
          />
        </label>

        <TicketAttachmentsField
          labels={labels}
          disabled={pending}
          onBusyChange={setUploading}
        />
      </fieldset>

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="max-w-md text-sm leading-6 text-muted">
          {labels.visibilityNote}
        </p>
        <button
          type="submit"
          disabled={pending || uploading}
          className="inline-flex h-10 items-center rounded-md bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
        >
          {pending
            ? labels.submitting
            : uploading
              ? labels.uploading
              : labels.submitTicket}
        </button>
      </div>
    </form>
  );
}
