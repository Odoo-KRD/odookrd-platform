import type { KnowledgeArticlePage } from "@odookrd/types";
import { EmptyState } from "@odookrd/ui";
import Link from "next/link";

import { KnowledgeSearchBox } from "@/components/knowledge/knowledge-search-box";
import { apiRequest } from "@/lib/api";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeDictionaries } from "@/lib/i18n/knowledge";
import { getSessionToken } from "@/lib/session";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function KnowledgeSearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = typeof params.q === "string" ? params.q.slice(0, 250) : "";
  const query = rawQuery.trim();

  const [{ locale }, token] = await Promise.all([
    getDictionary(),
    getSessionToken(),
  ]);
  const labels = knowledgeDictionaries[locale];

  const results = query
    ? await apiRequest<KnowledgeArticlePage>(
        `/knowledge/search?q=${encodeURIComponent(query)}&limit=50`,
        { token: token ?? undefined },
      ).catch(() => null)
    : null;

  const items = results?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-content">
          {labels.searchTitle}
        </h1>
        <KnowledgeSearchBox
          placeholder={labels.searchPlaceholder}
          action={labels.searchAction}
          initialQuery={query}
          emptyLabel={labels.searchEmptyTitle}
        />
      </div>

      {!query ? (
        <EmptyState
          title={labels.searchPromptTitle}
          description={labels.searchPromptDescription}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={labels.searchEmptyTitle}
          description={labels.searchEmptyDescription}
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            {labels.searchResultsFor} “{query}” ({results?.pagination.total ?? 0})
          </p>
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
                  <p className="mt-1 text-xs text-muted">
                    {article.category.name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
