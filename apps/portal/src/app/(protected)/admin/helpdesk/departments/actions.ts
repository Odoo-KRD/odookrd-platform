"use server";

import { PERMISSIONS, type LocalizedText } from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { FormState } from "@/lib/forms";
import { helpdeskAdminDictionaries } from "@/lib/i18n/helpdesk-admin";
import { getLocale } from "@/lib/i18n/server";

const locales = ["ku", "ar", "en"] as const;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIST_PATH = "/admin/helpdesk/departments";

interface RowActionResult {
  ok: boolean;
  message: string;
}

async function labels() {
  return helpdeskAdminDictionaries[await getLocale()];
}

async function failure(error: unknown): Promise<FormState> {
  if (error instanceof ApiRequestError && error.status < 500) {
    return { message: error.message };
  }

  return { message: (await labels()).genericError };
}

function localized(formData: FormData, field: string): LocalizedText {
  const result: LocalizedText = {};

  for (const locale of locales) {
    const value = formData.get(`${field}.${locale}`);

    if (typeof value === "string" && value.trim()) {
      result[locale] = value.trim();
    }
  }

  return result;
}

/**
 * The base column takes whichever translation the author filled in, preferring
 * the tab they were last editing, exactly as the knowledge-base forms do.
 */
function fallbackValue(
  formData: FormData,
  field: string,
  translations: LocalizedText,
): string | null {
  const activeLocale = formData.get(`${field}.__activeLocale`);

  if (
    (activeLocale === "ku" || activeLocale === "ar" || activeLocale === "en") &&
    translations[activeLocale]?.trim()
  ) {
    return translations[activeLocale]?.trim() ?? null;
  }

  return (
    translations.ku?.trim() ??
    translations.ar?.trim() ??
    translations.en?.trim() ??
    null
  );
}

function optionalText(formData: FormData, field: string): string | undefined {
  const value = formData.get(field);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(formData: FormData, field: string): number | undefined {
  const value = optionalText(formData, field);

  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function departmentBody(formData: FormData) {
  const nameTranslations = localized(formData, "name");
  const descriptionTranslations = localized(formData, "description");
  const status = optionalText(formData, "status");

  return {
    name: fallbackValue(formData, "name", nameTranslations),
    nameTranslations,
    description: fallbackValue(
      formData,
      "description",
      descriptionTranslations,
    ),
    descriptionTranslations,
    slug: optionalText(formData, "slug"),
    status: status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    sortOrder: optionalNumber(formData, "sortOrder"),
  };
}

export async function createDepartmentAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE);
  const body = departmentBody(formData);

  if (!body.name) {
    return { message: (await labels()).nameRequired };
  }

  try {
    await apiRequest("/helpdesk/admin/departments", {
      token,
      method: "POST",
      body: JSON.stringify({
        ...body,
        description: body.description ?? undefined,
      }),
    });
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function updateDepartmentAction(
  departmentId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE);
  const body = departmentBody(formData);

  if (!uuidPattern.test(departmentId)) {
    return { message: (await labels()).genericError };
  }

  if (!body.name) {
    return { message: (await labels()).nameRequired };
  }

  try {
    await apiRequest(
      `/helpdesk/admin/departments/${encodeURIComponent(departmentId)}`,
      {
        token,
        method: "PATCH",
        // An emptied description clears the stored one.
        body: JSON.stringify({ ...body, description: body.description }),
      },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

async function setStatus(
  departmentId: string,
  status: "ACTIVE" | "ARCHIVED",
): Promise<RowActionResult> {
  const { token } = await getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE);

  if (!uuidPattern.test(departmentId)) {
    return { ok: false, message: (await labels()).genericError };
  }

  try {
    await apiRequest(
      `/helpdesk/admin/departments/${encodeURIComponent(departmentId)}`,
      { token, method: "PATCH", body: JSON.stringify({ status }) },
    );
  } catch (error: unknown) {
    return { ok: false, message: (await failure(error)).message ?? "" };
  }

  revalidatePath(LIST_PATH);
  return { ok: true, message: (await labels()).saved };
}

export async function archiveDepartmentRowAction(departmentId: string) {
  return setStatus(departmentId, "ARCHIVED");
}

export async function restoreDepartmentRowAction(departmentId: string) {
  return setStatus(departmentId, "ACTIVE");
}

/** The API refuses (409) when the department has tickets: archive it instead. */
export async function deleteDepartmentRowAction(
  departmentId: string,
): Promise<RowActionResult> {
  const { token } = await getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE);

  if (!uuidPattern.test(departmentId)) {
    return { ok: false, message: (await labels()).genericError };
  }

  try {
    await apiRequest(
      `/helpdesk/admin/departments/${encodeURIComponent(departmentId)}`,
      { token, method: "DELETE" },
    );
  } catch (error: unknown) {
    return { ok: false, message: (await failure(error)).message ?? "" };
  }

  revalidatePath(LIST_PATH);
  return { ok: true, message: (await labels()).saved };
}
