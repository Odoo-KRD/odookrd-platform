import {
  PERMISSIONS,
  type StaffTicketDetail,
  type TicketUserRef,
} from "@odookrd/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { StaffComposer } from "@/components/helpdesk/admin/staff-composer";
import { StaffTicketThread } from "@/components/helpdesk/admin/staff-ticket-thread";
import { TicketControls } from "@/components/helpdesk/admin/ticket-controls";
import {
  TicketPriorityIndicator,
  TicketReference,
  TicketStatusBadge,
} from "@/components/helpdesk/ticket-visuals";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { helpdeskDictionaries } from "@/lib/i18n/helpdesk";
import { helpdeskAdminDictionaries } from "@/lib/i18n/helpdesk-admin";
import { getLocale } from "@/lib/i18n/server";

import { addStaffMessageAction, updateTicketAction } from "../actions";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface StaffTicketPageProps {
  params: Promise<{ ticketId: string }>;
}

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

export default async function StaffTicketPage({
  params,
}: StaffTicketPageProps) {
  const [{ session, token }, locale, { ticketId }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE),
    getLocale(),
    params,
  ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  if (!uuidPattern.test(ticketId)) {
    notFound();
  }

  const labels = helpdeskAdminDictionaries[locale];
  const shared = helpdeskDictionaries[locale];
  const canAssign = hasPermission(session, PERMISSIONS.HELPDESK_ASSIGN);

  let ticket: StaffTicketDetail;

  try {
    ticket = await apiRequest<StaffTicketDetail>(
      `/helpdesk/admin/tickets/${encodeURIComponent(ticketId)}`,
      { token },
    );
  } catch (error: unknown) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const assignees = canAssign
    ? await apiRequest<TicketUserRef[]>("/helpdesk/admin/assignees", {
        token,
      }).catch(() => [] as TicketUserRef[])
    : [];
  const now = new Date();

  return (
    <div className="grid gap-6">
      <nav
        aria-label={labels.backToQueue}
        className="flex min-w-0 items-center gap-2 text-sm"
      >
        <Link
          href="/admin/helpdesk"
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
          {labels.backToQueue}
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
              <bdi className="font-medium text-content">
                {ticket.company.name}
              </bdi>
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
              labels={shared.priorities}
            />
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-6">
          <section aria-labelledby="staff-conversation" className="grid gap-4">
            <h2
              id="staff-conversation"
              className="text-base font-semibold text-content"
            >
              {labels.conversation}
            </h2>
            <StaffTicketThread
              messages={ticket.messages}
              viewerId={session.user.id}
              locale={locale}
              labels={labels}
            />
          </section>

          <StaffComposer
            action={addStaffMessageAction.bind(null, ticket.id)}
            labels={labels}
            fileLabels={shared}
          />
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-4">
          <section className="rounded-xl border border-line bg-surface-panel px-5 py-4 shadow-sm">
            <h2 className="mb-3 text-[15px] font-semibold text-content">
              {labels.queue}
            </h2>
            <TicketControls
              action={updateTicketAction.bind(null, ticket.id)}
              status={ticket.status}
              priority={ticket.priority}
              assigneeUserId={ticket.assignee?.id ?? null}
              assignees={assignees}
              canAssign={canAssign}
              labels={labels}
              priorityLabels={shared.priorities}
            />
          </section>

          <section className="rounded-xl border border-line bg-surface-panel px-5 py-4 shadow-sm">
            <h2 className="text-[15px] font-semibold text-content">
              {labels.ticketDetails}
            </h2>
            <dl className="mt-1 divide-y divide-line">
              <DetailItem label={labels.reference}>
                <TicketReference reference={ticket.reference} />
              </DetailItem>
              <DetailItem label={labels.company}>
                <bdi>{ticket.company.name}</bdi>
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
              <DetailItem label={labels.openedBy}>
                <bdi>
                  {ticket.createdBy.displayName ??
                    ticket.createdBy.email ??
                    "—"}
                </bdi>
              </DetailItem>
              <DetailItem label={labels.firstResponse}>
                {ticket.firstRespondedAt
                  ? formatDateTime(ticket.firstRespondedAt, locale)
                  : labels.notYet}
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
        </aside>
      </div>
    </div>
  );
}
