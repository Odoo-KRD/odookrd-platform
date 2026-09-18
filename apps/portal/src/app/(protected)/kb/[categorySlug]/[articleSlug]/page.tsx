import type { KnowledgeArticleDetail } from "@odookrd/types";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RichTextViewer } from "@/components/i18n/rich-text-viewer";
import { apiRequest } from "@/lib/api";
import { getTextDirection } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { knowledgeDictionaries } from "@/lib/i18n/knowledge";
import { getSessionToken } from "@/lib/session";

interface ArticlePageProps {
  params: Promise<{ categorySlug: string; articleSlug: string }>;
}

export default async function KnowledgeArticlePage({
  params,
}: ArticlePageProps) {
  const { articleSlug } = await params;
  const [{ locale }, token] = await Promise.all([
    getDictionary(),
    getSessionToken(),
  ]);
  const labels = knowledgeDictionaries[locale];

  // Article slugs are globally unique, so the category segment in the URL is
  // display context: a stale one still resolves the right article.
  const article = await apiRequest<KnowledgeArticleDetail>(
    `/knowledge/articles/${encodeURIComponent(articleSlug)}`,
    { token: token ?? undefined },
  ).catch(() => null);

  if (!article) {
    notFound();
  }

  const direction = getTextDirection(locale);

  return (
    <article className="w-full space-y-5">
      <nav aria-label={labels.browseTitle} className="text-xs">
        <ol className="flex flex-wrap items-center gap-1.5 text-muted">
          <li>
            <Link href="/kb" className="hover:text-content">
              {labels.title}
            </Link>
          </li>
          {article.breadcrumb.map((entry) => (
            <li key={entry.id} className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              <Link href={`/kb/${entry.slug}`} className="hover:text-content">
                {entry.name}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-content">{article.title}</h1>
        {article.excerpt ? (
          <p className="text-sm text-muted">{article.excerpt}</p>
        ) : null}
        <p className="text-xs text-muted">
          {labels.updatedAt}:{" "}
          {new Date(article.updatedAt).toLocaleDateString(
            locale === "en" ? "en-GB" : locale === "ar" ? "ar-IQ" : "ckb-IQ",
          )}
        </p>
      </header>

      {/* Article bodies carry content wider than the column -- tables pasted
          from documentation, screenshots, code blocks. Each of those scrolls
          inside the card; without this the whole page slides sideways, which in
          RTL pushes the text under the sidebar. */}
      <RichTextViewer
        document={article.body}
        dir={direction}
        className="max-w-full overflow-x-auto rounded-md border border-line bg-white p-5 text-content sm:p-7 [&_img]:h-auto [&_img]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:w-max [&_table]:max-w-full [&_table]:overflow-x-auto"
      />

      {article.tags.length > 0 ? (
        <footer className="space-y-2">
          <h2 className="text-xs font-semibold text-muted">
            {labels.tags}
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </article>
  );
}
