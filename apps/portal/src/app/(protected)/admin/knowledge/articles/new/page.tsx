import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { KnowledgeArticleForm } from "@/components/knowledge/knowledge-article-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { adminTranslations } from "@/lib/i18n/admin/translations";
import { richTextToolbarDictionaries } from "@/lib/i18n/rich-text";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeAdminDictionaries } from "@/lib/i18n/knowledge-admin";

import { createKnowledgeArticleAction } from "../../actions";
import {
  categoryPathOptions,
  type AdminCategory,
} from "../../categories/parent-options";

export default async function NewKnowledgeArticlePage() {
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

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.newArticle}
        description={labels.articlesDescription}
      />
      <Panel className="p-5 sm:p-7">
        <KnowledgeArticleForm
          action={createKnowledgeArticleAction}
          labels={labels}
          content={adminTranslations[locale].content}
          toolbar={richTextToolbarDictionaries[locale]}
          categories={categoryPathOptions(categories)}
          cancelHref="/admin/knowledge/articles"
        />
      </Panel>
    </div>
  );
}
