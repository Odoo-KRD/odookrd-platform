"use server";

import {
  PERMISSIONS,
  type AccountScope,
  type BatchMutationResult,
  type ManagedUser,
  type UserInvitation,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { FormState, InvitationFormState } from "@/lib/forms";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function failure(error: unknown): FormState {
  if (error instanceof ApiRequestError) {
    return { message: error.message };
  }

  return { message: "The request could not be completed." };
}

function invitationFailure(message: string): InvitationFormState {
  return { message, invitation: null };
}

function selectedRoleKeys(formData: FormData): string[] | null {
  const values = formData.getAll("roleKeys");

  if (
    values.length === 0 ||
    values.length > 20 ||
    values.some((value) => typeof value !== "string" || value.length > 100)
  ) {
    return null;
  }

  const roles = values as string[];

  return [...new Set(roles)];
}

function selectedBatchIds(formData: FormData): string[] | null {
  const values = formData.getAll("selectedIds");

  if (
    values.length === 0 ||
    values.length > 100 ||
    values.some(
      (value) => typeof value !== "string" || !uuidPattern.test(value),
    )
  ) {
    return null;
  }

  const ids = [...new Set(values as string[])];
  return ids.length === values.length ? ids : null;
}

export async function inviteUserAction(
  _previousState: InvitationFormState,
  formData: FormData,
): Promise<InvitationFormState> {
  const { session, token } = await getAdminApiContext(PERMISSIONS.USERS_MANAGE);
  const selectedEmail = formData.get("email");
  const selectedScope = formData.get("accountScope");
  const selectedCompanyId = formData.get("companyId");
  const roleKeys = selectedRoleKeys(formData);

  if (
    typeof selectedEmail !== "string" ||
    selectedEmail.trim().length === 0 ||
    selectedEmail.length > 320
  ) {
    return invitationFailure("Enter a valid email address.");
  }

  if (selectedScope !== "PLATFORM" && selectedScope !== "COMPANY") {
    return invitationFailure("Choose a valid account type.");
  }

  if (!roleKeys) {
    return invitationFailure("Choose at least one valid role.");
  }

  const accountScope: AccountScope = selectedScope;
  let companyId: string | undefined;

  if (session.user.accountScope === "COMPANY") {
    if (accountScope !== "COMPANY" || !session.user.companyId) {
      return invitationFailure(
        "Company administrators can invite only company users.",
      );
    }

    if (
      typeof selectedCompanyId === "string" &&
      selectedCompanyId.length > 0 &&
      selectedCompanyId !== session.user.companyId
    ) {
      return invitationFailure("Access outside company scope is forbidden.");
    }

    companyId = session.user.companyId;
  } else if (accountScope === "COMPANY") {
    if (
      typeof selectedCompanyId !== "string" ||
      !uuidPattern.test(selectedCompanyId)
    ) {
      return invitationFailure("Choose a valid customer company.");
    }

    companyId = selectedCompanyId;
  } else if (
    typeof selectedCompanyId === "string" &&
    selectedCompanyId.length > 0
  ) {
    return invitationFailure(
      "Platform accounts cannot be assigned to a company.",
    );
  }

  let invitation: UserInvitation;

  try {
    invitation = await apiRequest<UserInvitation>("/users/invitations", {
      method: "POST",
      token,
      body: JSON.stringify({
        email: selectedEmail.trim(),
        accountScope,
        ...(companyId ? { companyId } : {}),
        roleKeys,
      }),
    });
  } catch (error: unknown) {
    return invitationFailure(
      failure(error).message ?? "The invitation failed.",
    );
  }

  revalidatePath("/admin/users");

  return {
    message: null,
    invitation: {
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      email: invitation.user.email,
    },
  };
}

export async function updateUserStatusAction(
  userId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getAdminApiContext(PERMISSIONS.USERS_MANAGE);
  const selectedStatus = formData.get("status");

  if (
    selectedStatus !== "ACTIVE" &&
    selectedStatus !== "SUSPENDED" &&
    selectedStatus !== "ARCHIVED"
  ) {
    return { message: "Choose a valid account status." };
  }

  try {
    await apiRequest<ManagedUser>(
      `/users/${encodeURIComponent(userId)}/status`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: selectedStatus }),
      },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}`);
}

export async function batchUserStatusAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await getAdminApiContext(PERMISSIONS.USERS_MANAGE);
  const ids = selectedBatchIds(formData);
  const status = formData.get("batchAction");

  if (
    !ids ||
    (status !== "ACTIVE" &&
      status !== "SUSPENDED" &&
      status !== "ARCHIVED" &&
      status !== "DELETE")
  ) {
    return { ok: false, message: "Choose valid users and an account action." };
  }

  try {
    if (status === "DELETE") {
      const result = await apiRequest<{ deleted: number }>(
        "/users/batch-delete",
        {
          method: "POST",
          token,
          body: JSON.stringify({ ids }),
        },
      );

      revalidatePath("/admin/users");
      return { ok: true, message: `${result.deleted} deleted.` };
    }

    const result = await apiRequest<BatchMutationResult>(
      "/users/batch-status",
      {
        method: "POST",
        token,
        body: JSON.stringify({ ids, status }),
      },
    );

    revalidatePath("/admin/users");
    return {
      ok: true,
      message: `${result.changed} changed; ${result.unchanged} unchanged.`,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failure(error).message ?? "Batch update failed.",
    };
  }
}

export async function updateUserRolesAction(
  userId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getAdminApiContext(PERMISSIONS.USERS_MANAGE);
  const roleKeys = selectedRoleKeys(formData);

  if (!roleKeys) {
    return { message: "Choose at least one valid role." };
  }

  try {
    await apiRequest<ManagedUser>(
      `/users/${encodeURIComponent(userId)}/administration/roles`,
      {
        method: "PUT",
        token,
        body: JSON.stringify({ roleKeys }),
      },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}`);
}

export async function archiveUserRowAction(
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await getAdminApiContext(PERMISSIONS.USERS_MANAGE);

  try {
    await apiRequest(`/users/${encodeURIComponent(userId)}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status: "ARCHIVED" }),
    });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { ok: true, message: "User archived." };
  } catch (error: unknown) {
    return { ok: false, message: failure(error).message ?? "Archive failed." };
  }
}

export async function restoreUserRowAction(
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await getAdminApiContext(PERMISSIONS.USERS_MANAGE);

  try {
    await apiRequest(`/users/${encodeURIComponent(userId)}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { ok: true, message: "User restored." };
  } catch (error: unknown) {
    return { ok: false, message: failure(error).message ?? "Restore failed." };
  }
}

export async function deleteUserRowAction(
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await getAdminApiContext(PERMISSIONS.USERS_MANAGE);

  try {
    await apiRequest(`/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      token,
    });
    revalidatePath("/admin/users");
    return { ok: true, message: "User deleted." };
  } catch (error: unknown) {
    return { ok: false, message: failure(error).message ?? "Delete failed." };
  }
}
