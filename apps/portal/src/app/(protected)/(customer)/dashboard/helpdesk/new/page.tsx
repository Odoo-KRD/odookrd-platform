import { PERMISSIONS, type TicketDepartmentOption } from "@odookrd/types";
import Link from "next/link";

import { NewTicketForm } from "@/components/helpdesk/new-ticket-form";
import { apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { helpdeskDictionaries } from "@/lib/i18n/helpdesk";
import { getLocale } from "@/lib/i18n/server";

import { createTicketAction } from "../actions";

export default async function NewTicketPage() {
  const [{ token }, locale] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.HELPDESK_READ),
    getLocale(),
  ]);
  const labels = helpdeskDictionaries[locale];
  const departments = await apiRequest<TicketDepartmentOption[]>(
    "/helpdesk/departments",
    { token },
  );

  return (
    <div className="grid gap-6">
      <nav aria-label={labels.backToTickets} className="text-sm">
        <Link
          href="/dashboard/helpdesk"
          className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-content"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4 rtl:-scale-x-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12.5 4.5 7 10l5.5 5.5" />
          </svg>
          {labels.backToTickets}
        </Link>
      </nav>

      <header>
        <p className="text-sm font-semibold text-brand">{labels.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold text-content sm:text-3xl">
          {labels.newTicketTitle}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {labels.newTicketDescription}
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 rounded-xl border border-line bg-surface-panel px-5 py-6 shadow-sm sm:px-7">
          <NewTicketForm
            action={createTicketAction}
            departments={departments}
            labels={labels}
          />
        </section>

        <aside className="grid gap-4 lg:sticky lg:top-4">
          <section className="rounded-xl border border-line bg-surface-panel px-5 py-4 shadow-sm">
            <h2 className="text-[15px] font-semibold text-content">
              {labels.tipsTitle}
            </h2>
            <ul className="mt-3 grid gap-3">
              {labels.tips.map((tip) => (
                <li
                  key={tip}
                  className="flex gap-2.5 text-sm leading-6 text-muted"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m4 8 2.4 2.4L12 5" />
                  </svg>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-brand/20 bg-brand-soft px-5 py-4">
            <p className="text-sm leading-6 text-content">
              {labels.knowledgePrompt}
            </p>
            <Link
              href="/kb"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover"
            >
              {labels.knowledgeLink}
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-4 rtl:-scale-x-100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M3 10h13m0 0-5-5m5 5-5 5" />
              </svg>
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
