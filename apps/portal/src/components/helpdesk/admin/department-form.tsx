"use client";

import { useActionState } from "react";

import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import type { FormState } from "@/lib/forms";
import type { HelpdeskAdminDictionary } from "@/lib/i18n/helpdesk-admin";

export interface DepartmentInitial {
  slug: string;
  name: string;
  nameTranslations: Record<string, string>;
  description: string | null;
  descriptionTranslations: Record<string, string>;
  status: "ACTIVE" | "ARCHIVED";
  sortOrder: number;
}

const inputClassName =
  "w-full rounded-md border border-line bg-surface-panel px-3 py-2 text-sm text-content outline-none focus:border-brand";

/** Same structure and styling as the knowledge-base category form. */
export function DepartmentForm({
  action,
  labels,
  content,
  initial,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  labels: HelpdeskAdminDictionary;
  content: React.ComponentProps<typeof LocalizedTextFields>["content"];
  initial?: DepartmentInitial;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <LocalizedTextFields
        field="name"
        label={labels.departmentName}
        content={content}
        translations={initial?.nameTranslations}
        fallback={initial?.name}
        maxLength={200}
        required
      />

      <LocalizedTextFields
        field="description"
        label={labels.departmentDescription}
        content={content}
        translations={initial?.descriptionTranslations}
        fallback={initial?.description}
        maxLength={1000}
        multiline
      />

      <label className="grid gap-2 text-sm font-medium">
        {labels.slug}
        <input
          name="slug"
          dir="ltr"
          defaultValue={initial?.slug ?? ""}
          maxLength={160}
          className={inputClassName}
        />
        <span className="text-xs font-normal text-muted">
          {labels.slugHint}
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid content-start gap-2 text-sm font-medium">
          {labels.status}
          <select
            name="status"
            defaultValue={initial?.status ?? "ACTIVE"}
            className={inputClassName}
          >
            <option value="ACTIVE">{labels.active}</option>
            <option value="ARCHIVED">{labels.archived}</option>
          </select>
          <span className="text-xs font-normal text-muted">
            {labels.archiveHint}
          </span>
        </label>

        <label className="grid content-start gap-2 text-sm font-medium">
          {labels.sortOrder}
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={initial?.sortOrder ?? 0}
            className={inputClassName}
          />
          <span className="text-xs font-normal text-muted">
            {labels.sortOrderHint}
          </span>
        </label>
      </div>

      {state.message ? (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? labels.saving : labels.save}
        </button>
        <a href={cancelHref} className="text-sm text-muted hover:text-content">
          {labels.cancel}
        </a>
      </div>
    </form>
  );
}
