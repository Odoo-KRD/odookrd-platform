import { PERMISSIONS, type Pagination } from "@odookrd/types";
import { EmptyState, PageHeading } from "@odookrd/ui";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AdminDataTable,
  type AdminDataTableRow,
  type AdminTableTone,
} from "@/components/admin/admin-data-table";
import { KnowledgeRowActions } from "@/components/knowledge/knowledge-row-actions";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeAdminDictionaries } from "@/lib/i18n/knowledge-admin";

import {
  archiveKnowledgeArticleAction,
  batchKnowledgeArticleAction,
  deleteKnowledgeArticleRowAction,
  publishKnowledgeArticleAction,
  unpublishKnowledgeArticleAction,
} from "../row-actions";
import { orderCategories, type AdminCategory } from "../categories/parent-options";

type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface AdminArticle {
  id: string;
  slug: string;
  categoryId: string;
  title: string;
  status: ArticleStatus;
  publishedAt: string | null;
  sortOrder: number;
  updatedAt: string;
}

interface ArticlesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const statuses: ArticleStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const pageSize = 20;

function selectedStatus(
  value: string | string[] | undefined,
): ArticleStatus | null {
  return typeof value === "string" && statuses.includes(value as ArticleStatus)
    ? (value as ArticleStatus)
    : null;
}

function selectedOffset(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function selectedText(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

export default async function KnowledgeArticlesPage({
  searchParams,
}: ArticlesPageProps) {
  const [{ session, token }, { locale }, parameters] = await Promise.all([
    getAdminApiContext(PERMISSIONS.KNOWLEDGE_MANAGE),
    getDictionary(),
    searchParams,
  ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const labels = knowledgeAdminDictionaries[locale];

  const status = selectedStatus(parameters.status);
  const search = selectedText(parameters.search);
  const categoryId = selectedText(parameters.categoryId);
  const offset = selectedOffset(parameters.offset);

  const query = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });
  if (status) query.set("status", status);
  if (search) query.set("search", search);
  if (categoryId) query.set("categoryId", categoryId);

  const [result, categories] = await Promise.all([
    apiRequest<{ items: AdminArticle[]; pagination: Pagination }>(
      `/knowledge/admin/articles?${query.toString()}`,
      { token },
    ).catch(() => ({
      items: [] as AdminArticle[],
      pagination: { limit: pageSize, offset: 0, total: 0 },
    })),
    apiRequest<AdminCategory[]>("/knowledge/admin/categories", { token }).catch(
      () => [] as AdminCategory[],
    ),
  ]);

  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  const statusLabel: Record<ArticleStatus, string> = {
    DRAFT: labels.draft,
    PUBLISHED: labels.published,
    ARCHIVED: labels.archived,
  };
  const statusTone: Record<ArticleStatus, AdminTableTone> = {
    DRAFT: "warning",
    PUBLISHED: "success",
    ARCHIVED: "neutral",
  };

  const rows: AdminDataTableRow[] = result.items.map((article) => ({
    id: article.id,
    searchText: `${article.title} ${article.slug}`,
    cells: {
      title: { type: "text", value: article.title, emphasis: true },
      category: {
        type: "text",
        value: categoryNames.get(article.categoryId) ?? "",
        muted: true,
      },
      slug: { type: "text", value: article.slug, dir: "ltr", muted: true },
      status: {
        type: "badge",
        label: statusLabel[article.status],
        tone: statusTone[article.status],
      },
      publishedAt: {
        type: "text",
        value: article.publishedAt
          ? new Date(article.publishedAt).toLocaleDateString(
              locale === "en" ? "en-GB" : locale === "ar" ? "ar-IQ" : "ckb-IQ",
            )
          : "—",
        muted: true,
      },
      actions: {
        type: "node",
        value: (
          <KnowledgeRowActions
            id={article.id}
            status={article.status}
            editHref={`/admin/knowledge/articles/${article.id}`}
            labels={{
              edit: labels.edit,
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
        ),
      },
    },
  }));

  const createLink = (
    <Link
      href="/admin/knowledge/articles/new"
      className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
    >
      {labels.newArticle}
    </Link>
  );

  const toolbar = (
    <Form action="/admin/knowledge/articles" className="flex flex-wrap items-center gap-2">
      <input
        name="search"
        type="search"
        defaultValue={search}
        maxLength={200}
        placeholder={labels.searchArticles}
        className="h-9 min-w-52 rounded-md border border-slate-300 bg-white px-3 text-sm"
      />
      <select
        name="status"
        defaultValue={status ?? ""}
        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs"
      >
        <option value="">{labels.allStatuses}</option>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {statusLabel[item]}
          </option>
        ))}
      </select>
      <select
        name="categoryId"
        defaultValue={categoryId}
        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs"
      >
        <option value="">{labels.allCategories}</option>
        {orderCategories(categories).map((category) => (
          <option key={category.id} value={category.id}>
            {"\u00A0".repeat(category.depth * 4)}
            {category.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-9 rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand-hover"
      >
        {labels.search}
      </button>
    </Form>
  );

  const hasMore =
    result.pagination.offset + result.items.length < result.pagination.total;

  const footer =
    result.pagination.total > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {result.pagination.total} {labels.records}
        </p>
        <div className="flex items-center gap-2">
          {result.pagination.offset > 0 ? (
            <Link
              href={`/admin/knowledge/articles?offset=${Math.max(
                0,
                result.pagination.offset - pageSize,
              )}`}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-subtle"
            >
              {labels.previous}
            </Link>
          ) : null}
          {hasMore ? (
            <Link
              href={`/admin/knowledge/articles?offset=${
                result.pagination.offset + pageSize
              }`}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-subtle"
            >
              {labels.next}
            </Link>
          ) : null}
        </div>
      </div>
    ) : null;

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.articlesTitle}
        description={labels.articlesDescription}
        actions={createLink}
      />

      <AdminDataTable
        locale={locale}
        columns={[
          { key: "title", label: labels.title },
          { key: "category", label: labels.category },
          { key: "slug", label: labels.slug },
          { key: "status", label: labels.status },
          { key: "publishedAt", label: labels.publishedAt },
          { key: "actions", label: labels.actions },
        ]}
        rows={rows}
        labels={adminTableDictionaries[locale]}
        selectable
        searchEnabled={false}
        batchAction={batchKnowledgeArticleAction}
        batchActions={[
          { value: "PUBLISH", label: labels.publish },
          { value: "UNPUBLISH", label: labels.unpublish },
          { value: "ARCHIVE", label: labels.archived, tone: "danger" },
        ]}
        toolbar={toolbar}
        footer={footer}
        empty={
          <EmptyState
            title={labels.noArticlesTitle}
            description={labels.noArticlesDescription}
            action={createLink}
          />
        }
      />
    </div>
  );
}
