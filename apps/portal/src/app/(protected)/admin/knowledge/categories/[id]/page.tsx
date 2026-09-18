import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { notFound, redirect } from "next/navigation";

import { KnowledgeCategoryForm } from "@/components/knowledge/knowledge-category-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { adminTranslations } from "@/lib/i18n/admin/translations";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeAdminDictionaries } from "@/lib/i18n/knowledge-admin";

import { updateKnowledgeCategoryAction } from "../../actions";
import { parentOptions, type AdminCategory } from "../parent-options";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKnowledgeCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
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

  const category = categories.find((entry) => entry.id === id);

  if (!category) {
    notFound();
  }

  // The action needs the id, which a form action signature cannot carry.
  const action = updateKnowledgeCategoryAction.bind(null, category.id);

  return (
    <div className="grid gap-7">
      <PageHeading title={labels.editCategory} description={category.name} />
      <Panel className="p-5 sm:p-7">
        <KnowledgeCategoryForm
          action={action}
          labels={labels}
          content={adminTranslations[locale].content}
          parents={parentOptions(categories, category.id)}
          initial={{
            id: category.id,
            slug: category.slug,
            parentId: category.parentId,
            name: category.name,
            nameTranslations: category.nameTranslations,
            description: category.description,
            descriptionTranslations: category.descriptionTranslations,
            status: category.status,
            sortOrder: category.sortOrder,
          }}
          cancelHref="/admin/knowledge/categories"
        />
      </Panel>
    </div>
  );
}
