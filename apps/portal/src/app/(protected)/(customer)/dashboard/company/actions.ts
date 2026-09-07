"use server";

import {
  PERMISSIONS,
  type CompanyIdentityChangeRequest,
  type CompanyProfile,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import type { FormState } from "@/lib/forms";

function value(
  formData: FormData,
  name: string,
  maxLength: number,
): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return null;
  const normalized = raw.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function failure(error: unknown): FormState {
  return {
    message:
      error instanceof ApiRequestError
        ? error.message
        : "The request could not be completed.",
  };
}

export async function updateCompanyContactAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getCustomerApiContext(PERMISSIONS.COMPANIES_MANAGE);

  const input = {
    contactEmail: value(formData, "contactEmail", 320),
    websiteUrl: value(formData, "websiteUrl", 500),
    phone: value(formData, "phone", 32),
    addressLine1: value(formData, "addressLine1", 250),
    addressLine2: value(formData, "addressLine2", 250),
    city: value(formData, "city", 120),
    region: value(formData, "region", 120),
    postalCode: value(formData, "postalCode", 32),
    countryCode: value(formData, "countryCode", 2)?.toUpperCase() ?? null,
  };

  try {
    await apiRequest<CompanyProfile>("/workspace/company/contact", {
      method: "PATCH",
      token,
      body: JSON.stringify(input),
    });
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/dashboard/company");
  revalidatePath("/dashboard");
  return { message: "Saved.", success: true };
}

export async function requestCompanyIdentityChangeAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getCustomerApiContext(PERMISSIONS.COMPANIES_MANAGE);

  const proposedName = value(formData, "proposedName", 200);
  const logo = formData.get("logo");
  const outbound = new FormData();

  if (proposedName) {
    outbound.set("proposedName", proposedName);
  }

  if (logo instanceof File && logo.size > 0) {
    if (
      logo.size > 10_485_760 ||
      !["image/jpeg", "image/png", "image/webp"].includes(logo.type)
    ) {
      return {
        message: "The proposed logo must be JPEG, PNG, or WebP up to 10 MB.",
      };
    }

    outbound.set("logo", logo);
  }

  if (!proposedName && !(logo instanceof File && logo.size > 0)) {
    return { message: "Suggest a company name, a logo, or both." };
  }

  try {
    await apiRequest<CompanyIdentityChangeRequest>(
      "/workspace/company/identity-requests",
      {
        method: "POST",
        token,
        body: outbound,
      },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/dashboard/company");
  return { message: "Submitted for Platform Admin review." };
}
