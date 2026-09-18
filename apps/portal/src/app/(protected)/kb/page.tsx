import type { KnowledgeCategoryNode } from "@odookrd/types";
import { EmptyState } from "@odookrd/ui";
import Link from "next/link";

import { apiRequest } from "@/lib/api";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeDictionaries } from "@/lib/i18n/knowledge";
import { getSessionToken } from "@/lib/session";

export default async function KnowledgeHomePage() {
  const [{ locale }, token] = await Promise.all([
    getDictionary(),
    getSessionToken(),
  ]);
  const labels = knowledgeDictionaries[locale];

  const categories = await apiRequest<KnowledgeCategoryNode[]>(
    "/knowledge/categories",
    { token: token ?? undefined },
  ).catch(() => [] as KnowledgeCategoryNode[]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-content">{labels.title}</h1>
        <p className="text-sm text-muted">{labels.description}</p>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title={labels.noCategoriesTitle}
          description={labels.noCategoriesDescription}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/kb/${category.slug}`}
                className="block h-full rounded-md border border-line bg-white p-4 hover:border-brand"
              >
                <p className="font-medium text-content">{category.name}</p>
                {category.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {category.description}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-muted">
                  {countArticles(category)} {labels.articleCount}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A section's headline number includes everything beneath it. */
function countArticles(category: KnowledgeCategoryNode): number {
  return (
    category.articleCount +
    (category.children ?? []).reduce(
      (total, child) => total + countArticles(child),
      0,
    )
  );
}
