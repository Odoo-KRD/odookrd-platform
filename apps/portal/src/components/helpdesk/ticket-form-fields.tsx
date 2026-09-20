"use client";

import { TICKET_PRIORITIES, type TicketPriority } from "@odookrd/types";
import { useEffect, useId, useRef, useState } from "react";

import type { HelpdeskDictionary } from "@/lib/i18n/helpdesk";

import { TicketPriorityIndicator } from "./ticket-visuals";

/** Shared look for every select and text field on the helpdesk forms. */
export const helpdeskFieldClass =
  "w-full rounded-md border border-line bg-white px-3 text-sm text-content outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:bg-surface-subtle";

export const helpdeskSelectClass = `h-11 ${helpdeskFieldClass}`;

/** One field's width: two of them plus the gap match the wide service field. */
export const helpdeskFieldWidth = "w-full sm:w-72";

export interface TicketServiceOption {
  id: string;
  label: string;
}

export function FieldLabel({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // content-start: without it the grid stretches its rows to match a taller
    // neighbour, which shifts this field's control down by a few pixels.
    <label className={`grid content-start gap-2 ${className ?? ""}`}>
      <span className="text-sm font-semibold text-content">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function DepartmentSelect({
  departments,
  labels,
  disabled,
}: {
  departments: Array<{ id: string; name: string }>;
  labels: HelpdeskDictionary;
  disabled?: boolean;
}) {
  return (
    <FieldLabel label={labels.department} className={helpdeskFieldWidth}>
      <select
        name="departmentId"
        required
        defaultValue=""
        disabled={disabled}
        className={helpdeskSelectClass}
      >
        <option value="" disabled>
          {labels.departmentPlaceholder}
        </option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
    </FieldLabel>
  );
}

/**
 * Priority as a small listbox rather than a native select: a native <option>
 * cannot hold an SVG, and the field should show the same bar meter the ticket
 * list uses. The chosen value travels in a hidden input, so the form submits
 * exactly as it would with a <select>.
 */
export function PrioritySelect({
  labels,
  disabled,
}: {
  labels: HelpdeskDictionary;
  disabled?: boolean;
}) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<TicketPriority>("NORMAL");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`grid content-start gap-2 ${helpdeskFieldWidth}`}>
      <span className="text-sm font-semibold text-content">
        {labels.priority}
      </span>

      <div ref={containerRef} className="relative">
        <input type="hidden" name="priority" value={value} />
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
          className={`flex h-11 w-full items-center justify-between gap-2 rounded-md border border-line bg-white px-3 text-start text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:bg-surface-subtle ${
            open ? "border-brand" : ""
          }`}
        >
          <TicketPriorityIndicator
            priority={value}
            labels={labels.priorities}
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`size-4 shrink-0 text-muted transition ${open ? "-rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="m5 8 5 5 5-5" />
          </svg>
        </button>

        {open ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-line bg-white py-1 shadow-lg"
          >
            {TICKET_PRIORITIES.map((priority) => (
              <li key={priority}>
                <button
                  type="button"
                  role="option"
                  aria-selected={priority === value}
                  onClick={() => {
                    setValue(priority);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-start transition hover:bg-surface-subtle ${
                    priority === value ? "bg-brand-soft" : ""
                  }`}
                >
                  <TicketPriorityIndicator
                    priority={priority}
                    labels={labels.priorities}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <span className="text-xs text-muted">{labels.priorityHint}</span>
    </div>
  );
}

export function RelatedServiceSelect({
  services,
  labels,
  disabled,
}: {
  services: TicketServiceOption[];
  labels: HelpdeskDictionary;
  disabled?: boolean;
}) {
  return (
    <FieldLabel
      label={labels.relatedService}
      hint={services.length > 0 ? labels.relatedServiceHint : labels.noServices}
      className="w-full sm:w-[37rem]"
    >
      <select
        name="companyServiceId"
        defaultValue=""
        disabled={disabled || services.length === 0}
        className={helpdeskSelectClass}
      >
        <option value="">{labels.relatedServiceNone}</option>
        {services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.label}
          </option>
        ))}
      </select>
    </FieldLabel>
  );
}

/** Counts down the characters left, so the API's limit is never a surprise. */
export function CharacterCount({
  value,
  max,
  labels,
}: {
  value: number;
  max: number;
  labels: HelpdeskDictionary;
}) {
  const left = max - value;

  if (left > max * 0.2) {
    return null;
  }

  return (
    <span className={`text-xs ${left <= 0 ? "text-red-700" : "text-muted"}`}>
      {labels.charactersLeft.replace("{count}", String(Math.max(left, 0)))}
    </span>
  );
}

interface Suggestion {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: { slug: string };
}

/**
 * Knowledge-base articles matching the subject as it is typed, through the
 * existing /api/knowledge/search proxy. Deflecting a ticket the customer can
 * answer themselves is the cheapest support there is; it never blocks the form.
 */
export function KnowledgeSuggestions({
  subject,
  labels,
}: {
  subject: string;
  labels: HelpdeskDictionary;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const dismissed = useRef(false);

  useEffect(() => {
    const term = subject.trim();

    if (term.length < 4 || dismissed.current) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/knowledge/search?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { items: [] }))
        .then((page: { items?: Suggestion[] }) => {
          setItems((page.items ?? []).slice(0, 3));
        })
        .catch(() => {
          /* aborted or offline: keep whatever is on screen */
        });
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [subject]);

  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-lg border border-brand/20 bg-brand-soft px-4 py-3">
      <p className="text-sm font-semibold text-content">
        {labels.suggestionsTitle}
      </p>
      <p className="mt-0.5 text-xs text-muted">{labels.suggestionsHint}</p>
      <ul className="mt-2.5 grid gap-1.5">
        {items.map((article) => (
          <li key={article.id}>
            <a
              href={`/kb/${encodeURIComponent(article.category.slug)}/${encodeURIComponent(article.slug)}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-brand hover:underline"
            >
              <bdi>{article.title}</bdi>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
