"use client";

import type { KnowledgeCategoryNode } from "@odookrd/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

export interface KnowledgeTreeArticle {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
}

/**
 * The knowledge base navigation tree: categories three deep, with each
 * category's articles as leaves beneath it -- the shape Odoo's own docs
 * sidebar uses, where a page and a section sit in the same list.
 *
 * Only the branch containing the current page is expanded. A tree that opens
 * everything stops being scannable once there are a few dozen entries.
 *
 * Chevrons rotate toward the inline end, so one component serves RTL and LTR.
 */
export function KnowledgeTree({
  categories,
  articles,
  ariaLabel,
}: {
  categories: KnowledgeCategoryNode[];
  articles: KnowledgeTreeArticle[];
  ariaLabel: string;
}) {
  const pathname = usePathname();

  const { activeCategorySlug, activeArticleSlug } = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    if (segments[0] !== "kb") {
      return { activeCategorySlug: null, activeArticleSlug: null };
    }

    return {
      activeCategorySlug: segments[1] ?? null,
      activeArticleSlug: segments[2] ?? null,
    };
  }, [pathname]);

  const byCategory = useMemo(() => {
    const map = new Map<string, KnowledgeTreeArticle[]>();

    for (const article of articles) {
      map.set(article.categoryId, [
        ...(map.get(article.categoryId) ?? []),
        article,
      ]);
    }

    return map;
  }, [articles]);

  return (
    <nav aria-label={ariaLabel} className="text-sm">
      <ul>
        {categories.map((category) => (
          <TreeBranch
            key={category.id}
            category={category}
            articles={byCategory}
            activeCategorySlug={activeCategorySlug}
            activeArticleSlug={activeArticleSlug}
            depth={0}
          />
        ))}
      </ul>
    </nav>
  );
}

function branchContainsActive(
  category: KnowledgeCategoryNode,
  slug: string | null,
): boolean {
  if (!slug) return false;
  if (category.slug === slug) return true;

  return (category.children ?? []).some((child) =>
    branchContainsActive(child, slug),
  );
}

function TreeBranch({
  category,
  articles,
  activeCategorySlug,
  activeArticleSlug,
  depth,
}: {
  category: KnowledgeCategoryNode;
  articles: Map<string, KnowledgeTreeArticle[]>;
  activeCategorySlug: string | null;
  activeArticleSlug: string | null;
  depth: number;
}) {
  const children = category.children ?? [];
  const ownArticles = articles.get(category.id) ?? [];
  const expandable = children.length > 0 || ownArticles.length > 0;
  const onActivePath = branchContainsActive(category, activeCategorySlug);

  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(null);
  const open = expandedOverride ?? onActivePath;

  const isCurrent = category.slug === activeCategorySlug && !activeArticleSlug;
  const indent = `${0.5 + depth * 0.85}rem`;

  return (
    <li>
      <div className="flex items-center" style={{ paddingInlineStart: indent }}>
        {expandable ? (
          <button
            type="button"
            onClick={() => setExpandedOverride(!open)}
            aria-expanded={open}
            aria-label={category.name}
            className="flex size-5 shrink-0 items-center justify-center text-muted hover:text-content"
          >
            <svg
              viewBox="0 0 24 24"
              className={`size-3 transition-transform ${
                open ? "rotate-90" : "rtl:-scale-x-100"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        ) : (
          <span className="size-5 shrink-0" aria-hidden />
        )}

        <Link
          href={`/kb/${category.slug}`}
          aria-current={isCurrent ? "page" : undefined}
          className={`flex-1 truncate rounded px-1.5 py-1.5 ${
            isCurrent
              ? "font-semibold text-brand"
              : "text-content hover:text-brand"
          }`}
        >
          {category.name}
        </Link>
      </div>

      {open ? (
        <ul>
          {children.map((child) => (
            <TreeBranch
              key={child.id}
              category={child}
              articles={articles}
              activeCategorySlug={activeCategorySlug}
              activeArticleSlug={activeArticleSlug}
              depth={depth + 1}
            />
          ))}

          {ownArticles.map((article) => {
            const current = article.slug === activeArticleSlug;

            return (
              <li key={article.id}>
                <Link
                  href={`/kb/${category.slug}/${article.slug}`}
                  aria-current={current ? "page" : undefined}
                  style={{ paddingInlineStart: `${1.75 + depth * 0.85}rem` }}
                  className={`block truncate rounded py-1.5 pe-1.5 text-[13px] ${
                    current
                      ? "font-semibold text-brand"
                      : "text-muted hover:text-brand"
                  }`}
                >
                  {article.title}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}
