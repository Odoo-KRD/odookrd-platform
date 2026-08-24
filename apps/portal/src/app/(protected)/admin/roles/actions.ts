"use server";

import {
  PERMISSIONS,
  type PermissionDefinition,
  type Role,
  type RoleScope,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { FormState } from "@/lib/forms";

function failure(error: unknown): FormState {
  if (error instanceof ApiRequestError) {
    return { message: error.message };
  }

  return { message: "The request could not be completed." };
}

function roleInput(formData: FormData): {
  key: string | null;
  name: string;
  description: string | null;
  scope: RoleScope;
  permissionKeys: string[];
} | null {
  const keyValue = formData.get("key");
  const nameValue = formData.get("name");
  const descriptionValue = formData.get("description");
  const scopeValue = formData.get("scope");
  const permissionValues = formData.getAll("permissionKeys");

  if (
    typeof nameValue !== "string" ||
    nameValue.trim().length < 2 ||
    nameValue.trim().length > 150 ||
    (descriptionValue !== null &&
      (typeof descriptionValue !== "string" ||
        descriptionValue.length > 500)) ||
    (scopeValue !== "PLATFORM" && scopeValue !== "COMPANY") ||
    permissionValues.length === 0 ||
    permissionValues.length > 20 ||
    permissionValues.some(
      (value) => typeof value !== "string" || value.length > 150,
    )
  ) {
    return null;
  }

  return {
    key: typeof keyValue === "string" && keyValue.length > 0 ? keyValue : null,
    name: nameValue.trim(),
    description:
      typeof descriptionValue === "string" && descriptionValue.trim().length > 0
        ? descriptionValue.trim()
        : null,
    scope: scopeValue,
    permissionKeys: [...new Set(permissionValues as string[])],
  };
}

export async function createRoleAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(PERMISSIONS.ROLES_MANAGE);

  if (session.user.accountScope !== "PLATFORM") {
    return { message: "Only platform administrators can create roles." };
  }

  const input = roleInput(formData);

  if (!input || !input.key || !/^[a-z][a-z0-9_]{2,99}$/.test(input.key)) {
    return {
      message: "Enter a valid role and choose at least one permission.",
    };
  }

  let role: Role;

  try {
    role = await apiRequest<Role>("/roles", {
      method: "POST",
      token,
      body: JSON.stringify({
        key: input.key,
        name: input.name,
        description: input.description,
        scope: input.scope,
        permissionKeys: input.permissionKeys,
      }),
    });
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/admin/roles");
  redirect(`/admin/roles/${role.id}`);
}

export async function updateRoleAction(
  roleId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(PERMISSIONS.ROLES_MANAGE);

  if (session.user.accountScope !== "PLATFORM") {
    return { message: "Only platform administrators can edit roles." };
  }

  const input = roleInput(formData);

  if (!input) {
    return {
      message: "Enter a valid role and choose at least one permission.",
    };
  }

  try {
    await apiRequest<Role>(`/roles/${encodeURIComponent(roleId)}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({
        name: input.name,
        description: input.description,
        permissionKeys: input.permissionKeys,
      }),
    });
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${roleId}`);
  redirect(`/admin/roles/${roleId}`);
}

export async function deleteRoleAction(
  roleId: string,
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(PERMISSIONS.ROLES_MANAGE);

  if (session.user.accountScope !== "PLATFORM") {
    return { message: "Only platform administrators can delete roles." };
  }

  try {
    await apiRequest<{ success: true }>(
      `/roles/${encodeURIComponent(roleId)}`,
      {
        method: "DELETE",
        token,
      },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}

export async function loadRolePermissions(): Promise<PermissionDefinition[]> {
  const { token } = await getAdminApiContext(PERMISSIONS.ROLES_MANAGE);
  return apiRequest<PermissionDefinition[]>("/roles/permissions", { token });
}
