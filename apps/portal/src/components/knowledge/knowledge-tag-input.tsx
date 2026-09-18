"use client";

import { useRef, useState } from "react";

/**
 * Tag entry as chips. A tag is committed on comma, Arabic comma, Enter or blur;
 * backspace on an empty field removes the last one.
 *
 * The committed tags are mirrored into a hidden input as a comma-separated
 * string, which is what the server action parses -- so the widget is presentation
 * only and the form contract stays plain text.
 */
export function KnowledgeTagInput({
  name,
  label,
  initial = [],
  placeholder,
}: {
  name: string;
  label: string;
  initial?: string[];
  placeholder?: string;
}) {
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const candidates = raw
      .split(/[,\u060C]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (candidates.length === 0) return;

    setTags((current) => {
      const next = [...current];

      for (const candidate of candidates) {
        const duplicate = next.some(
          (tag) => tag.toLocaleLowerCase() === candidate.toLocaleLowerCase(),
        );

        if (!duplicate) next.push(candidate);
      }

      return next;
    });
    setDraft("");
  };

  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>

      <input type="hidden" name={name} value={tags.join(",")} />

      <div
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-line bg-surface-panel px-2 py-1.5 focus-within:border-brand"
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand"
          >
            {tag}
            <button
              type="button"
              onClick={() =>
                setTags((current) => current.filter((item) => item !== tag))
              }
              aria-label={`${tag} ✕`}
              className="text-brand hover:text-brand-hover"
            >
              ✕
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={draft}
          placeholder={tags.length === 0 ? placeholder : undefined}
          onChange={(event) => {
            const value = event.target.value;

            if (/[,\u060C]/.test(value)) {
              commit(value);
              return;
            }

            setDraft(value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
              return;
            }

            if (event.key === "Backspace" && !draft && tags.length > 0) {
              setTags((current) => current.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
          className="min-w-24 flex-1 bg-transparent text-sm text-content outline-none"
        />
      </div>
    </div>
  );
}
