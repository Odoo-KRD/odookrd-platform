"use client";

import type { Role } from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import { useActionState } from "react";

import type { FormState } from "@/lib/forms";
import type { AdminDictionary } from "@/lib/i18n/admin";
import type { UsersDictionary } from "@/lib/i18n/users";

interface UserRolesFormProps {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  roles: Role[];
  assignedRoles: string[];
  labels: UsersDictionary;
  roleLabels: AdminDictionary["roles"];
  lockedRoleKeys?: readonly string[];
  lockedReason?: string | null;
}

function roleName(role: Role, labels: AdminDictionary["roles"]): string {
  if (role.key === "platform_admin") return labels.platformAdmin;
  if (role.key === "company_admin") return labels.companyAdmin;
  return role.key === "company_user" ? labels.companyUser : role.name;
}

export function UserRolesForm({
  action,
  roles,
  assignedRoles,
  labels,
  roleLabels,
  lockedRoleKeys = [],
  lockedReason = null,
}: UserRolesFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form action={formAction} className="grid max-w-xl gap-4">
      <div className="grid gap-2">
        {roles.map((role) => {
          const locked = lockedRoleKeys.includes(role.key);
          return (
            <label
              key={role.id}
              className={`flex items-center gap-3 rounded-md border px-3 py-3 text-sm ${
                locked
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
                  : "cursor-pointer border-slate-200 text-slate-700"
              }`}
            >
              <input
                type="checkbox"
                name="roleKeys"
                value={role.key}
                defaultChecked={assignedRoles.includes(role.key)}
                disabled={locked}
                className="size-4 accent-[#714b67]"
              />
              {locked && assignedRoles.includes(role.key) ? (
                <input type="hidden" name="roleKeys" value={role.key} />
              ) : null}
              <span>{roleName(role, roleLabels)}</span>
            </label>
          );
        })}
      </div>

      {lockedReason ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {lockedReason}
        </p>
      ) : null}

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <ActionButton type="submit" disabled={pending || roles.length === 0}>
          {pending ? labels.saving : labels.saveRoles}
        </ActionButton>
      </div>
    </form>
  );
}
