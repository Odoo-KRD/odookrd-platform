"use client";

import type { ManagedUser } from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import { useActionState } from "react";

import type { FormState } from "@/lib/forms";
import type { UserProfileEditDictionary } from "@/lib/i18n/users/profile-edit";

interface UserProfileFormProps {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  user: ManagedUser;
  labels: UserProfileEditDictionary;
}

const inputClass =
  "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10";

/** Lets an administrator edit another account's details. */
export function UserProfileForm({ action, user, labels }: UserProfileFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  const error =
    state.message === "invalid_email"
      ? labels.invalidEmail
      : state.message === "invalid_whatsapp"
        ? labels.invalidWhatsapp
        : state.message;

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-content">
            {labels.email}
          </span>
          <input
            name="email"
            type="email"
            required
            maxLength={320}
            dir="ltr"
            defaultValue={user.email}
            className={inputClass}
          />
          {user.status === "INVITED" ? (
            <span className="text-xs leading-5 text-muted">
              {labels.invitedEmailHint}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-content">
            {labels.displayName}
          </span>
          <input
            name="displayName"
            maxLength={160}
            defaultValue={user.displayName ?? ""}
            placeholder={labels.displayNamePlaceholder}
            className={inputClass}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-content">
            {labels.whatsapp}
          </span>
          <input
            name="whatsappNumber"
            dir="ltr"
            inputMode="tel"
            maxLength={16}
            pattern="\+[1-9][0-9]{7,14}"
            defaultValue={user.whatsappNumber ?? ""}
            placeholder={labels.whatsappPlaceholder}
            className={inputClass}
          />
          <span className="text-xs text-muted">{labels.whatsappHint}</span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-content">
            {labels.certificateName}
          </span>
          <input
            name="certificateName"
            maxLength={250}
            defaultValue={user.certificateName ?? ""}
            placeholder={labels.certificateNamePlaceholder}
            className={inputClass}
          />
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : state.success ? (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          {labels.saved}
        </p>
      ) : null}

      <div>
        <ActionButton type="submit" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </ActionButton>
      </div>
    </form>
  );
}
