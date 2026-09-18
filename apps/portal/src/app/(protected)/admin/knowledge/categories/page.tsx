import { PERMISSIONS } from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { KnowledgeCategoryTree } from "@/components/knowledge/knowledge-category-tree";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeAdminDictionaries } from "@/lib/i18n/knowledge-admin";

import {
  activateKnowledgeCategoryAction,
  deactivateKnowledgeCategoryAction,
  deleteKnowledgeCategoryRowAction,
  reorderKnowledgeCategoriesAction,
} from "../row-actions";
import { orderCategories, type AdminCategory } from "./parent-options";

export default async function KnowledgeCategoriesPage() {
  const [{ session, token }, { locale }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.KNOWLEDGE_MANAGE),
    getDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const labels = knowledgeAdminDictionaries[locale];
  const categories = await apiRequest<AdminCategory[]>(
    "/knowledge/admin/categories",
    { token },
  ).catch(() => [] as AdminCategory[]);

  const rows = orderCategories(categories).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
    depth: category.depth,
    status: category.status,
    articles: category._count.articles,
    children: category._count.children,
  }));

  const createLink = (
    <Link
      href="/admin/knowledge/categories/new"
      className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
    >
      {labels.newCategory}
    </Link>
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.categoriesTitle}
        description={labels.categoriesDescription}
        actions={createLink}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={labels.emptyTitle}
          description={labels.emptyDescription}
          action={createLink}
        />
      ) : (
        <Panel className="p-4 sm:p-5">
          <KnowledgeCategoryTree
            categories={rows}
            labels={{
              edit: labels.edit,
              more: labels.more,
              activate: labels.activate,
              deactivate: labels.deactivate,
              delete: labels.delete,
              deleteConfirm: labels.deleteConfirm,
              articleCount: labels.articleCount,
              inactive: labels.inactive,
              dragHint: labels.reorderHint,
              saving: labels.saving,
              saved: labels.reorderSaved,
              newSubcategory: labels.newCategory,
            }}
            reorderAction={reorderKnowledgeCategoriesAction}
            activateAction={activateKnowledgeCategoryAction}
            deactivateAction={deactivateKnowledgeCategoryAction}
            deleteAction={deleteKnowledgeCategoryRowAction}
          />
        </Panel>
      )}
    </div>
  );
}
