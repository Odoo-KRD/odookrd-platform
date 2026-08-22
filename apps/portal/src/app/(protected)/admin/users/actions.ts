"use server";

import {
  PERMISSIONS,
  type AccountScope,
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

  if (selectedStatus !== "ACTIVE" && selectedStatus !== "SUSPENDED") {
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
