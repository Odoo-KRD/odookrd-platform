"use client";

import { ActionButton } from "@odookrd/ui";
import Link from "next/link";
import { useActionState } from "react";

import type { FormState } from "@/lib/forms";
import type { AdminDictionary } from "@/lib/i18n/admin";

type CompanyFormAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

interface CompanyFormProps {
  action: CompanyFormAction;
  labels: AdminDictionary["companies"];
  initialName?: string;
  cancelHref: string;
}

export function CompanyForm({
  action,
  labels,
  initialName = "",
  cancelHref,
}: CompanyFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form action={formAction} className="grid max-w-xl gap-5">
      <div className="grid gap-2">
        <label htmlFor="company-name" className="text-sm font-medium text-slate-700">
          {labels.name}
        </label>
        <input
          id="company-name"
          name="name"
          type="text"
          defaultValue={initialName}
          maxLength={200}
          required
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
        />
      </div>

      {state.message ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
