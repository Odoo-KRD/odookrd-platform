"use server";

import { PERMISSIONS, type Company } from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import type { FormState } from "@/lib/forms";
import { localizedFormValues, primaryLocalizedValue } from "@/lib/i18n/content";

export async function updateCustomerCompanyAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getCustomerApiContext(
    PERMISSIONS.COMPANIES_MANAGE,
  );
  const companyId = session.user.companyId;

  if (!companyId) {
    return { message: "A company account is required." };
  }

  const nameTranslations = localizedFormValues(formData, "name", 200);
  const name = nameTranslations
    ? primaryLocalizedValue(nameTranslations)
    : null;

  if (!nameTranslations?.ku || !name) {
    return { message: "Enter a company name between 1 and 200 characters." };
  }

  try {
    await apiRequest<Company>(`/companies/${encodeURIComponent(companyId)}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ name, nameTranslations }),
    });
  } catch (error: unknown) {
    return {
      message:
        error instanceof ApiRequestError
          ? error.message
          : "The request could not be completed.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/company");
  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  redirect("/dashboard/company");
}
