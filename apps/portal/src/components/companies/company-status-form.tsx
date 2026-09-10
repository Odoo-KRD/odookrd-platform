"use client";

import type { CompanyStatus } from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import { useActionState } from "react";

import type { FormState } from "@/lib/forms";
import type { CompaniesDictionary } from "@/lib/i18n/types";

type CompanyStatusAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

interface CompanyStatusFormProps {
  action: CompanyStatusAction;
  labels: CompaniesDictionary;
  currentStatus: CompanyStatus;
}

export function CompanyStatusForm({
  action,
  labels,
  currentStatus,
}: CompanyStatusFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  function confirmArchive(event: React.FormEvent<HTMLFormElement>): void {
    const selected = new FormData(event.currentTarget).get("status");

    if (
      selected === "ARCHIVED" &&
      currentStatus !== "ARCHIVED" &&
      !window.confirm(labels.archiveConfirmation)
    ) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={confirmArchive}
      className="grid max-w-xl gap-4"
    >
      <label
        htmlFor="company-status"
        className="text-sm font-medium text-slate-700"
      >
        {labels.status}
      </label>

      <select
        id="company-status"
        name="status"
        defaultValue={currentStatus}
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
      >
        <option value="ACTIVE">{labels.statusActive}</option>
        <option value="SUSPENDED">{labels.statusSuspended}</option>
        <option value="ARCHIVED">{labels.statusArchived}</option>
      </select>

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <ActionButton type="submit" variant="secondary" disabled={pending}>
          {pending ? labels.saving : labels.applyStatus}
        </ActionButton>
      </div>
    </form>
  );
}
