"use server";

import { PERMISSIONS } from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function accessDate(
  formData: FormData,
  key: string,
  endOfDay: boolean,
): string | null | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiRequestError
    ? error.message
    : "The access operation could not be completed.";
}

async function mutate(
  slug: string,
  task: (token: string) => Promise<unknown>,
): Promise<never> {
  const { token } = await getCustomerApiContext(PERMISSIONS.TRAINING_ASSIGN);
  let error: string | null = null;
  try {
    await task(token);
  } catch (caught) {
    error = errorMessage(caught);
  }

  const base = `/dashboard/training/${encodeURIComponent(slug)}/learners`;
  if (error) redirect(`${base}?error=${encodeURIComponent(error)}`);

  revalidatePath("/dashboard/training");
  revalidatePath("/dashboard/training/manage");
  revalidatePath(base);
  redirect(base);
}

export async function assignCompanyLearnerAction(
  courseId: string,
  slug: string,
  formData: FormData,
): Promise<never> {
  const userId = formData.get("userId");
  const startsAt = accessDate(formData, "startsAt", false);
  const expiresAt = accessDate(formData, "expiresAt", true);

  if (
    typeof userId !== "string" ||
    !uuid.test(userId) ||
    startsAt === undefined ||
    expiresAt === undefined
  ) {
    redirect(
      `/dashboard/training/${encodeURIComponent(slug)}/learners?error=${encodeURIComponent("Enter valid learner access information.")}`,
    );
  }

  return mutate(slug, (token) =>
    apiRequest(`/training/access/courses/${courseId}/users`, {
      method: "POST",
      token,
      body: JSON.stringify({ userId, startsAt, expiresAt }),
    }),
  );
}

export async function updateCompanyLearnerAction(
  courseId: string,
  slug: string,
  accessId: string,
  formData: FormData,
): Promise<never> {
  const startsAt = accessDate(formData, "startsAt", false);
  const expiresAt = accessDate(formData, "expiresAt", true);

  if (
    !uuid.test(accessId) ||
    startsAt === undefined ||
    expiresAt === undefined
  ) {
    redirect(
      `/dashboard/training/${encodeURIComponent(slug)}/learners?error=${encodeURIComponent("Enter valid learner access dates.")}`,
    );
  }

  return mutate(slug, (token) =>
    apiRequest(`/training/access/courses/${courseId}/users/${accessId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ startsAt, expiresAt }),
    }),
  );
}

export async function removeCompanyLearnerAction(
  courseId: string,
  slug: string,
  accessId: string,
  _formData: FormData,
): Promise<never> {
  if (!uuid.test(accessId)) {
    redirect(
      `/dashboard/training/${encodeURIComponent(slug)}/learners?error=${encodeURIComponent("Invalid learner assignment.")}`,
    );
  }

  return mutate(slug, (token) =>
    apiRequest(`/training/access/courses/${courseId}/users/${accessId}`, {
      method: "DELETE",
      token,
    }),
  );
}
