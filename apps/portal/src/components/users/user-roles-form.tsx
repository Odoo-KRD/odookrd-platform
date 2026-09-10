"use client";

import type { Role } from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import { useActionState, useMemo, useState } from "react";

import type { FormState } from "@/lib/forms";
import type { RoleCatalogDictionary } from "@/lib/i18n/types";
import type { RoleAdministrationDictionary } from "@/lib/i18n/users/roles";
import type { UsersDictionary } from "@/lib/i18n/users";

interface UserRolesFormProps {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  roles: Role[];
  assignedRoles: string[];
  labels: UsersDictionary;
  roleLabels: RoleCatalogDictionary;
  administrationLabels: RoleAdministrationDictionary;
  lockedRoleKeys?: readonly string[];
  lockedReason?: string | null;
}

function roleName(role: Role, labels: RoleCatalogDictionary): string {
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
  administrationLabels,
  lockedRoleKeys = [],
  lockedReason = null,
}: UserRolesFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const [query, setQuery] = useState("");

  const matchingRoleIds = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();

    return new Set(
      roles
        .filter((role) => {
          if (!normalized) return true;

          return `${roleName(role, roleLabels)} ${role.key} ${role.description ?? ""}`
            .toLocaleLowerCase()
            .includes(normalized);
        })
        .map((role) => role.id),
    );
  }, [query, roleLabels, roles]);

  return (
    <form action={formAction} className="grid max-w-2xl gap-4">
      <label>
        <span className="sr-only">{administrationLabels.roleSearch}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={administrationLabels.roleSearch}
          className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-content"
        />
      </label>

      <div className="grid gap-2">
        {matchingRoleIds.size === 0 ? (
          <p className="rounded-md border border-dashed border-line p-4 text-sm text-muted">
            {administrationLabels.noRoleMatches}
          </p>
        ) : null}

        {roles.map((role) => {
          const locked = lockedRoleKeys.includes(role.key);
          const visible = matchingRoleIds.has(role.id);

          return (
            <label
              key={role.id}
              className={`${visible ? "flex" : "hidden"} items-start gap-3 rounded-md border px-3 py-3 text-sm ${
                locked
                  ? "cursor-not-allowed border-line bg-slate-50 text-muted"
                  : "cursor-pointer border-line text-content hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                name="roleKeys"
                value={role.key}
                defaultChecked={assignedRoles.includes(role.key)}
                disabled={locked}
                className="mt-0.5 size-4 shrink-0 accent-brand"
              />
              {locked && assignedRoles.includes(role.key) ? (
                <input type="hidden" name="roleKeys" value={role.key} />
              ) : null}

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {roleName(role, roleLabels)}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${
                      role.isSystem
                        ? "border-line bg-slate-50 text-muted"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {role.isSystem
                      ? administrationLabels.system
                      : administrationLabels.custom}
                  </span>
                </span>

                <span
                  dir="ltr"
                  className="mt-1 block truncate text-xs text-muted"
                  title={role.key}
                >
                  {role.key}
                </span>

                {role.description ? (
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    {role.description}
                  </span>
                ) : null}
              </span>
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
