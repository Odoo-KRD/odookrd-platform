"use server";

import {
  PERMISSIONS,
  type CompanyIdentityChangeRequest,
  type CompanyProfile,
  type CompanyStatus,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { FormState } from "@/lib/forms";
import { localizedFormValues, primaryLocalizedValue } from "@/lib/i18n/content";

function value(
  formData: FormData,
  name: string,
  maxLength: number,
): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return null;
  const normalized = raw.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiRequestError
    ? error.message
    : "The request could not be completed.";
}

async function platformContext() {
  const context = await getAdminApiContext(PERMISSIONS.COMPANIES_MANAGE);

  if (context.session.user.accountScope !== "PLATFORM") {
    throw new Error("Platform administrator scope is required.");
  }

  return context;
}

function revalidateCompany(companyId: string): void {
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/companies");
  revalidatePath("/dashboard/company");
}

export async function updateCompanyIdentityAction(
  companyId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();

  const nameTranslations = localizedFormValues(formData, "name", 200);
  const name = nameTranslations
    ? primaryLocalizedValue(nameTranslations)
    : null;
  const slug = value(formData, "slug", 160);
  const rawStatus = formData.get("status");
  const statuses: CompanyStatus[] = ["ACTIVE", "SUSPENDED", "ARCHIVED"];

  if (!name || !nameTranslations?.ku) {
    return { message: "Enter a valid company name." };
  }

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { message: "Enter a valid lowercase company slug." };
  }

  if (
    typeof rawStatus !== "string" ||
    !statuses.includes(rawStatus as CompanyStatus)
  ) {
    return { message: "Select a valid company status." };
  }

  try {
    await apiRequest<CompanyProfile>(
      `/companies/${encodeURIComponent(companyId)}/profile`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name,
          nameTranslations,
          slug,
          status: rawStatus,
        }),
      },
    );
  } catch (error: unknown) {
    return { message: errorMessage(error) };
  }

  revalidateCompany(companyId);
  return { message: "Saved.", success: true };
}

export async function updateCompanyContactAdminAction(
  companyId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();

  try {
    await apiRequest<CompanyProfile>(
      `/companies/${encodeURIComponent(companyId)}/profile`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({
          contactEmail: value(formData, "contactEmail", 320),
          websiteUrl: value(formData, "websiteUrl", 500),
          phone: value(formData, "phone", 32),
          addressLine1: value(formData, "addressLine1", 250),
          addressLine2: value(formData, "addressLine2", 250),
          city: value(formData, "city", 120),
          region: value(formData, "region", 120),
          postalCode: value(formData, "postalCode", 32),
          countryCode: value(formData, "countryCode", 2)?.toUpperCase() ?? null,
        }),
      },
    );
  } catch (error: unknown) {
    return { message: errorMessage(error) };
  }

  revalidateCompany(companyId);
  return { message: "Saved.", success: true };
}

export async function uploadCompanyLogoAction(
  companyId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();
  const logo = formData.get("logo");

  if (!(logo instanceof File) || logo.size <= 0) {
    return { message: "Select a company logo." };
  }

  if (
    logo.size > 10_485_760 ||
    !["image/jpeg", "image/png", "image/webp"].includes(logo.type)
  ) {
    return {
      message: "The logo must be JPEG, PNG, or WebP up to 10 MB.",
    };
  }

  const upload = new FormData();
  upload.set("logo", logo);

  try {
    await apiRequest<CompanyProfile>(
      `/companies/${encodeURIComponent(companyId)}/logo`,
      {
        method: "PUT",
        token,
        body: upload,
      },
    );
  } catch (error: unknown) {
    return { message: errorMessage(error) };
  }

  revalidateCompany(companyId);
  return { message: "Saved.", success: true };
}

export async function deleteCompanyLogoAction(
  companyId: string,
): Promise<void> {
  const { token } = await platformContext();

  await apiRequest<CompanyProfile>(
    `/companies/${encodeURIComponent(companyId)}/logo`,
    {
      method: "DELETE",
      token,
    },
  );

  revalidateCompany(companyId);
}

export async function reviewCompanyIdentityRequestAction(
  companyId: string,
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  formData: FormData,
): Promise<void> {
  const { token } = await platformContext();

  await apiRequest<CompanyIdentityChangeRequest>(
    `/companies/${encodeURIComponent(
      companyId,
    )}/identity-requests/${encodeURIComponent(requestId)}/review`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        decision,
        reviewNote: value(formData, "reviewNote", 1000),
      }),
    },
  );

  revalidateCompany(companyId);
}
