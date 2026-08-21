"use server";

import { PERMISSIONS, type Company, type CompanyStatus } from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { FormState } from "@/lib/forms";
import { localizedFormValues, primaryLocalizedValue } from "@/lib/i18n/content";

function failure(error: unknown): FormState {
  if (error instanceof ApiRequestError) {
    return { message: error.message };
  }

  return { message: "The request could not be completed." };
}

function companyInput(formData: FormData) {
  const nameTranslations = localizedFormValues(formData, "name", 200);

  if (!nameTranslations || !nameTranslations.ku) {
    return null;
  }

  const name = primaryLocalizedValue(nameTranslations);

  return name ? { name, nameTranslations } : null;
}

export async function createCompanyAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.COMPANIES_MANAGE,
  );

  if (session.user.accountScope !== "PLATFORM") {
    return { message: "Only platform administrators can create companies." };
  }

  const input = companyInput(formData);

  if (!input) {
    return { message: "Enter a company name between 1 and 200 characters." };
  }

  let company: Company;

  try {
    company = await apiRequest<Company>("/companies", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/admin/companies");
  redirect(`/admin/companies/${company.id}`);
}

export async function updateCompanyAction(
  companyId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.COMPANIES_MANAGE,
  );

  if (
    session.user.accountScope === "COMPANY" &&
    session.user.companyId !== companyId
  ) {
    return { message: "Access outside company scope is forbidden." };
  }

  const input = companyInput(formData);

  if (!input) {
    return { message: "Enter a company name between 1 and 200 characters." };
  }

  try {
    await apiRequest<Company>(`/companies/${encodeURIComponent(companyId)}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(input),
    });
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  redirect(`/admin/companies/${companyId}`);
}

export async function updateCompanyStatusAction(
  companyId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.COMPANIES_MANAGE,
  );

  if (session.user.accountScope !== "PLATFORM") {
    return {
      message: "Only platform administrators can change company status.",
    };
  }

  const selected = formData.get("status");
  const statuses: CompanyStatus[] = ["ACTIVE", "SUSPENDED", "ARCHIVED"];

  if (
    typeof selected !== "string" ||
    !statuses.includes(selected as CompanyStatus)
  ) {
    return { message: "Choose a valid company status." };
  }

  try {
    await apiRequest<Company>(
      `/companies/${encodeURIComponent(companyId)}/status`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: selected }),
      },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  redirect(`/admin/companies/${companyId}`);
}
