"use server";

import { PERMISSIONS } from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dateField(
  formData: FormData,
  key: string,
  endOfDay: boolean,
): string | null | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
}

function modeField(formData: FormData): "ALL_USERS" | "ASSIGNED_USERS" | null {
  const mode = formData.get("mode");
  return mode === "ALL_USERS" || mode === "ASSIGNED_USERS" ? mode : null;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiRequestError
    ? error.message
    : "The access operation could not be completed.";
}

async function mutate(
  courseId: string,
  task: (token: string) => Promise<unknown>,
  selectedCompanyId?: string,
): Promise<never> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.TRAINING_ASSIGN,
  );
  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  let error: string | null = null;
  try {
    await task(token);
  } catch (caught) {
    error = errorMessage(caught);
  }

  const base = `/admin/training/courses/${courseId}/access`;
  const params = new URLSearchParams();
  if (selectedCompanyId && uuid.test(selectedCompanyId)) {
    params.set("companyId", selectedCompanyId);
  }
  if (error) params.set("error", error);

  revalidatePath(base);
  revalidatePath(`/admin/training/courses/${courseId}`);
  const query = params.toString();
  redirect(query ? `${base}?${query}` : base);
}

export async function createCompanyAccessAction(
  courseId: string,
  formData: FormData,
): Promise<never> {
  const companyId = formData.get("companyId");
  const mode = modeField(formData);
  const startsAt = dateField(formData, "startsAt", false);
  const expiresAt = dateField(formData, "expiresAt", true);

  if (
    typeof companyId !== "string" ||
    !uuid.test(companyId) ||
    !mode ||
    startsAt === undefined ||
    expiresAt === undefined
  ) {
    redirect(
      `/admin/training/courses/${courseId}/access?error=${encodeURIComponent("Enter valid company access information.")}`,
    );
  }

  return mutate(courseId, (token) =>
    apiRequest(`/training/access/courses/${courseId}/companies`, {
      method: "POST",
      token,
      body: JSON.stringify({ companyId, mode, startsAt, expiresAt }),
    }),
  );
}

export async function updateCompanyAccessAction(
  courseId: string,
  accessId: string,
  formData: FormData,
): Promise<never> {
  const mode = modeField(formData);
  const startsAt = dateField(formData, "startsAt", false);
  const expiresAt = dateField(formData, "expiresAt", true);
  if (
    !uuid.test(accessId) ||
    !mode ||
    startsAt === undefined ||
    expiresAt === undefined
  ) {
    redirect(
      `/admin/training/courses/${courseId}/access?error=${encodeURIComponent("Enter valid company access information.")}`,
    );
  }

  return mutate(courseId, (token) =>
    apiRequest(`/training/access/courses/${courseId}/companies/${accessId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ mode, startsAt, expiresAt }),
    }),
  );
}

export async function deleteCompanyAccessAction(
  courseId: string,
  accessId: string,
  _formData: FormData,
): Promise<never> {
  return mutate(courseId, (token) =>
    apiRequest(`/training/access/courses/${courseId}/companies/${accessId}`, {
      method: "DELETE",
      token,
    }),
  );
}

export async function createServiceAccessAction(
  courseId: string,
  formData: FormData,
): Promise<never> {
  const serviceId = formData.get("serviceId");
  const mode = modeField(formData);
  const startsAt = dateField(formData, "startsAt", false);
  const expiresAt = dateField(formData, "expiresAt", true);

  if (
    typeof serviceId !== "string" ||
    !uuid.test(serviceId) ||
    !mode ||
    startsAt === undefined ||
    expiresAt === undefined
  ) {
    redirect(
      `/admin/training/courses/${courseId}/access?error=${encodeURIComponent("Enter valid TRAINING service access information.")}`,
    );
  }

  return mutate(courseId, (token) =>
    apiRequest(`/training/access/courses/${courseId}/services`, {
      method: "POST",
      token,
      body: JSON.stringify({ serviceId, mode, startsAt, expiresAt }),
    }),
  );
}

export async function updateServiceAccessAction(
  courseId: string,
  accessId: string,
  formData: FormData,
): Promise<never> {
  const mode = modeField(formData);
  const startsAt = dateField(formData, "startsAt", false);
  const expiresAt = dateField(formData, "expiresAt", true);
  if (
    !uuid.test(accessId) ||
    !mode ||
    startsAt === undefined ||
    expiresAt === undefined
  ) {
    redirect(
      `/admin/training/courses/${courseId}/access?error=${encodeURIComponent("Enter valid TRAINING service access information.")}`,
    );
  }

  return mutate(courseId, (token) =>
    apiRequest(`/training/access/courses/${courseId}/services/${accessId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ mode, startsAt, expiresAt }),
    }),
  );
}

export async function deleteServiceAccessAction(
  courseId: string,
  accessId: string,
  _formData: FormData,
): Promise<never> {
  return mutate(courseId, (token) =>
    apiRequest(`/training/access/courses/${courseId}/services/${accessId}`, {
      method: "DELETE",
      token,
    }),
  );
}

export async function createUserAccessAction(
  courseId: string,
  selectedCompanyId: string,
  formData: FormData,
): Promise<never> {
  const userId = formData.get("userId");
  const startsAt = dateField(formData, "startsAt", false);
  const expiresAt = dateField(formData, "expiresAt", true);

  if (
    typeof userId !== "string" ||
    !uuid.test(userId) ||
    startsAt === undefined ||
    expiresAt === undefined
  ) {
    redirect(
      `/admin/training/courses/${courseId}/access?companyId=${encodeURIComponent(selectedCompanyId)}&error=${encodeURIComponent("Enter valid learner access information.")}`,
    );
  }

  return mutate(
    courseId,
    (token) =>
      apiRequest(`/training/access/courses/${courseId}/users`, {
        method: "POST",
        token,
        body: JSON.stringify({ userId, startsAt, expiresAt }),
      }),
    selectedCompanyId,
  );
}

export async function updateUserAccessAction(
  courseId: string,
  accessId: string,
  formData: FormData,
): Promise<never> {
  const startsAt = dateField(formData, "startsAt", false);
  const expiresAt = dateField(formData, "expiresAt", true);
  if (
    !uuid.test(accessId) ||
    startsAt === undefined ||
    expiresAt === undefined
  ) {
    redirect(
      `/admin/training/courses/${courseId}/access?error=${encodeURIComponent("Enter valid learner access dates.")}`,
    );
  }

  return mutate(courseId, (token) =>
    apiRequest(`/training/access/courses/${courseId}/users/${accessId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ startsAt, expiresAt }),
    }),
  );
}

export async function deleteUserAccessAction(
  courseId: string,
  accessId: string,
  _formData: FormData,
): Promise<never> {
  return mutate(courseId, (token) =>
    apiRequest(`/training/access/courses/${courseId}/users/${accessId}`, {
      method: "DELETE",
      token,
    }),
  );
}
