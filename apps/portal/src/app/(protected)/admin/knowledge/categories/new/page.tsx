import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { KnowledgeCategoryForm } from "@/components/knowledge/knowledge-category-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { adminTranslations } from "@/lib/i18n/admin/translations";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeAdminDictionaries } from "@/lib/i18n/knowledge-admin";

import { createKnowledgeCategoryAction } from "../../actions";
import { parentOptions, type AdminCategory } from "../parent-options";

interface NewCategoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewKnowledgeCategoryPage({
  searchParams,
}: NewCategoryPageProps) {
  const [{ session, token }, { locale }, parameters] = await Promise.all([
    getAdminApiContext(PERMISSIONS.KNOWLEDGE_MANAGE),
    getDictionary(),
    searchParams,
  ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const labels = knowledgeAdminDictionaries[locale];
  const categories = await apiRequest<AdminCategory[]>(
    "/knowledge/admin/categories",
    { token },
  ).catch(() => [] as AdminCategory[]);

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.newCategory}
        description={labels.categoriesDescription}
      />
      <Panel className="p-5 sm:p-7">
        <KnowledgeCategoryForm
          action={createKnowledgeCategoryAction}
          labels={labels}
          content={adminTranslations[locale].content}
          parents={parentOptions(categories)}
          initialParentId={
            typeof parameters.parentId === "string"
              ? parameters.parentId
              : undefined
          }
          cancelHref="/admin/knowledge/categories"
        />
      </Panel>
    </div>
  );
}
