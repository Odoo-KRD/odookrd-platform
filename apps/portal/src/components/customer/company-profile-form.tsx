"use client";

import type { LocalizedText } from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import Link from "next/link";
import { useActionState } from "react";

import { LocalizedTextField } from "@/components/i18n/localized-text-fields";
import type { FormState } from "@/lib/forms";
import type {
  ContentEditorDictionary,
  CustomerWorkspaceDictionary,
} from "@/lib/i18n/types";

interface CustomerCompanyFormProps {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  labels: CustomerWorkspaceDictionary["company"];
  content: ContentEditorDictionary;
  initialName: string;
  initialTranslations: LocalizedText;
}

export function CustomerCompanyForm({
  action,
  labels,
  content,
  initialName,
  initialTranslations,
}: CustomerCompanyFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <LocalizedTextField
        field="name"
        label={labels.companyName}
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
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}
