"use client";

import type { KnowledgeCategoryNode } from "@odookrd/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

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

  // Held here, not per branch: a branch the reader opened stays open when they
  // navigate, and opening one never collapses its siblings. This is a
  // documentation tree, not an accordion.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

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
            overrides={overrides}
            setOverrides={setOverrides}
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
  overrides,
  setOverrides,
}: {
  category: KnowledgeCategoryNode;
  articles: Map<string, KnowledgeTreeArticle[]>;
  activeCategorySlug: string | null;
  activeArticleSlug: string | null;
  depth: number;
  overrides: Record<string, boolean>;
  setOverrides: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
  const children = category.children ?? [];
  const ownArticles = articles.get(category.id) ?? [];
  const expandable = children.length > 0 || ownArticles.length > 0;
  const onActivePath = branchContainsActive(category, activeCategorySlug);

  const open = overrides[category.id] ?? onActivePath;

  const isCurrent = category.slug === activeCategorySlug && !activeArticleSlug;
  const indent = `${0.25 + depth}rem`;

  return (
    <li>
      <div className="flex items-center" style={{ paddingInlineStart: indent }}>
        {expandable ? (
          <button
            type="button"
            onClick={() =>
              setOverrides((current) => ({
                ...current,
                [category.id]: !open,
              }))
            }
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
        ) : null}

        <Link
          href={`/kb/${category.slug}`}
          aria-current={isCurrent ? "page" : undefined}
          className={`flex-1 truncate rounded px-2 py-2 leading-6 ${
            isCurrent
              ? "bg-brand font-semibold text-white"
              : "text-content hover:bg-surface-subtle hover:text-brand"
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
              overrides={overrides}
              setOverrides={setOverrides}
            />
          ))}

          {ownArticles.map((article) => {
            const current = article.slug === activeArticleSlug;

            return (
              <li key={article.id}>
                <div style={{ paddingInlineStart: `${1.5 + depth}rem` }}>
                  <Link
                    href={`/kb/${category.slug}/${article.slug}`}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center gap-2 rounded px-2 py-2 text-[13px] leading-6 ${
                      current
                        ? "bg-brand font-semibold text-white"
                        : "text-muted hover:bg-surface-subtle hover:text-content"
                    }`}
                  >
                    <ArticleIcon />
                    <span className="min-w-0 truncate">{article.title}</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

/** Marks a leaf as an article rather than a category. */
function ArticleIcon() {
  return (
    <svg
      viewBox="0 0 640 640"
      className="size-3.5 shrink-0 opacity-70"
      fill="currentColor"
      aria-hidden
    >
      <path d="M98.91,25h442.19v590H98.91V25ZM486.31,320.08c0-78.07,0-156.14,0-234.21q0-5.97-5.97-5.97c-106.92,0-213.84,0-320.75,0q-5.97,0-5.97,5.98c0,156.14,0,312.28,0,468.42q0,5.97,5.97,5.97c106.92,0,213.84,0,320.75,0q5.97,0,5.97-5.98c0-78.07,0-156.14,0-234.21Z" />
      <path d="M209.54,227.3v-54.51h220.78v54.51h-220.78Z" />
      <path d="M209.54,338.06v-54.51h220.78v54.51h-220.78Z" />
      <path d="M209.54,448.81v-54.51h110.03v54.51h-110.03Z" />
    </svg>
  );
}
