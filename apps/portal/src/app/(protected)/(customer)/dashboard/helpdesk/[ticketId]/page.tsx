import { PERMISSIONS, type CustomerTicketDetail } from "@odookrd/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { CloseTicketForm } from "@/components/helpdesk/close-ticket-form";
import { TicketReplyForm } from "@/components/helpdesk/ticket-reply-form";
import { TicketThread } from "@/components/helpdesk/ticket-thread";
import {
  TicketPriorityIndicator,
  TicketReference,
  TicketStatusBadge,
} from "@/components/helpdesk/ticket-visuals";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { helpdeskDictionaries } from "@/lib/i18n/helpdesk";
import { getLocale } from "@/lib/i18n/server";

import { closeTicketAction, replyToTicketAction } from "../actions";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TicketPageProps {
  params: Promise<{ ticketId: string }>;
}

/**
 * Label above value rather than side by side: long Kurdish and Arabic dates
 * and names then wrap cleanly instead of squeezing into half a narrow column.
 */
function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="py-3">
      <dt className="text-[13px] font-medium text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm text-content">{children}</dd>
    </div>
  );
}

export default async function TicketPage({ params }: TicketPageProps) {
  const [{ session, token }, locale, { ticketId }] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.HELPDESK_READ),
    getLocale(),
    params,
  ]);
  const labels = helpdeskDictionaries[locale];

  if (!uuidPattern.test(ticketId)) {
    notFound();
  }

  let ticket: CustomerTicketDetail;

  try {
    ticket = await apiRequest<CustomerTicketDetail>(
      `/helpdesk/tickets/${encodeURIComponent(ticketId)}`,
      { token },
    );
  } catch (error: unknown) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const now = new Date();
  const closed = ticket.status === "CLOSED";
  const openedBy =
    ticket.createdBy.id === session.user.id
      ? labels.you
      : (ticket.createdBy.displayName ?? ticket.createdBy.email ?? "—");
  const hint =
    ticket.status === "RESOLVED"
      ? labels.resolvedHint
      : ticket.status === "WAITING_ON_CUSTOMER"
        ? labels.waitingHint
        : null;

  return (
    <div className="grid gap-6">
      <nav
        aria-label={labels.backToTickets}
        className="flex min-w-0 items-center gap-2 text-sm"
      >
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
        <span aria-hidden="true" className="text-slate-300">
          /
        </span>
        <TicketReference reference={ticket.reference} />
      </nav>

      <header className="rounded-xl border border-line bg-surface-panel px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-semibold leading-8 text-content sm:text-2xl sm:leading-9">
              <bdi>{ticket.subject}</bdi>
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <TicketReference reference={ticket.reference} />
              <span aria-hidden="true">·</span>
              <span>{ticket.department.name}</span>
              <span aria-hidden="true">·</span>
              <span>
                {labels.openedOn} {formatDateTime(ticket.createdAt, locale)}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <TicketStatusBadge
              status={ticket.status}
              labels={labels.statuses}
            />
            <TicketPriorityIndicator
              priority={ticket.priority}
              labels={labels.priorities}
            />
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid min-w-0 gap-6">
          <section aria-labelledby="ticket-conversation" className="grid gap-4">
            <h2
              id="ticket-conversation"
              className="text-base font-semibold text-content"
            >
              {labels.conversation}
            </h2>
            <TicketThread
              messages={ticket.messages}
              viewerId={session.user.id}
              locale={locale}
              labels={labels}
            />
          </section>

          {closed ? (
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface-subtle px-5 py-4">
              <p className="text-sm leading-6 text-muted">
                {labels.closedNotice}
              </p>
              <Link
                href="/dashboard/helpdesk/new"
                className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                {labels.newTicket}
              </Link>
            </section>
          ) : (
            <TicketReplyForm
              action={replyToTicketAction.bind(null, ticket.id)}
              labels={labels}
              hint={hint}
            />
          )}
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-4">
          <section className="rounded-xl border border-line bg-surface-panel px-5 py-4 shadow-sm">
            <h2 className="text-[15px] font-semibold text-content">
              {labels.ticketDetails}
            </h2>
            <dl className="mt-1 divide-y divide-line">
              <DetailItem label={labels.status}>
                <TicketStatusBadge
                  status={ticket.status}
                  labels={labels.statuses}
                />
              </DetailItem>
              <DetailItem label={labels.priority}>
                <TicketPriorityIndicator
                  priority={ticket.priority}
                  labels={labels.priorities}
                />
              </DetailItem>
              <DetailItem label={labels.department}>
                {ticket.department.name}
              </DetailItem>
              {ticket.companyService ? (
                <DetailItem label={labels.relatedService}>
                  <bdi>
                    {ticket.companyService.displayName ??
                      ticket.companyService.service.name}
                  </bdi>
                </DetailItem>
              ) : null}
              <DetailItem label={labels.reference}>
                <TicketReference reference={ticket.reference} />
              </DetailItem>
              <DetailItem label={labels.openedBy}>
                <bdi>{openedBy}</bdi>
              </DetailItem>
              <DetailItem label={labels.openedOn}>
                {formatDateTime(ticket.createdAt, locale)}
              </DetailItem>
              <DetailItem label={labels.lastActivity}>
                <time
                  dateTime={ticket.lastMessageAt}
                  title={formatDateTime(ticket.lastMessageAt, locale)}
                >
                  {formatRelativeTime(ticket.lastMessageAt, locale, now)}
                </time>
              </DetailItem>
            </dl>
          </section>

          {closed ? null : (
            <section className="rounded-xl border border-line bg-surface-panel px-5 py-4 shadow-sm">
              <p className="mb-3 text-sm leading-6 text-muted">
                {labels.closeTicketHint}
              </p>
              <CloseTicketForm
                action={closeTicketAction.bind(null, ticket.id)}
                labels={labels}
              />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
