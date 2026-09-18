"use server";

import { PERMISSIONS } from "@odookrd/types";
import { revalidatePath } from "next/cache";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";

interface ActionResult {
  ok: boolean;
  message: string;
}

/**
 * Row actions for AdminLifecycleRowActions, which calls them with an id and
 * expects { ok, message } rather than a form state.
 */
async function run(
  path: string,
  init: { method: string; body?: string },
): Promise<ActionResult> {
  try {
    const { token } = await getAdminApiContext(PERMISSIONS.KNOWLEDGE_MANAGE);

    await apiRequest(path, { token, ...init });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ApiRequestError
          ? error.message
          : "The request could not be completed.",
    };
  }

  revalidatePath("/admin/knowledge/categories");
  revalidatePath("/admin/knowledge/articles");

  return { ok: true, message: "" };
}

export async function deactivateKnowledgeCategoryAction(
  id: string,
): Promise<ActionResult> {
  return run(`/knowledge/admin/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "INACTIVE" }),
  });
}

export async function activateKnowledgeCategoryAction(
  id: string,
): Promise<ActionResult> {
  return run(`/knowledge/admin/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "ACTIVE" }),
  });
}

export async function deleteKnowledgeCategoryRowAction(
  id: string,
): Promise<ActionResult> {
  return run(`/knowledge/admin/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function archiveKnowledgeArticleAction(
  id: string,
): Promise<ActionResult> {
  return run(`/knowledge/admin/articles/${encodeURIComponent(id)}/archive`, {
    method: "POST",
  });
}

export async function publishKnowledgeArticleAction(
  id: string,
): Promise<ActionResult> {
  return run(`/knowledge/admin/articles/${encodeURIComponent(id)}/publish`, {
    method: "POST",
  });
}

export async function unpublishKnowledgeArticleAction(
  id: string,
): Promise<ActionResult> {
  return run(`/knowledge/admin/articles/${encodeURIComponent(id)}/unpublish`, {
    method: "POST",
  });
}

export async function deleteKnowledgeArticleRowAction(
  id: string,
): Promise<ActionResult> {
  return run(`/knowledge/admin/articles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  return values as string[];
}

/**
 * The API has no batch endpoint for the knowledge base, so a batch is applied
 * one row at a time and reported as a tally. Failures do not stop the run: with
 * mixed statuses selected, some rows legitimately cannot take the action.
 */
async function applyToEach(
  ids: string[],
  apply: (id: string) => Promise<ActionResult>,
): Promise<ActionResult> {
  let changed = 0;
  let failedCount = 0;

  for (const id of ids) {
    const result = await apply(id);

    if (result.ok) changed += 1;
    else failedCount += 1;
  }

  return {
    ok: failedCount === 0,
    message: `${changed} changed; ${failedCount} unchanged.`,
  };
}

export async function batchKnowledgeArticleAction(
  formData: FormData,
): Promise<ActionResult> {
  const ids = selectedBatchIds(formData);
  const action = formData.get("batchAction");

  if (!ids || typeof action !== "string") {
    return { ok: false, message: "Choose articles and an action." };
  }

  const handler =
    action === "PUBLISH"
      ? publishKnowledgeArticleAction
      : action === "UNPUBLISH"
        ? unpublishKnowledgeArticleAction
        : action === "ARCHIVE"
          ? archiveKnowledgeArticleAction
          : null;

  if (!handler) {
    return { ok: false, message: "Choose a valid action." };
  }

  return applyToEach(ids, handler);
}

export async function batchKnowledgeCategoryAction(
  formData: FormData,
): Promise<ActionResult> {
  const ids = selectedBatchIds(formData);
  const action = formData.get("batchAction");

  if (!ids || typeof action !== "string") {
    return { ok: false, message: "Choose categories and a status." };
  }

  const handler =
    action === "ACTIVE"
      ? activateKnowledgeCategoryAction
      : action === "INACTIVE"
        ? deactivateKnowledgeCategoryAction
        : null;

  if (!handler) {
    return { ok: false, message: "Choose a valid status." };
  }

  return applyToEach(ids, handler);
}

export async function reorderKnowledgeCategoriesAction(
  orderedIds: string[],
): Promise<ActionResult> {
  if (orderedIds.length === 0) {
    return { ok: true, message: "" };
  }

  return run("/knowledge/admin/categories/reorder", {
    method: "PATCH",
    body: JSON.stringify({ orderedIds }),
  });
}
