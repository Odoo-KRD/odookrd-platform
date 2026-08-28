"use server";

import {
  PERMISSIONS,
  type BatchMutationResult,
  type FileAsset,
  type LocalizedText,
  type TrainingCategory,
  type TrainingCategoryStatus,
  type TrainingContentStatus,
  type TrainingCourse,
  type TrainingCourseStatus,
  type TrainingLesson,
  type TrainingSection,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { FormState } from "@/lib/forms";

const locales = ["ku", "ar", "en"] as const;

function failure(error: unknown): FormState {
  if (error instanceof ApiRequestError) return { message: error.message };
  return { message: "The request could not be completed." };
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

function preferredLocalizedFallback(
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
    translations.en?.trim() ??
    translations.ar?.trim() ??
    null
  );
}

function requiredKurdish(
  formData: FormData,
  field: string,
  maximum: number,
): { fallback: string; translations: LocalizedText } | null {
  const translations = localized(formData, field);
  const fallback = preferredLocalizedFallback(formData, field, translations);
  if (!fallback || fallback.length > maximum) return null;
  if (!translations.ku) translations.ku = fallback;
  return { fallback, translations };
}

function optionalLocalized(
  formData: FormData,
  field: string,
  maximum: number,
): { fallback: string | null; translations: LocalizedText } | null {
  const translations = localized(formData, field);
  if (
    Object.values(translations).some(
      (value) => typeof value === "string" && value.length > maximum,
    )
  ) {
    return null;
  }

  const fallback = preferredLocalizedFallback(formData, field, translations);
  if (fallback && !translations.ku) translations.ku = fallback;
  return { fallback, translations };
}

function sortOrder(formData: FormData): number | null {
  const raw = formData.get("sortOrder");
  if (typeof raw !== "string") return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000
    ? value
    : null;
}

async function platformContext() {
  const context = await getAdminApiContext(PERMISSIONS.TRAINING_MANAGE);
  if (context.session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }
  return context;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function batchIds(formData: FormData): string[] | null {
  const raw = formData.getAll("selectedIds");
  if (
    raw.length === 0 ||
    raw.length > 100 ||
    raw.some((value) => typeof value !== "string" || !uuidPattern.test(value))
  ) {
    return null;
  }

  const ids = raw as string[];
  const unique = [...new Set(ids)];
  return unique.length === ids.length ? unique : null;
}

function coverChange(
  formData: FormData,
):
  | { changed: false; fileId: null }
  | { changed: true; fileId: string | null }
  | null {
  if (formData.get("coverImageChanged") !== "true") {
    return { changed: false, fileId: null };
  }

  const raw = formData.get("coverImageAssetId");
  if (typeof raw !== "string") return null;
  const fileId = raw.trim();
  if (!fileId) return { changed: true, fileId: null };
  return uuidPattern.test(fileId) ? { changed: true, fileId } : null;
}

async function cleanupUploadedFile(
  token: string,
  fileId: string,
): Promise<void> {
  try {
    await apiRequest<FileAsset>(`/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      token,
    });
  } catch {
    // Best-effort cleanup only; uploaded assets remain auditable if cleanup fails.
  }
}

export async function createTrainingCategoryAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();
  const key = formData.get("key");
  const name = requiredKurdish(formData, "name", 200);
  const description = optionalLocalized(formData, "description", 1000);
  const status = formData.get("status");
  const order = sortOrder(formData);

  if (
    typeof key !== "string" ||
    !/^[a-z][a-z0-9_-]{1,99}$/.test(key) ||
    !name ||
    !description ||
    order === null ||
    (status !== "ACTIVE" && status !== "INACTIVE")
  ) {
    return { message: "Enter valid training category information." };
  }

  let category: TrainingCategory;
  try {
    category = await apiRequest<TrainingCategory>("/training/categories", {
      method: "POST",
      token,
      body: JSON.stringify({
        key,
        name: name.fallback,
        nameTranslations: name.translations,
        description: description.fallback,
        descriptionTranslations: description.translations,
        status: status satisfies TrainingCategoryStatus,
        sortOrder: order,
      }),
    });
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/admin/training");
  revalidatePath("/admin/training/categories");
  revalidatePath("/admin/training/courses");
  redirect(`/admin/training/categories/${category.id}`);
}

export async function batchTrainingCategoryStatusAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await platformContext();
  const ids = batchIds(formData);
  const status = formData.get("batchAction");

  if (!ids || (status !== "ACTIVE" && status !== "INACTIVE")) {
    return { ok: false, message: "Choose valid categories and a status." };
  }

  try {
    const result = await apiRequest<BatchMutationResult>(
      "/training/categories/batch-status",
      {
        method: "POST",
        token,
        body: JSON.stringify({ ids, status }),
      },
    );
    revalidatePath("/admin/training/categories");
    revalidatePath("/admin/training/courses");
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

export async function updateTrainingCategoryAction(
  categoryId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();
  const name = requiredKurdish(formData, "name", 200);
  const description = optionalLocalized(formData, "description", 1000);
  const status = formData.get("status");
  const order = sortOrder(formData);

  if (
    !name ||
    !description ||
    order === null ||
    (status !== "ACTIVE" && status !== "INACTIVE")
  ) {
    return { message: "Enter valid training category information." };
  }

  try {
    await apiRequest<TrainingCategory>(
      `/training/categories/${encodeURIComponent(categoryId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name: name.fallback,
          nameTranslations: name.translations,
          description: description.fallback,
          descriptionTranslations: description.translations,
          status: status satisfies TrainingCategoryStatus,
          sortOrder: order,
        }),
      },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath("/admin/training");
  revalidatePath("/admin/training/categories");
  revalidatePath("/admin/training/courses");
  revalidatePath(`/admin/training/categories/${categoryId}`);
  redirect(`/admin/training/categories/${categoryId}`);
}

function courseInput(formData: FormData, requireSlug: boolean) {
  const categoryId = formData.get("categoryId");
  const slug = formData.get("slug");
  const title = requiredKurdish(formData, "title", 250);
  const summary = optionalLocalized(formData, "summary", 2000);
  const status = formData.get("status");
  const order = sortOrder(formData);

  if (
    typeof categoryId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(categoryId) ||
    (requireSlug &&
      (typeof slug !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
        slug.length > 150)) ||
    !title ||
    !summary ||
    order === null ||
    (status !== "DRAFT" && status !== "PUBLISHED" && status !== "ARCHIVED")
  ) {
    return null;
  }

  return {
    categoryId,
    ...(requireSlug ? { slug } : {}),
    title: title.fallback,
    titleTranslations: title.translations,
    summary: summary.fallback,
    summaryTranslations: summary.translations,
    status: status satisfies TrainingCourseStatus,
    sortOrder: order,
  };
}

export async function createTrainingCourseAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();
  const input = courseInput(formData, true);
  const cover = coverChange(formData);
  if (!input || !cover) {
    return { message: "Enter valid training course information." };
  }

  let course: TrainingCourse;
  try {
    course = await apiRequest<TrainingCourse>("/training/courses", {
      method: "POST",
      token,
      body: JSON.stringify({
        ...input,
        ...(cover.changed ? { coverImageAssetId: cover.fileId } : {}),
      }),
    });
  } catch (error: unknown) {
    if (cover.changed && cover.fileId) {
      await cleanupUploadedFile(token, cover.fileId);
    }
    return failure(error);
  }

  revalidatePath("/admin/training");
  revalidatePath("/admin/training/categories");
  revalidatePath("/admin/training/courses");
  redirect(`/admin/training/courses/${course.id}`);
}

export async function updateTrainingCourseAction(
  courseId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();
  const input = courseInput(formData, false);
  const cover = coverChange(formData);
  if (!input || !cover) {
    return { message: "Enter valid training course information." };
  }

  let existing: TrainingCourse | null = null;
  try {
    existing = await apiRequest<TrainingCourse>(
      `/training/courses/${encodeURIComponent(courseId)}`,
      { token },
    );

    await apiRequest<TrainingCourse>(
      `/training/courses/${encodeURIComponent(courseId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({
          ...input,
          ...(cover.changed ? { coverImageAssetId: cover.fileId } : {}),
        }),
      },
    );
  } catch (error: unknown) {
    if (
      cover.changed &&
      cover.fileId &&
      cover.fileId !== existing?.coverImageAssetId
    ) {
      await cleanupUploadedFile(token, cover.fileId);
    }
    return failure(error);
  }

  revalidatePath("/admin/training");
  revalidatePath("/admin/training/categories");
  revalidatePath("/admin/training/courses");
  revalidatePath(`/admin/training/courses/${courseId}`);
  redirect(`/admin/training/courses/${courseId}`);
}

export async function batchTrainingCourseStatusAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await platformContext();
  const ids = batchIds(formData);
  const status = formData.get("batchAction");

  if (
    !ids ||
    (status !== "DRAFT" && status !== "PUBLISHED" && status !== "ARCHIVED")
  ) {
    return {
      ok: false,
      message: "Choose valid courses and a lifecycle status.",
    };
  }

  try {
    const result = await apiRequest<BatchMutationResult>(
      "/training/courses/batch-status",
      {
        method: "POST",
        token,
        body: JSON.stringify({ ids, status }),
      },
    );
    revalidatePath("/admin/training/courses");
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

function contentInput(formData: FormData) {
  const title = requiredKurdish(formData, "title", 250);
  const description = optionalLocalized(formData, "description", 2000);
  const status = formData.get("status");
  const order = sortOrder(formData);
  if (
    !title ||
    !description ||
    order === null ||
    (status !== "DRAFT" && status !== "PUBLISHED" && status !== "ARCHIVED")
  ) {
    return null;
  }
  return {
    title: title.fallback,
    titleTranslations: title.translations,
    description: description.fallback,
    descriptionTranslations: description.translations,
    status: status satisfies TrainingContentStatus,
    sortOrder: order,
  };
}

export async function createTrainingSectionAction(
  courseId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();
  const input = contentInput(formData);
  if (!input) return { message: "Enter valid training section information." };

  let section: TrainingSection;
  try {
    section = await apiRequest<TrainingSection>(
      `/training/courses/${encodeURIComponent(courseId)}/sections`,
      { method: "POST", token, body: JSON.stringify(input) },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath(`/admin/training/courses/${courseId}`);
  redirect(`/admin/training/courses/${courseId}/sections/${section.id}`);
}

export async function updateTrainingSectionAction(
  courseId: string,
  sectionId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();
  const input = contentInput(formData);
  if (!input) return { message: "Enter valid training section information." };

  try {
    await apiRequest<TrainingSection>(
      `/training/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}`,
      { method: "PATCH", token, body: JSON.stringify(input) },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath(`/admin/training/courses/${courseId}`);
  revalidatePath(`/admin/training/courses/${courseId}/sections/${sectionId}`);
  redirect(`/admin/training/courses/${courseId}/sections/${sectionId}`);
}

export async function createTrainingLessonAction(
  courseId: string,
  sectionId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();
  const input = contentInput(formData);
  if (!input) return { message: "Enter valid training lesson information." };

  let lesson: TrainingLesson;
  try {
    lesson = await apiRequest<TrainingLesson>(
      `/training/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}/lessons`,
      { method: "POST", token, body: JSON.stringify(input) },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath(`/admin/training/courses/${courseId}/sections/${sectionId}`);
  redirect(
    `/admin/training/courses/${courseId}/sections/${sectionId}/lessons/${lesson.id}`,
  );
}

export async function updateTrainingLessonAction(
  courseId: string,
  sectionId: string,
  lessonId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await platformContext();
  const input = contentInput(formData);
  if (!input) return { message: "Enter valid training lesson information." };

  try {
    await apiRequest<TrainingLesson>(
      `/training/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}/lessons/${encodeURIComponent(lessonId)}`,
      { method: "PATCH", token, body: JSON.stringify(input) },
    );
  } catch (error: unknown) {
    return failure(error);
  }

  revalidatePath(`/admin/training/courses/${courseId}/sections/${sectionId}`);
  revalidatePath(
    `/admin/training/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
  );
  redirect(
    `/admin/training/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
  );
}

export async function archiveTrainingCategoryRowAction(
  categoryId: string,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await platformContext();
  try {
    await apiRequest<TrainingCategory>(
      `/training/categories/${encodeURIComponent(categoryId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "INACTIVE" }),
      },
    );
    revalidatePath("/admin/training/categories");
    revalidatePath(`/admin/training/categories/${categoryId}`);
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failure(error).message ?? "The category could not be archived.",
    };
  }
}

export async function restoreTrainingCategoryRowAction(
  categoryId: string,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await platformContext();
  try {
    await apiRequest<TrainingCategory>(
      `/training/categories/${encodeURIComponent(categoryId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "ACTIVE" }),
      },
    );
    revalidatePath("/admin/training/categories");
    revalidatePath(`/admin/training/categories/${categoryId}`);
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failure(error).message ?? "The category could not be restored.",
    };
  }
}

export async function deleteTrainingCategoryRowAction(
  categoryId: string,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await platformContext();
  try {
    await apiRequest<{ success: true }>(
      `/training/categories/${encodeURIComponent(categoryId)}`,
      { method: "DELETE", token },
    );
    revalidatePath("/admin/training/categories");
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failure(error).message ?? "The category could not be deleted.",
    };
  }
}

export async function archiveTrainingCourseRowAction(
  courseId: string,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await platformContext();
  try {
    await apiRequest<TrainingCourse>(
      `/training/courses/${encodeURIComponent(courseId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "ARCHIVED" }),
      },
    );
    revalidatePath("/admin/training/courses");
    revalidatePath(`/admin/training/courses/${courseId}`);
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failure(error).message ?? "The course could not be archived.",
    };
  }
}

export async function restoreTrainingCourseRowAction(
  courseId: string,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await platformContext();
  try {
    await apiRequest<TrainingCourse>(
      `/training/courses/${encodeURIComponent(courseId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "DRAFT" }),
      },
    );
    revalidatePath("/admin/training/courses");
    revalidatePath(`/admin/training/courses/${courseId}`);
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failure(error).message ?? "The course could not be restored.",
    };
  }
}

export async function deleteTrainingCourseRowAction(
  courseId: string,
): Promise<{ ok: boolean; message: string }> {
  const { token } = await platformContext();
  try {
    await apiRequest<{ success: true }>(
      `/training/courses/${encodeURIComponent(courseId)}`,
      { method: "DELETE", token },
    );
    revalidatePath("/admin/training/courses");
    return { ok: true, message: "" };
  } catch (error: unknown) {
    return {
      ok: false,
      message: failure(error).message ?? "The course could not be deleted.",
    };
  }
}
