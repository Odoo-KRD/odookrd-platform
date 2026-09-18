import type {
  KnowledgeArticlePage,
  KnowledgeCategoryNode,
} from "@odookrd/types";
import { EmptyState } from "@odookrd/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeDictionaries } from "@/lib/i18n/knowledge";
import { getSessionToken } from "@/lib/session";

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

function findCategory(
  categories: KnowledgeCategoryNode[],
  slug: string,
): KnowledgeCategoryNode | null {
  for (const category of categories) {
    if (category.slug === slug) {
      return category;
    }

    const found = findCategory(category.children ?? [], slug);
    if (found) {
      return found;
    }
  }

  return null;
}

export default async function KnowledgeCategoryPage({
  params,
}: CategoryPageProps) {
  const { categorySlug } = await params;
  const [{ locale }, token] = await Promise.all([
    getDictionary(),
    getSessionToken(),
  ]);
  const labels = knowledgeDictionaries[locale];

  // The tree is already the source of truth for category metadata, so the page
  // resolves the slug from it rather than asking the API for one category.
  const [categories, articles] = await Promise.all([
    apiRequest<KnowledgeCategoryNode[]>("/knowledge/categories", {
      token: token ?? undefined,
    }).catch(() => [] as KnowledgeCategoryNode[]),
    apiRequest<KnowledgeArticlePage>(
      `/knowledge/articles?categorySlug=${encodeURIComponent(categorySlug)}&limit=100`,
      { token: token ?? undefined },
    ).catch(() => null),
  ]);

  const category = findCategory(categories, categorySlug);

  if (!category) {
    notFound();
  }

  const children = category.children ?? [];
  const items = articles?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-content">{category.name}</h1>
        {category.description ? (
          <p className="text-sm text-muted">{category.description}</p>
        ) : null}
      </div>

      {children.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted">
            {labels.categories}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/kb/${child.slug}`}
                  className="block h-full rounded-md border border-line bg-white p-4 hover:border-brand"
                >
                  <p className="font-medium text-content">{child.name}</p>
                  {child.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {child.description}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">
          {labels.articles}
        </h2>

        {items.length === 0 ? (
          <EmptyState
            title={labels.noArticlesTitle}
            description={labels.noArticlesDescription}
          />
        ) : (
          <ul className="divide-y divide-line rounded-md border border-line bg-white">
            {items.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/kb/${article.category.slug}/${article.slug}`}
                  className="block px-4 py-3 hover:bg-surface-subtle"
                >
                  <p className="font-medium text-content">{article.title}</p>
                  {article.excerpt ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                      {article.excerpt}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
