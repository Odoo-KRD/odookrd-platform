"use client";

import { useActionState } from "react";

import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import type { KnowledgeAdminDictionary } from "@/lib/i18n/knowledge-admin";
import type { FormState } from "@/lib/forms";

export interface KnowledgeCategoryOption {
  id: string;
  label: string;
  depth: number;
}

export interface KnowledgeCategoryInitial {
  id: string;
  slug: string;
  parentId: string | null;
  name: string;
  nameTranslations: Record<string, string>;
  description: string | null;
  descriptionTranslations: Record<string, string>;
  status: string;
  sortOrder: number;
}

const inputClassName =
  "w-full rounded-md border border-line bg-surface-panel px-3 py-2 text-sm text-content outline-none focus:border-brand";

export function KnowledgeCategoryForm({
  action,
  labels,
  content,
  parents,
  initial,
  initialParentId,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  labels: KnowledgeAdminDictionary;
  // The shared content-editor dictionary the localized field widgets expect.
  content: React.ComponentProps<typeof LocalizedTextFields>["content"];
  parents: KnowledgeCategoryOption[];
  initial?: KnowledgeCategoryInitial;
  /** Preselected parent when adding a subcategory from the tree. */
  initialParentId?: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <LocalizedTextFields
        field="name"
        label={labels.name}
        content={content}
        translations={initial?.nameTranslations}
        fallback={initial?.name}
        maxLength={200}
        required
      />

      <LocalizedTextFields
        field="description"
        label={labels.descriptionField}
        content={content}
        translations={initial?.descriptionTranslations}
        fallback={initial?.description}
        maxLength={1000}
        multiline
      />

      <label className="grid gap-2 text-sm font-medium">
        {labels.parent}
        <select
          name="parentId"
          defaultValue={initial?.parentId ?? initialParentId ?? ""}
          className={inputClassName}
        >
          <option value="">{labels.noParent}</option>
          {parents.map((option) => (
            <option key={option.id} value={option.id}>
              {"\u00A0".repeat(option.depth * 4)}
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-muted">
          {labels.depthLimit}
        </span>
      </label>

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
        <label className="grid gap-2 text-sm font-medium">
          {labels.status}
          <select
            name="status"
            defaultValue={initial?.status ?? "ACTIVE"}
            className={inputClassName}
          >
            <option value="ACTIVE">{labels.active}</option>
            <option value="INACTIVE">{labels.inactive}</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          {labels.sortOrder}
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={initial?.sortOrder ?? 0}
            className={inputClassName}
          />
        </label>
      </div>

      {state.message ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? labels.saving : labels.save}
        </button>
        <a
          href={cancelHref}
          className="text-sm text-muted hover:text-content"
        >
          {labels.cancel}
        </a>
      </div>
    </form>
  );
}
