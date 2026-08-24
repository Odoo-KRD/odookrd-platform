"use client";

import { ActionButton } from "@odookrd/ui";
import { useActionState } from "react";

import type { FormState } from "@/lib/forms";
import type { RoleAdministrationDictionary } from "@/lib/i18n/role-administration";

interface DeleteRoleFormProps {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  labels: RoleAdministrationDictionary;
}

export function DeleteRoleForm({ action, labels }: DeleteRoleFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(labels.deleteConfirm)) {
          event.preventDefault();
        }
      }}
      className="grid gap-3"
    >
      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <ActionButton type="submit" variant="danger" disabled={pending}>
          {pending ? labels.deleting : labels.delete}
        </ActionButton>
      </div>
    </form>
  );
}
