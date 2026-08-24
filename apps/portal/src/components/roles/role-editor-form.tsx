"use client";

import {
  type PermissionDefinition,
  type Role,
  type RoleScope,
} from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import { useActionState, useMemo, useState } from "react";

import type { FormState } from "@/lib/forms";
import type { RoleAdministrationDictionary } from "@/lib/i18n/role-administration";

interface RoleEditorFormProps {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  mode: "create" | "edit";
  role?: Role;
  permissions: PermissionDefinition[];
  labels: RoleAdministrationDictionary;
}

export function RoleEditorForm({
  action,
  mode,
  role,
  permissions,
  labels,
}: RoleEditorFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });
  const [scope, setScope] = useState<RoleScope>(role?.scope ?? "COMPANY");
  const [query, setQuery] = useState("");

  const allowedPermissions = useMemo(
    () =>
      permissions.filter(
        (permission) => scope === "PLATFORM" || permission.allowedForCompany,
      ),
    [permissions, scope],
  );

  const matchingPermissionKeys = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();

    return new Set(
      allowedPermissions
        .filter((permission) => {
          if (!normalized) return true;

          return `${permission.key} ${permission.name} ${permission.description ?? ""}`
            .toLocaleLowerCase()
            .includes(normalized);
        })
        .map((permission) => permission.key),
    );
  }, [allowedPermissions, query]);

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, PermissionDefinition[]>();

    for (const permission of allowedPermissions) {
      const group = permission.key.split(".", 1)[0] ?? "other";
      const items = groups.get(group) ?? [];
      items.push(permission);
      groups.set(group, items);
    }

    return [...groups.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [allowedPermissions]);

  return (
    <form action={formAction} className="grid max-w-4xl gap-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <label
            htmlFor="role-key"
            className="text-sm font-medium text-content"
          >
            {labels.key}
          </label>
          <input
            id="role-key"
            name="key"
            type="text"
            dir="ltr"
            pattern="[a-z][a-z0-9_]{2,99}"
            minLength={3}
            maxLength={100}
            required={mode === "create"}
            readOnly={mode === "edit"}
            defaultValue={role?.key ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content read-only:bg-slate-50 read-only:text-muted"
          />
          <p className="text-xs leading-5 text-muted">{labels.keyHint}</p>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="role-name"
            className="text-sm font-medium text-content"
          >
            {labels.name}
          </label>
          <input
            id="role-name"
            name="name"
            type="text"
            minLength={2}
            maxLength={150}
            required
            defaultValue={role?.name ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content"
          />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <label
            htmlFor="role-description"
            className="text-sm font-medium text-content"
          >
            {labels.description}
          </label>
          <textarea
            id="role-description"
            name="description"
            maxLength={500}
            rows={3}
            defaultValue={role?.description ?? ""}
            className="rounded-md border border-line bg-white px-3 py-2 text-sm text-content"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="role-scope"
            className="text-sm font-medium text-content"
          >
            {labels.scope}
          </label>
          {mode === "create" ? (
            <select
              id="role-scope"
              name="scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as RoleScope)}
              className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content"
            >
              <option value="COMPANY">{labels.company}</option>
              <option value="PLATFORM">{labels.platform}</option>
            </select>
          ) : (
            <>
              <input type="hidden" name="scope" value={scope} />
              <div className="flex h-11 items-center rounded-md border border-line bg-slate-50 px-3 text-sm text-muted">
                {scope === "PLATFORM" ? labels.platform : labels.company}
              </div>
            </>
          )}
          {mode === "edit" ? (
            <p className="text-xs text-muted">{labels.immutableFields}</p>
          ) : null}
        </div>
      </div>

      <fieldset className="grid gap-4">
        <legend className="text-sm font-semibold text-content">
          {labels.permissions}
        </legend>

        <label className="max-w-md">
          <span className="sr-only">{labels.permissionSearch}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.permissionSearch}
            className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-content"
          />
        </label>

        {matchingPermissionKeys.size === 0 ? (
          <p className="rounded-md border border-dashed border-line p-5 text-sm text-muted">
            {labels.noPermissionMatches}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {permissionGroups.map(([group, groupPermissions]) => {
            const groupVisible = groupPermissions.some((permission) =>
              matchingPermissionKeys.has(permission.key),
            );

            return (
              <div
                key={group}
                className={`${groupVisible ? "block" : "hidden"} rounded-lg border border-line bg-slate-50 p-4`}
              >
                <h3 dir="ltr" className="text-sm font-semibold text-content">
                  {group}
                </h3>
                <div className="mt-3 grid gap-2">
                  {groupPermissions.map((permission) => {
                    const visible = matchingPermissionKeys.has(permission.key);

                    return (
                      <label
                        key={permission.key}
                        className={`${visible ? "flex" : "hidden"} cursor-pointer items-start gap-3 rounded-md border border-transparent bg-white px-3 py-3 hover:border-line`}
                      >
                        <input
                          type="checkbox"
                          name="permissionKeys"
                          value={permission.key}
                          defaultChecked={role?.permissions.includes(
                            permission.key,
                          )}
                          className="mt-0.5 size-4 shrink-0 rounded border-slate-300 accent-brand"
                        />
                        <span className="min-w-0">
                          <span
                            dir="ltr"
                            className="block break-all text-xs font-semibold text-content"
                          >
                            {permission.key}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted">
                            {permission.description ?? permission.name}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.message}
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
