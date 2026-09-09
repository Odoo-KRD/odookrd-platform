"use client";

import { useActionState } from "react";

import { ImageUploader } from "@/components/files/image-uploader";
import type { FormState } from "@/lib/forms";
import type { CompanyProfileV2Dictionary } from "@/lib/i18n/companies/profile";

export function CompanyIdentityRequestForm({
  action,
  labels,
  disabled,
}: {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  labels: CompanyProfileV2Dictionary;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form action={formAction} className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-content">
          {labels.proposedName}
        </span>
        <input
          name="proposedName"
          maxLength={200}
          disabled={disabled || pending}
          className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:bg-surface-subtle"
        />
      </label>

      <ImageUploader
        name="logo"
        label={labels.proposedLogo}
        description={labels.requestIdentityDescription}
        selectLabel={labels.updateLogo}
        replaceLabel={labels.updateLogo}
        removeLabel={labels.removeLogo}
        invalidMessage="JPEG, PNG, or WebP up to 10 MB is required."
        disabled={disabled || pending}
      />

      {state.message ? (
        <p
          role="status"
          className="rounded-md bg-surface-subtle px-3 py-2.5 text-sm text-content"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || pending}
        className="inline-flex h-10 w-fit items-center rounded-md border border-brand bg-white px-4 text-sm font-semibold text-brand hover:bg-brand-soft disabled:opacity-50"
      >
        {pending ? labels.saving : labels.submitRequest}
      </button>
    </form>
  );
}
