"use server";

import { PERMISSIONS } from "@odookrd/types";
import { revalidatePath } from "next/cache";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import type { FormState } from "@/lib/forms";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const requestableTerms = new Set([
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUAL",
  "ANNUAL",
  "BIENNIAL",
  "TRIENNIAL",
]);

function failed(error: unknown): FormState {
  if (error instanceof ApiRequestError && error.status < 500) {
    return { message: error.message };
  }

  return { message: "The request could not be completed. Please try again." };
}

function noteValue(formData: FormData): string | null | undefined {
  const raw = formData.get("note");

  if (raw === null || raw === "") {
    return undefined;
  }

  if (typeof raw !== "string" || raw.length > 1000) {
    return null;
  }

  return raw.trim() || undefined;
}

export async function requestRenewalAction(
  assignmentId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getCustomerApiContext(PERMISSIONS.SERVICES_READ);
  const requestedTerm = formData.get("requestedTerm");
  const note = noteValue(formData);

  if (
    !uuidPattern.test(assignmentId) ||
    typeof requestedTerm !== "string" ||
    !requestableTerms.has(requestedTerm) ||
    note === null
  ) {
    return { message: "Choose a renewal period and try again." };
  }

  try {
    await apiRequest(
      `/service-assignments/${encodeURIComponent(assignmentId)}/renewal-requests`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ requestedTerm, note }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath(`/dashboard/services/${assignmentId}`);
  revalidatePath("/dashboard/services");

  return { message: null };
}

export async function withdrawRenewalRequestAction(
  assignmentId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getCustomerApiContext(PERMISSIONS.SERVICES_READ);
  const requestId = formData.get("requestId");

  if (typeof requestId !== "string" || !uuidPattern.test(requestId)) {
    return { message: "This request could not be withdrawn." };
  }

  try {
    await apiRequest(
      `/subscription-renewal-requests/${encodeURIComponent(requestId)}/cancel`,
      { method: "POST", token },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath(`/dashboard/services/${assignmentId}`);

  return { message: null };
}
