"use client";

import type { KnowledgeArticleListItem } from "@odookrd/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Search box with a live results dropdown.
 *
 * Queries are debounced and need two characters, so typing a word costs one
 * request rather than one per keystroke. Each request aborts the one before it,
 * so a fast typist never has an early response overwrite a later one. Enter
 * still goes to the full results page, which is rankable, linkable and paged.
 */
export function KnowledgeSearchBox({
  placeholder,
  action,
  initialQuery = "",
  emptyLabel,
}: {
  placeholder: string;
  action: string;
  initialQuery?: string;
  emptyLabel: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [results, setResults] = useState<KnowledgeArticleListItem[] | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = value.trim();

    // Clearing lives in the change handler: setState in an effect body causes
    // cascading renders, and an empty box is an event, not a synchronisation.
    if (term.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/knowledge/search?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { items: [] }))
        .then((page: { items?: KnowledgeArticleListItem[] }) => {
          setResults(page.items ?? []);
          setOpen(true);
        })
        .catch(() => {
          /* aborted or offline: keep the previous results */
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const submit = () => {
    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    setOpen(false);
    router.push(`/kb/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex w-full items-center gap-2">
        <input
          type="search"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);

            if (next.trim().length < 2) {
              setResults(null);
              setOpen(false);
            }
          }}
          onFocus={() => setOpen(Boolean(results))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-content outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={submit}
          className="shrink-0 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {action}
        </button>
      </div>

      {open && results ? (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-line bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">{emptyLabel}</p>
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {results.map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/kb/${article.category.slug}/${article.slug}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 hover:bg-surface-subtle"
                  >
                    <p className="text-sm font-medium text-content">
                      {article.title}
                    </p>
                    <p className="text-xs text-muted">
                      {article.category.name}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
