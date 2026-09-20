"use client";

import { startTransition, useActionState, useState } from "react";

import type { HelpdeskFormState } from "@/lib/helpdesk-forms";
import type { HelpdeskDictionary } from "@/lib/i18n/helpdesk";

import { TicketAttachmentsField } from "./ticket-attachments-field";
import {
  CharacterCount,
  DepartmentSelect,
  helpdeskFieldClass,
  KnowledgeSuggestions,
  PrioritySelect,
  RelatedServiceSelect,
  type TicketServiceOption,
} from "./ticket-form-fields";

const MAX_SUBJECT = 250;
const MAX_BODY = 10_000;

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
  services,
  labels,
}: {
  action: (
    previousState: HelpdeskFormState,
    formData: FormData,
  ) => Promise<HelpdeskFormState>;
  departments: Array<{ id: string; name: string }>;
  services: TicketServiceOption[];
  labels: HelpdeskDictionary;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

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
        <div className="grid gap-4 sm:grid-cols-2">
          <DepartmentSelect
            departments={departments}
            labels={labels}
            disabled={pending}
          />
          <PrioritySelect labels={labels} disabled={pending} />
          <div className="sm:col-span-2">
            <RelatedServiceSelect
              services={services}
              labels={labels}
              disabled={pending}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-5" disabled={pending}>
        <Step number={2} title={labels.stepDetails} />

        <label className="grid gap-2">
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-content">
              {labels.subject}
            </span>
            <CharacterCount
              value={subject.length}
              max={MAX_SUBJECT}
              labels={labels}
            />
          </span>
          <input
            name="subject"
            required
            maxLength={MAX_SUBJECT}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={labels.subjectPlaceholder}
            className={`h-11 ${helpdeskFieldClass}`}
          />
        </label>

        <KnowledgeSuggestions subject={subject} labels={labels} />

        <label className="grid gap-2">
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-content">
              {labels.message}
            </span>
            <CharacterCount
              value={body.length}
              max={MAX_BODY}
              labels={labels}
            />
          </span>
          <textarea
            name="body"
            required
            rows={8}
            maxLength={MAX_BODY}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={labels.messagePlaceholder}
            className={`min-h-40 resize-y py-2.5 leading-7 ${helpdeskFieldClass}`}
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
