import { PERMISSIONS, type LocalizedRichText } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { notFound, redirect } from "next/navigation";

import { KnowledgeArticleForm } from "@/components/knowledge/knowledge-article-form";
import { KnowledgeRowActions } from "@/components/knowledge/knowledge-row-actions";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { adminTranslations } from "@/lib/i18n/admin/translations";
import { richTextToolbarDictionaries } from "@/lib/i18n/rich-text";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeAdminDictionaries } from "@/lib/i18n/knowledge-admin";

import { updateKnowledgeArticleAction } from "../../actions";
import {
  archiveKnowledgeArticleAction,
  deleteKnowledgeArticleRowAction,
  publishKnowledgeArticleAction,
  unpublishKnowledgeArticleAction,
} from "../../row-actions";
import {
  categoryPathOptions,
  type AdminCategory,
} from "../../categories/parent-options";

interface AdminArticleDetail {
  id: string;
  slug: string;
  categoryId: string;
  title: string;
  titleTranslations: Record<string, string>;
  excerpt: string | null;
  excerptTranslations: Record<string, string>;
  bodyTranslations: LocalizedRichText;
  tagsTranslations: Record<string, string[]>;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

interface ArticleComment {
  id: string;
  comment: string | null;
  createdAt: string;
  user: { id: string; email: string };
}

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKnowledgeArticlePage({
  params,
}: EditArticlePageProps) {
  const { id } = await params;
  const [{ session, token }, { locale }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.KNOWLEDGE_MANAGE),
    getDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const labels = knowledgeAdminDictionaries[locale];

  const [article, categories, comments] = await Promise.all([
    apiRequest<AdminArticleDetail>(
      `/knowledge/admin/articles/${encodeURIComponent(id)}`,
      { token },
    ).catch(() => null),
    apiRequest<AdminCategory[]>("/knowledge/admin/categories", { token }).catch(
      () => [] as AdminCategory[],
    ),
    apiRequest<ArticleComment[]>(
      `/knowledge/admin/articles/${encodeURIComponent(id)}/feedback`,
      { token },
    ).catch(() => [] as ArticleComment[]),
  ]);

  if (!article) {
    notFound();
  }

  const action = updateKnowledgeArticleAction.bind(null, article.id);

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.editArticle}
        description={article.title}
        actions={
          <KnowledgeRowActions
            id={article.id}
            status={article.status}
            editHref={`/admin/knowledge/articles/${article.id}`}
            labels={{
              edit: labels.articlesTitle,
              more: labels.more,
              publish: labels.publish,
              unpublish: labels.unpublish,
              archive: labels.archived,
              activate: labels.active,
              deactivate: labels.inactive,
              delete: labels.delete,
              deleteConfirm: labels.deleteConfirm,
            }}
            publishAction={publishKnowledgeArticleAction}
            unpublishAction={unpublishKnowledgeArticleAction}
            archiveAction={archiveKnowledgeArticleAction}
            deleteAction={deleteKnowledgeArticleRowAction}
          />
        }
      />
      <Panel className="p-5 sm:p-7">
        <KnowledgeArticleForm
          action={action}
          labels={labels}
          content={adminTranslations[locale].content}
          toolbar={richTextToolbarDictionaries[locale]}
          categories={categoryPathOptions(categories)}
          initial={{
            id: article.id,
            slug: article.slug,
            categoryId: article.categoryId,
            title: article.title,
            titleTranslations: article.titleTranslations,
            excerpt: article.excerpt,
            excerptTranslations: article.excerptTranslations,
            bodyTranslations: article.bodyTranslations,
            tagsTranslations: article.tagsTranslations,
            sortOrder: article.sortOrder,
            status: article.status,
          }}
          cancelHref="/admin/knowledge/articles"
        />
      </Panel>

      {/* Unhelpful answers that carried a comment. The counts say an article is
          failing; these say why, which is the only part you can act on. */}
      <Panel className="p-5 sm:p-7">
        <h2 className="text-sm font-semibold text-content">
          {labels.feedbackComments}
        </h2>

        {comments.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            {labels.feedbackCommentsEmpty}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {comments.map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="text-sm text-content">{entry.comment}</p>
                <p className="mt-1 text-xs text-muted">
                  {entry.user.email}
                  {" · "}
                  {new Date(entry.createdAt).toLocaleDateString(
                    locale === "en"
                      ? "en-GB"
                      : locale === "ar"
                        ? "ar-IQ"
                        : "ckb-IQ",
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
