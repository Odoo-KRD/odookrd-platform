"use client";

import { TICKET_PRIORITIES } from "@odookrd/types";
import { useEffect, useRef, useState } from "react";

import type { HelpdeskDictionary } from "@/lib/i18n/helpdesk";

/** Shared look for every select and text field on the helpdesk forms. */
export const helpdeskFieldClass =
  "w-full rounded-md border border-line bg-white px-3 text-sm text-content outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:bg-surface-subtle";

export interface TicketServiceOption {
  id: string;
  label: string;
}

export function FieldLabel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
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
    <FieldLabel label={labels.department}>
      <select
        name="departmentId"
        required
        defaultValue=""
        disabled={disabled}
        className={`h-11 ${helpdeskFieldClass}`}
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

export function PrioritySelect({
  labels,
  disabled,
}: {
  labels: HelpdeskDictionary;
  disabled?: boolean;
}) {
  return (
    <FieldLabel label={labels.priority} hint={labels.priorityHint}>
      <select
        name="priority"
        defaultValue="NORMAL"
        disabled={disabled}
        className={`h-11 ${helpdeskFieldClass}`}
      >
        {TICKET_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {labels.priorities[priority]}
          </option>
        ))}
      </select>
    </FieldLabel>
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
    >
      <select
        name="companyServiceId"
        defaultValue=""
        disabled={disabled || services.length === 0}
        className={`h-11 ${helpdeskFieldClass}`}
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
