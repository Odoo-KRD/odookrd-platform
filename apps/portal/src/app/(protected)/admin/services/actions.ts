"use server";

import {
  PERMISSIONS,
  type BatchMutationResult,
  type CompanyServiceFeature,
  type CompanyServiceAssignment,
  type CompanyServiceStatus,
  type LocalizedText,
  type ManagedService,
  type ManagedServiceFeature,
  type PaginatedResult,
  type ServiceCatalogStatus,
  type ServiceCategory,
  type ServiceFeatureStatus,
  type ServiceFeatureDefinition,
  type ServiceFeatureValue,
  type ServiceFeatureValueType,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { FormState } from "@/lib/forms";
import { localizedFormValues, primaryLocalizedValue } from "@/lib/i18n/content";
import { isPredefinedFeatureUnit } from "@/lib/service-feature-units";

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

const featureValueTypes: readonly ServiceFeatureValueType[] = [
  "BOOLEAN",
  "NUMBER",
  "STORAGE",
  "TEXT",
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

function selectedBatchIds(formData: FormData): string[] | null {
  const values = formData.getAll("selectedIds");

  if (
    values.length === 0 ||
    values.length > 100 ||
    values.some(
      (value) => typeof value !== "string" || !uuidPattern.test(value),
    )
  ) {
    return null;
  }

  const ids = [...new Set(values as string[])];
  return ids.length === values.length ? ids : null;
}

function featureValue(
  formData: FormData,
  valueType: ServiceFeatureValueType,
  field: "defaultValue" | "value",
  localizedField: "featureValue" | "assignmentValue" | "attachmentValue",
): { value: ServiceFeatureValue; translations: LocalizedText } | null {
  if (valueType === "BOOLEAN") {
    const value = formData.get(field);

    return value === "true" || value === "false"
      ? { value: value === "true", translations: {} }
      : null;
  }

  if (valueType === "NUMBER" || valueType === "STORAGE") {
    const selected = formData.get(field);

    if (typeof selected !== "string" || selected.trim() === "") {
      return null;
    }

    const value = Number(selected);
    return Number.isFinite(value) ? { value, translations: {} } : null;
  }

  const translations = localizedFormValues(formData, localizedField, 500);
  const value = translations ? primaryLocalizedValue(translations) : null;

  if (!value || !translations) {
    return null;
  }

  return {
    value,
    translations: translations.ku
      ? translations
      : { ...translations, ku: value },
  };
}

interface ServiceFeatureInput {
  name: string;
  nameTranslations: LocalizedText;
  description: string | null;
  descriptionTranslations: LocalizedText;
  valueType: ServiceFeatureValueType;
  defaultValue: ServiceFeatureValue;
  valueTranslations: LocalizedText;
  unit: string | null;
  status: ServiceFeatureStatus;
  customerVisible: boolean;
  sortOrder: number;
}

interface ServiceFeatureDefinitionInput extends Omit<
  ServiceFeatureInput,
  "customerVisible"
> {
  category: ServiceCategory;
  parameterLabel: string;
  parameterLabelTranslations: LocalizedText;
}

function featureInput(formData: FormData): ServiceFeatureInput | null {
  const nameTranslations = localizedFormValues(formData, "featureName", 200);
  const descriptionTranslations = localizedFormValues(
    formData,
    "featureDescription",
    1000,
  );
  const name = nameTranslations
    ? primaryLocalizedValue(nameTranslations)
    : null;
  const description = descriptionTranslations
    ? primaryLocalizedValue(descriptionTranslations)
    : null;
  const selectedValueType = formData.get("valueType");
  const selectedStatus = formData.get("featureStatus");
  const rawSortOrder = formData.get("sortOrder");

  if (
    !name ||
    !nameTranslations ||
    !descriptionTranslations ||
    typeof selectedValueType !== "string" ||
    !featureValueTypes.includes(selectedValueType as ServiceFeatureValueType) ||
    (selectedStatus !== "ACTIVE" && selectedStatus !== "INACTIVE") ||
    typeof rawSortOrder !== "string"
  ) {
    return null;
  }

  const valueType = selectedValueType as ServiceFeatureValueType;
  const selectedValue = featureValue(
    formData,
    valueType,
    "defaultValue",
    "featureValue",
  );
  const sortOrder = Number(rawSortOrder);
  const unit =
    valueType === "NUMBER" || valueType === "STORAGE"
      ? textValue(formData, "unit", 32)
      : "";

  if (
    !selectedValue ||
    unit === null ||
    (unit !== "" && !isPredefinedFeatureUnit(unit)) ||
    !Number.isSafeInteger(sortOrder) ||
    sortOrder < 0 ||
    sortOrder > 10000
  ) {
    return null;
  }

  return {
    name,
    nameTranslations: nameTranslations.ku
      ? nameTranslations
      : { ...nameTranslations, ku: name },
    description: description || null,
    descriptionTranslations,
    valueType,
    defaultValue: selectedValue.value,
    valueTranslations: selectedValue.translations,
    unit: unit || null,
    status: selectedStatus,
    customerVisible: formData.get("customerVisible") === "on",
    sortOrder,
  };
}

function definitionInput(
  formData: FormData,
): ServiceFeatureDefinitionInput | null {
  const feature = featureInput(formData);
  const category = formData.get("category");
  const parameterLabelTranslations = localizedFormValues(
    formData,
    "parameterLabel",
    100,
  );
  const parameterLabel = parameterLabelTranslations
    ? primaryLocalizedValue(parameterLabelTranslations)
    : null;

  if (
    !feature ||
    !isServiceCategory(category) ||
    !parameterLabel ||
    !parameterLabelTranslations
  ) {
    return null;
  }

  const { customerVisible, ...definition } = feature;
  void customerVisible;

  return {
    ...definition,
    category,
    parameterLabel,
    parameterLabelTranslations: parameterLabelTranslations.ku
      ? parameterLabelTranslations
      : { ...parameterLabelTranslations, ku: parameterLabel },
  };
}

function refreshServiceAdministration(
  serviceId?: string,
  assignmentId?: string,
): void {
  revalidatePath("/admin/services");
  revalidatePath("/admin/services/features");
  revalidatePath("/admin/companies");
  revalidatePath("/dashboard/services");

  if (serviceId) {
    revalidatePath(`/admin/services/${serviceId}`);
  }

  if (assignmentId) {
    revalidatePath(`/admin/services/assignments/${assignmentId}`);
    revalidatePath(`/dashboard/services/${assignmentId}`);
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
  const billingModel = billingModelValue(formData);
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
        billingModel,
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
  const billingModel = billingModelValue(formData);
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
          billingModel,
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

export async function batchServiceStatusAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  const ids = selectedBatchIds(formData);
  const status = formData.get("batchAction");

  if (
    session.user.accountScope !== "PLATFORM" ||
    !ids ||
    !isCatalogStatus(status)
  ) {
    return {
      ok: false,
      message: "Choose valid services and a catalog status.",
    };
  }

  try {
    const result = await apiRequest<BatchMutationResult>(
      "/services/batch-status",
      {
        method: "POST",
        token,
        body: JSON.stringify({ ids, status }),
      },
    );

    refreshServiceAdministration();

    return {
      ok: true,
      message: `${result.changed} changed; ${result.unchanged} unchanged.`,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failed(error).message ?? "Batch update failed.",
    };
  }
}

export async function createFeatureDefinitionAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  const key = textValue(formData, "featureKey", 100);
  const input = definitionInput(formData);

  if (session.user.accountScope !== "PLATFORM") {
    return { message: "Platform feature administration is forbidden." };
  }

  if (!key || !/^[a-z][a-z0-9_-]{1,99}$/.test(key)) {
    return {
      message:
        "Enter a feature key such as storage-odoo using lowercase letters, digits, - or _.",
    };
  }

  if (!input) {
    return {
      message:
        "Enter the feature name, category, parameter, and a valid value for its selected type.",
    };
  }

  try {
    await apiRequest<ServiceFeatureDefinition>("/service-feature-definitions", {
      method: "POST",
      token,
      body: JSON.stringify({ key, ...input }),
    });
  } catch (error: unknown) {
    return failed(error);
  }

  refreshServiceAdministration();
  redirect("/admin/services/features");
}

export async function updateFeatureDefinitionAction(
  definitionId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  const input = definitionInput(formData);

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(definitionId)
  ) {
    return { message: "Platform feature administration is forbidden." };
  }

  if (!input) {
    return {
      message:
        "Enter the feature name, category, parameter, and a valid value for its selected type.",
    };
  }

  try {
    await apiRequest<ServiceFeatureDefinition>(
      `/service-feature-definitions/${encodeURIComponent(definitionId)}`,
      { method: "PATCH", token, body: JSON.stringify(input) },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  refreshServiceAdministration();
  revalidatePath(`/admin/services/features/${definitionId}`);
  return { message: null };
}

export async function attachServiceFeatureDefinitionAction(
  serviceId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  const definitionId = textValue(formData, "definitionId", 36);
  const selectedValueType = formData.get("valueType");

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(serviceId) ||
    !definitionId ||
    !uuidPattern.test(definitionId) ||
    typeof selectedValueType !== "string" ||
    !featureValueTypes.includes(selectedValueType as ServiceFeatureValueType)
  ) {
    return { message: "Select an available predefined feature." };
  }

  const selectedValue = featureValue(
    formData,
    selectedValueType as ServiceFeatureValueType,
    "value",
    "attachmentValue",
  );

  if (!selectedValue) {
    return {
      message: "Enter a valid value for the selected feature parameter.",
    };
  }

  try {
    await apiRequest<ManagedServiceFeature>(
      `/services/${encodeURIComponent(serviceId)}/features/attach`,
      {
        method: "POST",
        token,
        body: JSON.stringify({
          definitionId,
          value: selectedValue.value,
          valueTranslations: selectedValue.translations,
          customerVisible: formData.get("customerVisible") === "on",
        }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  refreshServiceAdministration(serviceId);
  return { message: null };
}

export async function updateAttachedServiceFeatureAction(
  serviceId: string,
  featureId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  const selectedValueType = formData.get("valueType");

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(serviceId) ||
    !uuidPattern.test(featureId) ||
    typeof selectedValueType !== "string" ||
    !featureValueTypes.includes(selectedValueType as ServiceFeatureValueType)
  ) {
    return { message: "Choose a valid service feature." };
  }

  const selectedValue = featureValue(
    formData,
    selectedValueType as ServiceFeatureValueType,
    "value",
    "attachmentValue",
  );

  if (!selectedValue) {
    return {
      message: "Enter a valid value for the selected feature parameter.",
    };
  }

  try {
    await apiRequest<ManagedServiceFeature>(
      `/services/${encodeURIComponent(serviceId)}/features/${encodeURIComponent(featureId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({
          defaultValue: selectedValue.value,
          valueTranslations: selectedValue.translations,
          customerVisible: formData.get("customerVisible") === "on",
        }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  refreshServiceAdministration(serviceId);
  return { message: null };
}

export async function createServiceFeatureAction(
  serviceId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  const key = textValue(formData, "featureKey", 100);
  const input = featureInput(formData);

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(serviceId) ||
    !key ||
    !/^[a-z][a-z0-9_-]{1,99}$/.test(key) ||
    !input
  ) {
    return { message: "Complete the feature fields with a valid typed value." };
  }

  try {
    await apiRequest<ManagedServiceFeature>(
      `/services/${encodeURIComponent(serviceId)}/features`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ key, ...input }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  refreshServiceAdministration(serviceId);
  return { message: null };
}

export async function updateServiceFeatureAction(
  serviceId: string,
  featureId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  const input = featureInput(formData);

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(serviceId) ||
    !uuidPattern.test(featureId) ||
    !input
  ) {
    return { message: "Complete the feature fields with a valid typed value." };
  }

  try {
    await apiRequest<ManagedServiceFeature>(
      `/services/${encodeURIComponent(serviceId)}/features/${encodeURIComponent(featureId)}`,
      { method: "PATCH", token, body: JSON.stringify(input) },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  refreshServiceAdministration(serviceId);
  return { message: null };
}

export async function moveServiceFeatureAction(
  serviceId: string,
  featureId: string,
  direction: "up" | "down",
): Promise<void> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(serviceId) ||
    !uuidPattern.test(featureId)
  ) {
    throw new Error("Platform service-feature administration is forbidden.");
  }

  const result = await apiRequest<PaginatedResult<ManagedServiceFeature>>(
    `/services/${encodeURIComponent(serviceId)}/features?limit=100&offset=0`,
    { token },
  );
  const ids = result.items.map((feature) => feature.id);
  const currentIndex = ids.indexOf(featureId);
  const nextIndex = currentIndex + (direction === "up" ? -1 : 1);

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ids.length) {
    return;
  }

  [ids[currentIndex], ids[nextIndex]] = [ids[nextIndex], ids[currentIndex]];

  await apiRequest<{ reordered: number }>(
    `/services/${encodeURIComponent(serviceId)}/features/reorder`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ ids }),
    },
  );

  refreshServiceAdministration(serviceId);
}

export async function reorderServiceFeaturesAction(
  serviceId: string,
  ids: string[],
): Promise<{ ok: boolean; message: string | null }> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(serviceId) ||
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > 100 ||
    ids.some((id) => typeof id !== "string" || !uuidPattern.test(id)) ||
    new Set(ids).size !== ids.length
  ) {
    return { ok: false, message: "Choose a valid service-feature order." };
  }

  try {
    await apiRequest<{ reordered: number }>(
      `/services/${encodeURIComponent(serviceId)}/features/reorder`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ ids }),
      },
    );
  } catch (error: unknown) {
    return { ok: false, message: failed(error).message };
  }

  refreshServiceAdministration(serviceId);
  return { ok: true, message: null };
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

export async function createCompanyAssignmentAction(
  companyId: string,
  previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const selectedCompanyId = formData.get("companyId");

  if (
    !uuidPattern.test(companyId) ||
    typeof selectedCompanyId !== "string" ||
    selectedCompanyId !== companyId
  ) {
    return { message: "The selected company cannot be changed." };
  }

  return createAssignmentAction(previousState, formData);
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

export async function batchAssignmentTransitionAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  const ids = selectedBatchIds(formData);
  const toStatus = formData.get("batchAction");
  const reason = textValue(formData, "reason", 1000);

  if (
    session.user.accountScope !== "PLATFORM" ||
    !ids ||
    !isAssignmentStatus(toStatus) ||
    reason === null ||
    ((toStatus === "SUSPENDED" || toStatus === "CANCELLED") && !reason)
  ) {
    return {
      ok: false,
      message: "Choose a valid transition and provide a reason when required.",
    };
  }

  try {
    const result = await apiRequest<BatchMutationResult>(
      "/service-assignments/batch-transition",
      {
        method: "POST",
        token,
        body: JSON.stringify({ ids, toStatus, reason: reason || undefined }),
      },
    );

    refreshServiceAdministration();

    return {
      ok: true,
      message: `${result.changed} changed; ${result.unchanged} unchanged.`,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failed(error).message ?? "The status transition failed.",
    };
  }
}

export async function transitionAssignmentAction(
  assignmentId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  const toStatus = formData.get("toStatus");
  const reason = textValue(formData, "reason", 1000);

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(assignmentId) ||
    !isAssignmentStatus(toStatus) ||
    reason === null ||
    ((toStatus === "SUSPENDED" || toStatus === "CANCELLED") && !reason)
  ) {
    return { message: "Select a valid status and enter any required reason." };
  }

  try {
    const assignment = await apiRequest<CompanyServiceAssignment>(
      `/service-assignments/${encodeURIComponent(assignmentId)}/transitions`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ toStatus, reason: reason || undefined }),
      },
    );

    refreshServiceAdministration(assignment.serviceId, assignment.id);
  } catch (error: unknown) {
    return failed(error);
  }

  return { message: null };
}

export async function updateAssignmentFeatureAction(
  assignmentId: string,
  assignmentFeatureId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  const mode = formData.get("mode");
  const selectedValueType = formData.get("valueType");
  const selectedVisibility = formData.get("customerVisibleOverride");

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(assignmentId) ||
    !uuidPattern.test(assignmentFeatureId) ||
    (mode !== "override" && mode !== "reset") ||
    typeof selectedValueType !== "string" ||
    !featureValueTypes.includes(selectedValueType as ServiceFeatureValueType) ||
    (selectedVisibility !== "inherit" &&
      selectedVisibility !== "true" &&
      selectedVisibility !== "false")
  ) {
    return { message: "Choose a valid feature value and visibility." };
  }

  const valueType = selectedValueType as ServiceFeatureValueType;
  const selectedValue = featureValue(
    formData,
    valueType,
    "value",
    "assignmentValue",
  );

  if (mode === "override" && !selectedValue) {
    return { message: "Enter a valid value for the selected feature type." };
  }

  try {
    await apiRequest<CompanyServiceFeature>(
      `/service-assignments/${encodeURIComponent(assignmentId)}/features/${encodeURIComponent(assignmentFeatureId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({
          ...(mode === "reset"
            ? { reset: true }
            : {
                value: selectedValue?.value,
                valueTranslations: selectedValue?.translations,
              }),
          customerVisibleOverride:
            selectedVisibility === "inherit"
              ? null
              : selectedVisibility === "true",
        }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  refreshServiceAdministration(undefined, assignmentId);
  return { message: null };
}

export async function syncAssignmentFeaturesAction(
  assignmentId: string,
): Promise<void> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(assignmentId)
  ) {
    throw new Error("Platform service-feature administration is forbidden.");
  }

  await apiRequest<{ added: number; unchanged: number }>(
    `/service-assignments/${encodeURIComponent(assignmentId)}/features/sync`,
    { method: "POST", token },
  );

  refreshServiceAdministration(undefined, assignmentId);
}

export async function archiveServiceRowAction(
  serviceId: string,
): Promise<{ ok: boolean; message: string }> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  if (session.user.accountScope !== "PLATFORM") {
    return {
      ok: false,
      message: "Only platform administrators can archive services.",
    };
  }

  try {
    await apiRequest<ManagedService>(
      `/services/${encodeURIComponent(serviceId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "INACTIVE" }),
      },
    );
    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${serviceId}`);
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failed(error).message ?? "The service could not be archived.",
    };
  }
}

export async function restoreServiceRowAction(
  serviceId: string,
): Promise<{ ok: boolean; message: string }> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  if (session.user.accountScope !== "PLATFORM") {
    return {
      ok: false,
      message: "Only platform administrators can restore services.",
    };
  }

  try {
    await apiRequest<ManagedService>(
      `/services/${encodeURIComponent(serviceId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "ACTIVE" }),
      },
    );
    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${serviceId}`);
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failed(error).message ?? "The service could not be restored.",
    };
  }
}

export async function deleteServiceRowAction(
  serviceId: string,
): Promise<{ ok: boolean; message: string }> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  if (session.user.accountScope !== "PLATFORM") {
    return {
      ok: false,
      message: "Only platform administrators can delete services.",
    };
  }

  try {
    await apiRequest<{ success: true }>(
      `/services/${encodeURIComponent(serviceId)}`,
      {
        method: "DELETE",
        token,
      },
    );
    revalidatePath("/admin/services");
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failed(error).message ?? "The service could not be deleted.",
    };
  }
}

export async function archiveFeatureDefinitionRowAction(
  definitionId: string,
): Promise<{ ok: boolean; message: string }> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  if (session.user.accountScope !== "PLATFORM") {
    return {
      ok: false,
      message: "Only platform administrators can archive features.",
    };
  }

  try {
    await apiRequest<ServiceFeatureDefinition>(
      `/service-feature-definitions/${encodeURIComponent(definitionId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "INACTIVE" }),
      },
    );
    revalidatePath("/admin/services/features");
    revalidatePath(`/admin/services/features/${definitionId}`);
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failed(error).message ?? "The feature could not be archived.",
    };
  }
}

export async function restoreFeatureDefinitionRowAction(
  definitionId: string,
): Promise<{ ok: boolean; message: string }> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  if (session.user.accountScope !== "PLATFORM") {
    return {
      ok: false,
      message: "Only platform administrators can restore features.",
    };
  }

  try {
    await apiRequest<ServiceFeatureDefinition>(
      `/service-feature-definitions/${encodeURIComponent(definitionId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "ACTIVE" }),
      },
    );
    revalidatePath("/admin/services/features");
    revalidatePath(`/admin/services/features/${definitionId}`);
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failed(error).message ?? "The feature could not be restored.",
    };
  }
}

export async function deleteFeatureDefinitionRowAction(
  definitionId: string,
): Promise<{ ok: boolean; message: string }> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );
  if (session.user.accountScope !== "PLATFORM") {
    return {
      ok: false,
      message: "Only platform administrators can delete features.",
    };
  }

  try {
    await apiRequest<{ success: true }>(
      `/service-feature-definitions/${encodeURIComponent(definitionId)}`,
      { method: "DELETE", token },
    );
    revalidatePath("/admin/services/features");
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failed(error).message ?? "The feature could not be deleted.",
    };
  }
}

function billingModelValue(formData: FormData): "PERPETUAL" | "SUBSCRIPTION" {
  return formData.get("billingModel") === "SUBSCRIPTION"
    ? "SUBSCRIPTION"
    : "PERPETUAL";
}

function subscriptionEndpoint(assignmentId: string): string {
  return `/service-assignments/${encodeURIComponent(assignmentId)}/subscription`;
}

async function subscriptionContext(assignmentId: string) {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(assignmentId)
  ) {
    return null;
  }

  return { token };
}

function optionalDateValue(formData: FormData, field: string): string | null {
  const raw = formData.get(field);

  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
  }

  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function boundedInteger(
  formData: FormData,
  field: string,
  min: number,
  max: number,
): number | null | undefined {
  const raw = formData.get(field);

  if (typeof raw !== "string" || raw.trim() === "") {
    return undefined;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

const subscriptionTerms = new Set([
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUAL",
  "ANNUAL",
  "BIENNIAL",
  "TRIENNIAL",
  "CUSTOM",
]);

function termValue(formData: FormData): string | null {
  const raw = formData.get("term");

  return typeof raw === "string" && subscriptionTerms.has(raw) ? raw : null;
}

export async function createSubscriptionAction(
  assignmentId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await subscriptionContext(assignmentId);
  const term = termValue(formData);
  const gracePeriodDays = boundedInteger(formData, "gracePeriodDays", 0, 90);

  if (!context || !term || gracePeriodDays === null) {
    return { message: "Select a valid term and grace period." };
  }

  const endsAt = optionalDateValue(formData, "endsAt");

  if (term === "CUSTOM" && !endsAt) {
    return { message: "A custom term requires an end date." };
  }

  try {
    await apiRequest(subscriptionEndpoint(assignmentId), {
      method: "POST",
      token: context.token,
      body: JSON.stringify({
        term,
        startsAt: optionalDateValue(formData, "startsAt") ?? undefined,
        endsAt: term === "CUSTOM" ? endsAt : undefined,
        autoRenew: formData.get("autoRenew") === "true",
        trial: formData.get("trial") === "true",
        gracePeriodDays: gracePeriodDays ?? undefined,
        externalBillingRef:
          textValue(formData, "externalBillingRef", 200) || undefined,
      }),
    });
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath(`/admin/services/assignments/${assignmentId}`);

  return { message: null };
}

export async function updateSubscriptionAction(
  assignmentId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await subscriptionContext(assignmentId);
  const term = termValue(formData);
  const gracePeriodDays = boundedInteger(formData, "gracePeriodDays", 0, 90);

  if (!context || !term || gracePeriodDays === null) {
    return { message: "Select a valid term and grace period." };
  }

  try {
    await apiRequest(subscriptionEndpoint(assignmentId), {
      method: "PATCH",
      token: context.token,
      body: JSON.stringify({
        term,
        autoRenew: formData.get("autoRenew") === "true",
        gracePeriodDays,
        externalBillingRef: textValue(formData, "externalBillingRef", 200),
      }),
    });
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath(`/admin/services/assignments/${assignmentId}`);

  return { message: null };
}

export async function renewSubscriptionAction(
  assignmentId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await subscriptionContext(assignmentId);
  const term = termValue(formData);

  if (!context || !term) {
    return { message: "Select a valid term." };
  }

  const endsAt = optionalDateValue(formData, "endsAt");

  if (term === "CUSTOM" && !endsAt) {
    return { message: "A custom term requires an end date." };
  }

  try {
    await apiRequest(`${subscriptionEndpoint(assignmentId)}/renew`, {
      method: "POST",
      token: context.token,
      body: JSON.stringify({
        term,
        endsAt: term === "CUSTOM" ? endsAt : undefined,
      }),
    });
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath(`/admin/services/assignments/${assignmentId}`);

  return { message: null };
}

export async function cancelSubscriptionAction(
  assignmentId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await subscriptionContext(assignmentId);

  if (!context) {
    return { message: "You cannot cancel this subscription." };
  }

  try {
    await apiRequest(`${subscriptionEndpoint(assignmentId)}/cancel`, {
      method: "POST",
      token: context.token,
      body: JSON.stringify({
        atPeriodEnd: formData.get("atPeriodEnd") === "true",
        reason: textValue(formData, "reason", 1000) || undefined,
      }),
    });
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath(`/admin/services/assignments/${assignmentId}`);

  return { message: null };
}

async function renewalReviewContext(requestId: string) {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.SERVICES_MANAGE,
  );

  if (
    session.user.accountScope !== "PLATFORM" ||
    !uuidPattern.test(requestId)
  ) {
    return null;
  }

  return { token };
}

export async function approveRenewalRequestAction(
  requestId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await renewalReviewContext(requestId);

  if (!context) {
    return { message: "You cannot review this renewal request." };
  }

  try {
    await apiRequest(
      `/subscription-renewal-requests/${encodeURIComponent(requestId)}/approve`,
      {
        method: "POST",
        token: context.token,
        body: JSON.stringify({
          reviewNote: textValue(formData, "reviewNote", 1000) || undefined,
        }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath("/admin/services/renewals");

  return { message: null };
}

export async function rejectRenewalRequestAction(
  requestId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await renewalReviewContext(requestId);

  if (!context) {
    return { message: "You cannot review this renewal request." };
  }

  try {
    await apiRequest(
      `/subscription-renewal-requests/${encodeURIComponent(requestId)}/reject`,
      {
        method: "POST",
        token: context.token,
        body: JSON.stringify({
          reviewNote: textValue(formData, "reviewNote", 1000) || undefined,
        }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath("/admin/services/renewals");

  return { message: null };
}
