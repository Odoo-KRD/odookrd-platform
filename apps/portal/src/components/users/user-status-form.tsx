"use client";

import type { UserStatus } from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import { useActionState } from "react";

import type { FormState } from "@/lib/forms";
import type { UsersDictionary } from "@/lib/i18n/users";

interface UserStatusFormProps {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  status: UserStatus;
  labels: UsersDictionary;
}

export function UserStatusForm({ action, status, labels }: UserStatusFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form action={formAction} className="grid max-w-xl gap-4">
      <label htmlFor="user-status" className="text-sm font-medium text-slate-700">
        {labels.status}
      </label>
      <select
        id="user-status"
        name="status"
        defaultValue={status}
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67]"
      >
        <option value="ACTIVE">{labels.statusActive}</option>
        <option value="SUSPENDED">{labels.statusSuspended}</option>
      </select>

      {state.message ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
