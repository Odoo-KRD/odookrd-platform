"use client";

import type { Locale, LocalizedRichText } from "@odookrd/types";
import { useActionState, useState } from "react";

import { LocalizedRichTextEditor } from "@/components/i18n/localized-rich-text-editor";
import {
  KnowledgeCategoryPicker,
  type CategoryPickerOption,
} from "@/components/knowledge/knowledge-category-picker";
import { KnowledgeTagInput } from "@/components/knowledge/knowledge-tag-input";
import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import type { KnowledgeAdminDictionary } from "@/lib/i18n/knowledge-admin";
import type { FormState } from "@/lib/forms";

const locales: readonly Locale[] = ["ku", "ar", "en"];

const inputClassName =
  "w-full rounded-md border border-line bg-surface-panel px-3 py-2 text-sm text-content outline-none focus:border-brand";

export interface KnowledgeArticleInitial {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  slug: string;
  categoryId: string;
  title: string;
  titleTranslations: Record<string, string>;
  excerpt: string | null;
  excerptTranslations: Record<string, string>;
  bodyTranslations: LocalizedRichText;
  tagsTranslations: Record<string, string[]>;
  sortOrder: number;
}

export function KnowledgeArticleForm({
  action,
  labels,
  content,
  toolbar,
  categories,
  initial,
  cancelHref,
  statusActions,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  labels: KnowledgeAdminDictionary;
  content: React.ComponentProps<typeof LocalizedTextFields>["content"];
  toolbar: React.ComponentProps<typeof LocalizedRichTextEditor>["toolbar"];
  categories: CategoryPickerOption[];
  initial?: KnowledgeArticleInitial;
  cancelHref: string;
  /** Publish / unpublish / archive controls, rendered beside the status. */
  statusActions?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  // The editor is a controlled component, so the document lives in state and is
  // serialised into hidden inputs the server action reads.
  const [body, setBody] = useState<LocalizedRichText>(
    initial?.bodyTranslations ?? {},
  );

  return (
    <form action={formAction} className="grid gap-5">
      {locales.map((locale) => (
        <input
          key={locale}
          type="hidden"
          name={`body.${locale}`}
          value={body[locale] ? JSON.stringify(body[locale]) : ""}
        />
      ))}

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-5">
          <LocalizedTextFields
            field="title"
            label={labels.title}
            content={content}
            translations={initial?.titleTranslations}
            fallback={initial?.title}
            maxLength={250}
            required
          />

          <LocalizedTextFields
            field="excerpt"
            label={labels.excerpt}
            content={content}
            translations={initial?.excerptTranslations}
            fallback={initial?.excerpt}
            maxLength={500}
            multiline
          />

          <div className="grid gap-2">
            <span className="text-sm font-medium">{labels.body}</span>
            <LocalizedRichTextEditor
              value={body}
              onChange={setBody}
              content={content}
              toolbar={toolbar}
              disabled={pending}
            />
          </div>
        </div>

        <div className="grid content-start gap-5">
          {initial ? (
            <div className="grid gap-2 rounded-md border border-line bg-surface-subtle p-3">
              <span className="text-sm font-medium">{labels.status_}</span>
              <span className="text-sm text-content">
                {initial.status === "PUBLISHED"
                  ? labels.published
                  : initial.status === "ARCHIVED"
                    ? labels.archived
                    : labels.draft}
              </span>
              {statusActions}
            </div>
          ) : null}

          <div className="grid gap-2 text-sm font-medium">
            {labels.category}
            <KnowledgeCategoryPicker
              name="categoryId"
              options={categories}
              initialId={initial?.categoryId}
              placeholder={labels.selectCategory}
              required
            />
          </div>

          <label className="grid gap-2 text-sm font-medium">
            {labels.slug}
            <input
              name="slug"
              dir="ltr"
              defaultValue={initial?.slug ?? ""}
              maxLength={200}
              className={inputClassName}
            />
            <span className="text-xs font-normal text-muted">
              {labels.slugHint}
            </span>
          </label>

          <div className="grid gap-2">
            <span className="text-sm font-medium">{labels.tags}</span>
            {locales.map((locale) => (
              <KnowledgeTagInput
                key={locale}
                name={`tags.${locale}`}
                label={locale.toUpperCase()}
                initial={initial?.tagsTranslations?.[locale] ?? []}
                placeholder={labels.tagsHint}
              />
            ))}
          </div>

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
        <a href={cancelHref} className="text-sm text-muted hover:text-content">
          {labels.cancel}
        </a>
      </div>
    </form>
  );
}
