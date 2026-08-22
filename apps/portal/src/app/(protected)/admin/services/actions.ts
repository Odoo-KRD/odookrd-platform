"use server";

import {
  PERMISSIONS,
  type CompanyServiceAssignment,
  type CompanyServiceStatus,
  type ManagedService,
  type LocalizedText,
  type ServiceCatalogStatus,
  type ServiceCategory,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { FormState } from "@/lib/forms";
import { localizedFormValues, primaryLocalizedValue } from "@/lib/i18n/content";

const serviceCategories: readonly ServiceCategory[] = [
  "ODOO",
  "HOSTING",
  "DOMAIN",
  "SUPPORT",
  "TRAINING",
  "OTHER",
];

const catalogStatuses: readonly ServiceCatalogStatus[] = ["ACTIVE", "INACTIVE"];

const assignmentStatuses: readonly CompanyServiceStatus[] = [
  "PROVISIONING",
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "CANCELLED",
];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function failed(error: unknown): FormState {
  return {
    message:
      error instanceof ApiRequestError
        ? error.message
        : "The service request could not be completed.",
  };
}

function textValue(
  formData: FormData,
  field: string,
  maximumLength: number,
): string | null {
  const selected = formData.get(field);

  if (typeof selected !== "string") {
    return null;
  }

  const value = selected.trim();
  return value.length <= maximumLength ? value : null;
}

function optionalDate(
  formData: FormData,
  field: string,
): string | null | undefined {
  const selected = textValue(formData, field, 10);

  if (selected === null) {
    return undefined;
  }

  if (selected === "") {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(selected)) {
    return undefined;
  }

  const date = new Date(selected + "T00:00:00.000Z");

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function isServiceCategory(value: unknown): value is ServiceCategory {
  return serviceCategories.some((category) => category === value);
}

function isCatalogStatus(value: unknown): value is ServiceCatalogStatus {
  return catalogStatuses.some((status) => status === value);
}

function isAssignmentStatus(value: unknown): value is CompanyServiceStatus {
  return assignmentStatuses.some((status) => status === value);
}

function validHttpsUrl(value: string): boolean {
  try {
    const selected = new URL(value);
    return (
      selected.protocol === "https:" && !selected.username && !selected.password
    );
  } catch {
    return false;
  }
}

export async function createServiceAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );

  if (session.user.accountScope !== "PLATFORM") {
    return { message: "Only platform administrators can create services." };
  }

  const key = textValue(formData, "key", 100);
  const nameTranslations = localizedFormValues(formData, "name", 200);
  const name = nameTranslations
    ? primaryLocalizedValue(nameTranslations)
    : null;
  const category = formData.get("category");
  const status = formData.get("status");
  const descriptionTranslations = localizedFormValues(
    formData,
    "description",
    1000,
  );
  const description = descriptionTranslations
    ? primaryLocalizedValue(descriptionTranslations)
    : null;

  if (!key || !/^[a-z][a-z0-9_-]{1,99}$/.test(key)) {
    return {
      message: "Enter a lowercase service key using letters, digits, - or _.",
    };
  }

  if (
    !name ||
    !nameTranslations?.ku ||
    !descriptionTranslations ||
    !isServiceCategory(category) ||
    !isCatalogStatus(status)
  ) {
    return { message: "Complete all required service fields correctly." };
  }

  let created: ManagedService;

  try {
    created = await apiRequest<ManagedService>("/services", {
      method: "POST",
      token,
      body: JSON.stringify({
        key,
        name,
        nameTranslations,
        category,
        status,
        description: description || null,
        descriptionTranslations,
      }),
    });
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath("/admin/services");
  redirect(`/admin/services/${created.id}`);
}

export async function updateServiceAction(
  serviceId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(serviceId)
  ) {
    return { message: "Platform service administration is forbidden." };
  }

  const nameTranslations = localizedFormValues(formData, "name", 200);
  const name = nameTranslations
    ? primaryLocalizedValue(nameTranslations)
    : null;
  const category = formData.get("category");
  const status = formData.get("status");
  const descriptionTranslations = localizedFormValues(
    formData,
    "description",
    1000,
  );
  const description = descriptionTranslations
    ? primaryLocalizedValue(descriptionTranslations)
    : null;

  if (
    !name ||
    !nameTranslations?.ku ||
    !descriptionTranslations ||
    !isServiceCategory(category) ||
    !isCatalogStatus(status)
  ) {
    return { message: "Complete all required service fields correctly." };
  }

  try {
    await apiRequest<ManagedService>(
      `/services/${encodeURIComponent(serviceId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name,
          nameTranslations,
          category,
          status,
          description: description || null,
          descriptionTranslations,
        }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${serviceId}`);
  revalidatePath("/dashboard/services");
  redirect(`/admin/services/${serviceId}`);
}

interface AssignmentFormInput {
  displayName: string | null;
  displayNameTranslations: LocalizedText;
  status: CompanyServiceStatus;
  serviceUrl: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  internalNotes: string | null;
}

function assignmentInput(formData: FormData): AssignmentFormInput | null {
  const displayNameTranslations = localizedFormValues(
    formData,
    "displayName",
    200,
  );
  const displayName = displayNameTranslations
    ? primaryLocalizedValue(displayNameTranslations)
    : null;
  const serviceUrl = textValue(formData, "serviceUrl", 2048);
  const notes = textValue(formData, "notes", 2000);
  const internalNotes = textValue(formData, "internalNotes", 2000);
  const startsAt = optionalDate(formData, "startsAt");
  const expiresAt = optionalDate(formData, "expiresAt");
  const status = formData.get("status");

  if (
    !displayNameTranslations ||
    serviceUrl === null ||
    notes === null ||
    internalNotes === null ||
    startsAt === undefined ||
    expiresAt === undefined ||
    !isAssignmentStatus(status) ||
    (serviceUrl !== "" && !validHttpsUrl(serviceUrl)) ||
    (startsAt !== null && expiresAt !== null && startsAt > expiresAt)
  ) {
    return null;
  }

  return {
    displayName: displayName || null,
    displayNameTranslations,
    status,
    serviceUrl: serviceUrl || null,
    startsAt,
    expiresAt,
    notes: notes || null,
    internalNotes: internalNotes || null,
  };
}

export async function createAssignmentAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );

  if (session.user.accountScope !== "PLATFORM") {
    return { message: "Only platform administrators can assign services." };
  }

  const companyId = textValue(formData, "companyId", 36);
  const serviceId = textValue(formData, "serviceId", 36);
  const input = assignmentInput(formData);

  if (
    !companyId ||
    !serviceId ||
    !uuidPattern.test(companyId) ||
    !uuidPattern.test(serviceId) ||
    !input
  ) {
    return {
      message:
        "Choose an active company and service, with valid HTTPS links and dates.",
    };
  }

  let created: CompanyServiceAssignment;

  try {
    created = await apiRequest<CompanyServiceAssignment>(
      "/service-assignments",
      {
        method: "POST",
        token,
        body: JSON.stringify({ companyId, serviceId, ...input }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${serviceId}`);
  revalidatePath("/dashboard/services");
  redirect(`/admin/services/assignments/${created.id}`);
}

export async function updateAssignmentAction(
  assignmentId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(assignmentId)
  ) {
    return { message: "Platform service administration is forbidden." };
  }

  const input = assignmentInput(formData);

  if (!input) {
    return { message: "Enter valid service details, HTTPS links, and dates." };
  }

  try {
    await apiRequest<CompanyServiceAssignment>(
      `/service-assignments/${encodeURIComponent(assignmentId)}`,
      { method: "PATCH", token, body: JSON.stringify(input) },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/assignments/${assignmentId}`);
  revalidatePath("/dashboard/services");
  revalidatePath(`/dashboard/services/${assignmentId}`);
  redirect(`/admin/services/assignments/${assignmentId}`);
}
