"use client";

import type { KnowledgeCategoryNode } from "@odookrd/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

/**
 * The knowledge base tree, up to three levels.
 *
 * Only the branch containing the current page is expanded; the rest stay
 * collapsed. A fully expanded tree stops being scannable somewhere around
 * thirty categories, and this one is meant to hold Odoo's documentation.
 *
 * Chevrons rotate toward the inline end, so the same component reads correctly
 * in both RTL and LTR without a direction prop.
 */
export function KnowledgeTree({
  categories,
  ariaLabel,
}: {
  categories: KnowledgeCategoryNode[];
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const activeSlug = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    // /kb/:categorySlug or /kb/:categorySlug/:articleSlug
    return segments[0] === "kb" ? (segments[1] ?? null) : null;
  }, [pathname]);

  return (
    <nav aria-label={ariaLabel} className="text-sm">
      <ul className="space-y-0.5">
        {categories.map((category) => (
          <TreeBranch
            key={category.id}
            category={category}
            activeSlug={activeSlug}
            depth={0}
          />
        ))}
      </ul>
    </nav>
  );
}

function containsSlug(
  category: KnowledgeCategoryNode,
  slug: string | null,
): boolean {
  if (!slug) return false;
  if (category.slug === slug) return true;

  return (category.children ?? []).some((child) =>
    containsSlug(child, slug),
  );
}

function TreeBranch({
  category,
  activeSlug,
  depth,
}: {
  category: KnowledgeCategoryNode;
  activeSlug: string | null;
  depth: number;
}) {
  const children = category.children ?? [];
  const onActivePath = containsSlug(category, activeSlug);
  const [expanded, setExpanded] = useState(onActivePath);
  const isActive = category.slug === activeSlug;
  const open = expanded || onActivePath;

  return (
    <li>
      <div
        className="flex items-center gap-1"
        style={{ paddingInlineStart: `${depth * 0.75}rem` }}
      >
        {children.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={open}
            aria-label={category.name}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-subtle"
          >
            <svg
              viewBox="0 0 24 24"
              className={`size-3.5 transition-transform ${
                open ? "rotate-90" : "rtl:-scale-x-100"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
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
          aria-current={isActive ? "page" : undefined}
          className={`flex-1 rounded px-2 py-1.5 ${
            isActive
              ? "bg-surface-subtle font-semibold text-content"
              : "text-muted hover:bg-surface-subtle hover:text-content"
          }`}
        >
          {category.name}
        </Link>
      </div>

      {open && children.length > 0 ? (
        <ul className="mt-0.5 space-y-0.5">
          {children.map((child) => (
            <TreeBranch
              key={child.id}
              category={child}
              activeSlug={activeSlug}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
