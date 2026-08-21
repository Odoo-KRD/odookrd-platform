"use client";

import type { LocalizedText } from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import Link from "next/link";
import { useActionState } from "react";

import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import type { FormState } from "@/lib/forms";
import type { AdminDictionary } from "@/lib/i18n/admin";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

type CompanyFormAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

interface CompanyFormProps {
  action: CompanyFormAction;
  labels: AdminDictionary["companies"];
  content: ContentEditorDictionary;
  initialName?: string;
  initialTranslations?: LocalizedText;
  cancelHref: string;
}

export function CompanyForm({
  action,
  labels,
  content,
  initialName = "",
  initialTranslations,
  cancelHref,
}: CompanyFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <LocalizedTextFields
        field="name"
        label={labels.name}
        content={content}
        translations={initialTranslations}
        fallback={initialName}
        maxLength={200}
        required
      />

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <ActionButton type="submit" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </ActionButton>

        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}
