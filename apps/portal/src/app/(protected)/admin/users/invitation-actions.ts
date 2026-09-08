"use server";

import {
  PERMISSIONS,
  type InvitationDeliveryOperation,
  type InvitationDispatchSummary,
  type InvitationRegeneration,
  type Locale,
  type UserInvitation,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { InvitationFormState } from "@/lib/forms";

export interface InvitationOperationState {
  message: string | null;
  success: boolean;
  token: string | null;
  expiresAt: string | null;
  dispatch: InvitationDispatchSummary | null;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const e164Pattern = /^\+[1-9]\d{7,14}$/;
const locales: readonly Locale[] = ["ku", "ar", "en"];

function failure(error: unknown): string {
  return error instanceof ApiRequestError
    ? error.message
    : "The invitation request could not be completed.";
}

function localeFrom(formData: FormData): Locale {
  const value = formData.get("locale");
  return typeof value === "string" && locales.includes(value as Locale)
    ? (value as Locale)
    : "ku";
}

function whatsappFrom(formData: FormData): string | undefined {
  const value = formData.get("whatsappNumber");
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const normalized = value.trim();
  return e164Pattern.test(normalized) ? normalized : undefined;
}

export async function inviteAndDeliverUserAction(
  _previousState: InvitationFormState,
  formData: FormData,
): Promise<InvitationFormState> {
  const { session, token } = await getAdminApiContext(PERMISSIONS.USERS_MANAGE);
  const email = formData.get("email");
  const requestedScope = formData.get("accountScope");
  const selectedCompanyId = formData.get("companyId");
  const roleKeys = formData
    .getAll("roleKeys")
    .filter((value): value is string => typeof value === "string");
  const locale = localeFrom(formData);
  const whatsappRaw = formData.get("whatsappNumber");
  const whatsappNumber = whatsappFrom(formData);

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof requestedScope !== "string" ||
    !["PLATFORM", "COMPANY"].includes(requestedScope)
  ) {
    return {
      message: "Complete the required invitation fields.",
      invitation: null,
    };
  }

  if (
    typeof whatsappRaw === "string" &&
    whatsappRaw.trim() !== "" &&
    whatsappNumber === undefined
  ) {
    return {
      message:
        "Enter the WhatsApp number in E.164 format, for example +9647XXXXXXXXX.",
      invitation: null,
    };
  }

  let accountScope = requestedScope as "PLATFORM" | "COMPANY";
  let companyId: string | null = null;

  if (session.user.accountScope === "COMPANY") {
    accountScope = "COMPANY";
    companyId = session.user.companyId;
    if (!companyId) {
      return {
        message: "Your company scope is unavailable.",
        invitation: null,
      };
    }
  } else if (accountScope === "COMPANY") {
    companyId =
      typeof selectedCompanyId === "string" &&
      uuidPattern.test(selectedCompanyId)
        ? selectedCompanyId
        : null;
    if (!companyId) {
      return { message: "Choose a valid company.", invitation: null };
    }
  }

  let invitation: UserInvitation;
  try {
    invitation = await apiRequest<UserInvitation>("/users/invitations", {
      method: "POST",
      token,
      body: JSON.stringify({
        email: email.trim(),
        accountScope,
        companyId,
        roleKeys,
      }),
    });
  } catch (error: unknown) {
    return { message: failure(error), invitation: null };
  }

  try {
    const delivery = await apiRequest<InvitationDeliveryOperation>(
      `/users/${encodeURIComponent(invitation.user.id)}/invitations/deliver`,
      {
        method: "POST",
        token,
        body: JSON.stringify({
          token: invitation.token,
          locale,
          ...(whatsappNumber ? { whatsappNumber } : {}),
        }),
      },
    );

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${invitation.user.id}`);

    return {
      message: null,
      invitation: {
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        email: invitation.user.email,
        dispatch: delivery.dispatch,
      },
    };
  } catch (error: unknown) {
    revalidatePath("/admin/users");
    return {
      message:
        "The user account was created, but automatic invitation delivery could not be completed. Use the one-time link below or resend from the user detail page. " +
        failure(error),
      invitation: {
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        email: invitation.user.email,
        dispatch: null,
      },
    };
  }
}

export async function resendInvitationAction(
  userId: string,
  _previousState: InvitationOperationState,
  formData: FormData,
): Promise<InvitationOperationState> {
  if (!uuidPattern.test(userId)) {
    return {
      message: "The selected user is invalid.",
      success: false,
      token: null,
      expiresAt: null,
      dispatch: null,
    };
  }

  const { token } = await getAdminApiContext(PERMISSIONS.USERS_MANAGE);
  const locale = localeFrom(formData);

  try {
    const result = await apiRequest<InvitationDeliveryOperation>(
      `/users/${encodeURIComponent(userId)}/invitations/resend`,
      { method: "POST", token, body: JSON.stringify({ locale }) },
    );

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    return {
      message: null,
      success: true,
      token: null,
      expiresAt: result.expiresAt,
      dispatch: result.dispatch,
    };
  } catch (error: unknown) {
    return {
      message: failure(error),
      success: false,
      token: null,
      expiresAt: null,
      dispatch: null,
    };
  }
}

export async function regenerateInvitationAction(
  userId: string,
  _previousState: InvitationOperationState,
  _formData: FormData,
): Promise<InvitationOperationState> {
  // Preserve the form-action signature while marking these as intentionally unused.
  void _previousState;
  void _formData;

  if (!uuidPattern.test(userId)) {
    return {
      message: "The selected user is invalid.",
      success: false,
      token: null,
      expiresAt: null,
      dispatch: null,
    };
  }

  const { token } = await getAdminApiContext(PERMISSIONS.USERS_MANAGE);

  try {
    const result = await apiRequest<InvitationRegeneration>(
      `/users/${encodeURIComponent(userId)}/invitations/regenerate`,
      { method: "POST", token },
    );

    revalidatePath(`/admin/users/${userId}`);

    return {
      message: null,
      success: true,
      token: result.token,
      expiresAt: result.expiresAt,
      dispatch: null,
    };
  } catch (error: unknown) {
    return {
      message: failure(error),
      success: false,
      token: null,
      expiresAt: null,
      dispatch: null,
    };
  }
}