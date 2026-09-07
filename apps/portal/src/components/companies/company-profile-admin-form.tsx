"use client";

import {
  CompanyEditModalDialog,
  useCompanyEditAction,
} from "@/components/companies/company-edit-modal";
import type { CompanyProfile, CompanyStatus } from "@odookrd/types";
import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import type { FormState } from "@/lib/forms";
import type { CompanyProfileV2Dictionary } from "@/lib/i18n/company-profile-v2";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20ZM13.5 7.5l3 3" />
    </svg>
  );
}

export function CompanyIdentityEditModal({
  action,
  company,
  labels,
  content,
  statusLabels,
}: {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  company: CompanyProfile;
  labels: CompanyProfileV2Dictionary;
  content: ContentEditorDictionary;
  statusLabels: Record<CompanyStatus, string>;
}) {
  return (
    <CompanyEditModalDialog
      title={labels.editCompany}
      description={labels.platformManagedDescription}
      closeLabel={labels.close}
      triggerLabel={labels.edit}
      triggerClassName="inline-flex size-8 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:bg-surface-subtle hover:text-content"
      triggerContent={<PencilIcon />}
      widthClassName="max-w-2xl"
    >
      {(onSaved) => (
        <CompanyIdentityEditFormBody
          action={action}
          company={company}
          labels={labels}
          content={content}
          statusLabels={statusLabels}
          onSaved={onSaved}
        />
      )}
    </CompanyEditModalDialog>
  );
}

function CompanyIdentityEditFormBody({
  action,
  company,
  labels,
  content,
  statusLabels,
  onSaved,
}: {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  company: CompanyProfile;
  labels: CompanyProfileV2Dictionary;
  content: ContentEditorDictionary;
  statusLabels: Record<CompanyStatus, string>;
} & { onSaved: () => void }) {
  const [state, formAction, pending] = useCompanyEditAction(action, onSaved);
  return (
    <form action={formAction} className="grid gap-5 min-w-0 w-full">
      <LocalizedTextFields
        field="name"
        label={labels.identity}
        content={content}
        translations={company.nameTranslations}
        fallback={company.name}
        maxLength={200}
        required
      />

      <label className="grid gap-2 min-w-0">
        <span className="text-sm font-semibold text-content">
          {labels.slug}
        </span>
        <input
          name="slug"
          dir="ltr"
          required
          maxLength={160}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          defaultValue={company.slug ?? ""}
          className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
        />
      </label>

      <label className="grid gap-2 min-w-0">
        <span className="text-sm font-semibold text-content">
          {labels.status}
        </span>
        <select
          name="status"
          defaultValue={company.status}
          className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
        >
          {(["ACTIVE", "SUSPENDED", "ARCHIVED"] as const).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      {state.message && !state.success ? (
        <p
          role="status"
          className="rounded-md bg-surface-subtle px-3 py-2.5 text-sm text-content"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-line pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? labels.saving : labels.save}
        </button>
      </div>
    </form>
  );
}
