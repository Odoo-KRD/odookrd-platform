"use server";

import { PERMISSIONS, type LocalizedText } from "@odookrd/types";
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

/**
 * The base column is a fallback, not a fourth language: it takes whichever
 * translation the author actually filled in, preferring the tab they were last
 * editing, exactly as the training forms do.
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
  const value = formData.get(field);

  if (typeof value !== "string" || !value.trim()) return undefined;

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function createKnowledgeCategoryAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getAdminApiContext(PERMISSIONS.KNOWLEDGE_MANAGE);

  const nameTranslations = localized(formData, "name");
  const name = fallbackValue(formData, "name", nameTranslations);

  if (!name) {
    return { message: "A name is required." };
  }

  const descriptionTranslations = localized(formData, "description");

  try {
    await apiRequest("/knowledge/admin/categories", {
      token,
      method: "POST",
      body: JSON.stringify({
        name,
        nameTranslations,
        description:
          fallbackValue(formData, "description", descriptionTranslations) ??
          undefined,
        descriptionTranslations,
        parentId: optionalText(formData, "parentId"),
        slug: optionalText(formData, "slug"),
        status: optionalText(formData, "status"),
        sortOrder: optionalNumber(formData, "sortOrder"),
      }),
    });
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/knowledge/categories");
  redirect("/admin/knowledge/categories");
}

export async function updateKnowledgeCategoryAction(
  categoryId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getAdminApiContext(PERMISSIONS.KNOWLEDGE_MANAGE);

  const nameTranslations = localized(formData, "name");
  const name = fallbackValue(formData, "name", nameTranslations);

  if (!name) {
    return { message: "A name is required." };
  }

  const descriptionTranslations = localized(formData, "description");
  const parentId = optionalText(formData, "parentId");

  try {
    await apiRequest(
      `/knowledge/admin/categories/${encodeURIComponent(categoryId)}`,
      {
        token,
        method: "PATCH",
        body: JSON.stringify({
          name,
          nameTranslations,
          description:
            fallbackValue(formData, "description", descriptionTranslations) ??
            null,
          descriptionTranslations,
          // Absent means "move to the root", so null is sent deliberately.
          parentId: parentId ?? null,
          slug: optionalText(formData, "slug"),
          status: optionalText(formData, "status"),
          sortOrder: optionalNumber(formData, "sortOrder"),
        }),
      },
    );
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/knowledge/categories");
  redirect("/admin/knowledge/categories");
}

function localizedRichText(formData: FormData, field: string) {
  const result: Record<string, unknown> = {};

  for (const locale of locales) {
    const value = formData.get(`${field}.${locale}`);

    if (typeof value !== "string" || !value.trim()) continue;

    try {
      result[locale] = JSON.parse(value) as unknown;
    } catch {
      // A malformed editor payload is dropped rather than failing the save:
      // the other locales are still worth keeping.
    }
  }

  return result;
}

/** Comma-separated in the form, an array per locale on the wire. */
function localizedTags(formData: FormData, field: string) {
  const result: Record<string, string[]> = {};

  for (const locale of locales) {
    const value = formData.get(`${field}.${locale}`);

    if (typeof value !== "string" || !value.trim()) continue;

    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (tags.length > 0) {
      result[locale] = tags;
    }
  }

  return result;
}

export async function createKnowledgeArticleAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  // Creating lands on the article's own editor rather than the list: a new
  // article is always a draft, and publishing it is the next thing you want.
  const { token } = await getAdminApiContext(PERMISSIONS.KNOWLEDGE_MANAGE);

  const titleTranslations = localized(formData, "title");
  const title = fallbackValue(formData, "title", titleTranslations);
  const categoryId = optionalText(formData, "categoryId");

  if (!title) return { message: "A title is required." };
  if (!categoryId) return { message: "A category is required." };

  const excerptTranslations = localized(formData, "excerpt");

  let created: { id: string };

  try {
    created = await apiRequest<{ id: string }>("/knowledge/admin/articles", {
      token,
      method: "POST",
      body: JSON.stringify({
        categoryId,
        title,
        titleTranslations,
        excerpt:
          fallbackValue(formData, "excerpt", excerptTranslations) ?? undefined,
        excerptTranslations,
        bodyTranslations: localizedRichText(formData, "body"),
        tagsTranslations: localizedTags(formData, "tags"),
        slug: optionalText(formData, "slug"),
        sortOrder: optionalNumber(formData, "sortOrder"),
      }),
    });
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/knowledge/articles");
  redirect(`/admin/knowledge/articles/${created.id}`);
}

export async function updateKnowledgeArticleAction(
  articleId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { token } = await getAdminApiContext(PERMISSIONS.KNOWLEDGE_MANAGE);

  const titleTranslations = localized(formData, "title");
  const title = fallbackValue(formData, "title", titleTranslations);

  if (!title) return { message: "A title is required." };

  const excerptTranslations = localized(formData, "excerpt");

  try {
    await apiRequest(
      `/knowledge/admin/articles/${encodeURIComponent(articleId)}`,
      {
        token,
        method: "PATCH",
        body: JSON.stringify({
          categoryId: optionalText(formData, "categoryId"),
          title,
          titleTranslations,
          excerpt:
            fallbackValue(formData, "excerpt", excerptTranslations) ?? null,
          excerptTranslations,
          bodyTranslations: localizedRichText(formData, "body"),
          tagsTranslations: localizedTags(formData, "tags"),
          slug: optionalText(formData, "slug"),
          sortOrder: optionalNumber(formData, "sortOrder"),
        }),
      },
    );
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/admin/knowledge/articles");
  redirect("/admin/knowledge/articles");
}
