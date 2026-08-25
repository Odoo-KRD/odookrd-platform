"use server";

import {
  PERMISSIONS,
  type BatchMutationResult,
  type Company,
  type CompanyStatus,
} from "@odookrd/types";
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

function batchIds(formData: FormData): string[] | null {
  const ids = formData.getAll("selectedIds");

  if (
    ids.length === 0 ||
    ids.length > 100 ||
    ids.some((id) => typeof id !== "string" || !uuidPattern.test(id))
  ) {
    return null;
  }

  const unique = [...new Set(ids as string[])];
  return unique.length === ids.length ? unique : null;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export async function batchCompanyStatusAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.COMPANIES_MANAGE,
  );
  const ids = batchIds(formData);
  const status = formData.get("batchAction");
  const statuses: CompanyStatus[] = ["ACTIVE", "SUSPENDED", "ARCHIVED"];

  if (
    session.user.accountScope !== "PLATFORM" ||
    !ids ||
    typeof status !== "string" ||
    !statuses.includes(status as CompanyStatus)
  ) {
    return { ok: false, message: "Choose valid companies and a status." };
  }

  try {
    const result = await apiRequest<BatchMutationResult>(
      "/companies/batch-status",
      {
        method: "POST",
        token,
        body: JSON.stringify({ ids, status }),
      },
    );

    revalidatePath("/admin/companies");
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
