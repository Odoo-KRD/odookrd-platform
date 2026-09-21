"use client";

import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
  type TicketUserRef,
} from "@odookrd/types";
import { startTransition, useActionState } from "react";

import type { HelpdeskFormState } from "@/lib/helpdesk-forms";
import type { HelpdeskDictionary } from "@/lib/i18n/helpdesk";
import type { HelpdeskAdminDictionary } from "@/lib/i18n/helpdesk-admin";

type ControlAction = (
  previousState: HelpdeskFormState,
  formData: FormData,
) => Promise<HelpdeskFormState>;

const selectClass =
  "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:bg-surface-subtle";

/**
 * Triage panel: status, priority and assignee in one small form. It submits
 * through a server action, so the page re-renders with the API's answer rather
 * than optimistic state that could disagree with it.
 */
export function TicketControls({
  action,
  status,
  priority,
  assigneeUserId,
  assignees,
  canAssign,
  labels,
  priorityLabels,
}: {
  action: ControlAction;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeUserId: string | null;
  assignees: TicketUserRef[];
  canAssign: boolean;
  labels: HelpdeskAdminDictionary;
  priorityLabels: HelpdeskDictionary["priorities"];
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="grid gap-3"
    >
      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium text-muted">
          {labels.status}
        </span>
        <select
          name="status"
          defaultValue={status}
          disabled={pending}
          className={selectClass}
        >
          {TICKET_STATUSES.map((value) => (
            <option key={value} value={value}>
              {labels.statuses[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium text-muted">
          {labels.priority}
        </span>
        <select
          name="priority"
          defaultValue={priority}
          disabled={pending}
          className={selectClass}
        >
          {TICKET_PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {priorityLabels[value]}
            </option>
          ))}
        </select>
      </label>

      {canAssign ? (
        <label className="grid gap-1.5">
          <span className="text-[13px] font-medium text-muted">
            {labels.assignee}
          </span>
          <select
            name="assigneeUserId"
            defaultValue={assigneeUserId ?? ""}
            disabled={pending}
            className={selectClass}
          >
            <option value="">{labels.unassigned}</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.displayName ?? assignee.email ?? assignee.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
      >
        {pending ? labels.saving : labels.save}
      </button>

      {state.message ? (
        <p
          role="alert"
          className={`text-sm ${state.success ? "text-emerald-700" : "text-red-700"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
