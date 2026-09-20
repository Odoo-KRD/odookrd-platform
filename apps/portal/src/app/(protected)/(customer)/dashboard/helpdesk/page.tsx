import {
  PERMISSIONS,
  TICKET_STATUSES,
  type CustomerTicketListItem,
  type PaginatedResult,
  type TicketStatus,
  type TicketSummary,
} from "@odookrd/types";
import { EmptyState } from "@odookrd/ui";
import Form from "next/form";
import Link from "next/link";

import {
  AdminDataTable,
  type AdminDataTableRow,
} from "@/components/admin/admin-data-table";
import {
  statusDotClass,
  TicketPriorityIndicator,
  TicketReference,
  TicketStatusBadge,
  UserAvatar,
} from "@/components/helpdesk/ticket-visuals";
import { apiRequest } from "@/lib/api";
import { getCustomerApiContext, hasPermission } from "@/lib/authorization";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { helpdeskDictionaries } from "@/lib/i18n/helpdesk";
import { getLocale } from "@/lib/i18n/server";

import { batchCloseTicketsAction } from "./actions";

const PAGE_SIZE = 20;

interface HelpdeskPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function selectedOffset(value: string): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? parsed
    : 0;
}

function selectedStatus(value: string): TicketStatus | null {
  return (TICKET_STATUSES as readonly string[]).includes(value)
    ? (value as TicketStatus)
    : null;
}

function listHref(filters: {
  status?: TicketStatus | null;
  q?: string;
  offset?: number;
}): string {
  const target = new URLSearchParams();
  if (filters.status) target.set("status", filters.status);
  if (filters.q) target.set("q", filters.q);
  if (filters.offset) target.set("offset", String(filters.offset));
  const search = target.toString();
  return `/dashboard/helpdesk${search ? `?${search}` : ""}`;
}

export default async function HelpdeskPage({
  searchParams,
}: HelpdeskPageProps) {
  const [{ session, token }, locale, parameters] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.HELPDESK_READ),
    getLocale(),
    searchParams,
  ]);
  const labels = helpdeskDictionaries[locale];
  const canReadCompany = hasPermission(
    session,
    PERMISSIONS.HELPDESK_COMPANY_READ,
  );

  const status = selectedStatus(single(parameters.status));
  const q = single(parameters.q).trim().slice(0, 100);
  const offset = selectedOffset(single(parameters.offset));

  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  if (status) query.set("status", status);
  if (q) query.set("q", q);

  const [result, summary] = await Promise.all([
    apiRequest<PaginatedResult<CustomerTicketListItem>>(
      `/helpdesk/tickets?${query.toString()}`,
      { token },
    ),
    apiRequest<TicketSummary>("/helpdesk/tickets/summary", { token }),
  ]);
  const now = new Date();
  const filtered = Boolean(status || q);

  const stats = [
    { status: "OPEN", ...labels.stats.open },
    { status: "IN_PROGRESS", ...labels.stats.inProgress },
    { status: "WAITING_ON_CUSTOMER", ...labels.stats.waiting },
    { status: "RESOLVED", ...labels.stats.resolved },
  ] as const;

  const tabs: Array<{
    status: TicketStatus | null;
    label: string;
    count: number;
  }> = [
    { status: null, label: labels.allTickets, count: summary.total },
    ...TICKET_STATUSES.map((value) => ({
      status: value,
      label: labels.statusTabs[value],
      count: summary.byStatus[value],
    })),
  ];

  const columns = [
    { key: "ticket", label: labels.columnTicket },
    ...(canReadCompany
      ? [{ key: "openedBy", label: labels.columnOpenedBy }]
      : []),
    { key: "status", label: labels.columnStatus },
    { key: "priority", label: labels.columnPriority },
    { key: "updated", label: labels.columnUpdated },
    { key: "actions", label: labels.columnActions },
  ];

  const rows: AdminDataTableRow[] = result.items.map((ticket) => {
    const realName =
      ticket.createdBy.displayName ?? ticket.createdBy.email ?? "—";
    const openedBy =
      ticket.createdBy.id === session.user.id ? labels.you : realName;

    return {
      id: ticket.id,
      searchText: `${ticket.reference} ${ticket.subject}`,
      cells: {
        ticket: {
          type: "node",
          value: (
            <div className="min-w-0 max-w-md">
              <Link
                href={`/dashboard/helpdesk/${ticket.id}`}
                // Wrapped and clamped, never truncated: an ellipsis on an
                // English subject inside an RTL cell clips the subject's start.
                className="line-clamp-2 break-words text-[15px] font-semibold leading-6 text-content hover:text-brand"
              >
                <bdi>{ticket.subject}</bdi>
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
                <TicketReference reference={ticket.reference} />
                <span aria-hidden="true">·</span>
                <span>{ticket.department.name}</span>
              </p>
            </div>
          ),
        },
        openedBy: {
          type: "node",
          value: (
            <span className="flex items-center gap-2 whitespace-nowrap">
              <UserAvatar name={realName} size="sm" />
              <bdi className="text-sm text-content">{openedBy}</bdi>
            </span>
          ),
        },
        status: {
          type: "node",
          value: (
            <TicketStatusBadge
              status={ticket.status}
              labels={labels.statuses}
            />
          ),
        },
        priority: {
          type: "node",
          value: (
            <TicketPriorityIndicator
              priority={ticket.priority}
              labels={labels.priorities}
            />
          ),
        },
        updated: {
          type: "node",
          value: (
            <time
              dateTime={ticket.lastMessageAt}
              title={formatDateTime(ticket.lastMessageAt, locale)}
              className="whitespace-nowrap text-sm text-muted"
            >
              {formatRelativeTime(ticket.lastMessageAt, locale, now)}
            </time>
          ),
        },
        actions: {
          type: "actions",
          items: [
            {
              key: "view",
              label: labels.view,
              href: `/dashboard/helpdesk/${ticket.id}`,
              icon: "view",
            },
          ],
        },
      },
    };
  });

  const shown = labels.showing
    .replace("{shown}", String(result.items.length))
    .replace("{total}", String(result.pagination.total));

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand">{labels.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold text-content sm:text-3xl">
            {labels.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {labels.description}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface-panel px-3 py-1 text-sm text-muted">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="10" cy="7" r="3" />
              <path d="M4 16c.8-2.6 3.2-4 6-4s5.2 1.4 6 4" />
            </svg>
            {canReadCompany ? labels.scopeCompany : labels.scopeOwn}
          </p>
        </div>
        <Link
          href="/dashboard/helpdesk/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 4v12M4 10h12" />
          </svg>
          {labels.newTicket}
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.status}
            href={listHref({ status: stat.status, q })}
            className={`rounded-xl border bg-surface-panel p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md ${
              status === stat.status ? "border-brand" : "border-line"
            }`}
          >
            <p className="flex items-center gap-2 text-sm font-medium text-muted">
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${statusDotClass(stat.status)}`}
              />
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-content">
              {summary.byStatus[stat.status]}
            </p>
            <p className="mt-1 text-sm text-muted">{stat.caption}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-3">
        <nav
          aria-label={labels.columnStatus}
          className="flex flex-wrap items-center gap-2"
        >
          {tabs.map((tab) => {
            const active = tab.status === status;

            return (
              <Link
                key={tab.status ?? "all"}
                href={listHref({ status: tab.status, q })}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-content hover:bg-surface-subtle"
                }`}
              >
                {tab.label}
                <span
                  className={`min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums ${
                    active ? "bg-white/20" : "bg-surface-subtle text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </nav>

        <AdminDataTable
          locale={locale}
          columns={columns}
          rows={rows}
          labels={adminTableDictionaries[locale]}
          searchEnabled={false}
          selectable
          batchAction={batchCloseTicketsAction}
          batchActions={[
            { value: "close", label: labels.closeSelected, tone: "danger" },
          ]}
          minWidthClassName="min-w-[860px]"
          toolbar={
            <Form
              action="/dashboard/helpdesk"
              className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
            >
              {status ? (
                <input type="hidden" name="status" value={status} />
              ) : null}
              <label className="relative min-w-52 max-w-sm flex-1">
                <span className="sr-only">{labels.search}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="m13.5 13.5 3 3" />
                </svg>
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder={labels.searchPlaceholder}
                  className="h-9 w-full rounded-md border border-line bg-white pe-3 ps-9 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-content hover:bg-surface-subtle"
              >
                {labels.search}
              </button>
              {filtered ? (
                <Link
                  href="/dashboard/helpdesk"
                  className="inline-flex h-9 items-center px-2 text-sm font-medium text-muted hover:text-content"
                >
                  {labels.clearFilters}
                </Link>
              ) : null}
            </Form>
          }
          empty={
            <EmptyState
              title={filtered ? labels.noResultsTitle : labels.emptyTitle}
              description={
                filtered ? labels.noResultsDescription : labels.emptyDescription
              }
            />
          }
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">{shown}</p>
              {result.pagination.total > result.pagination.limit ? (
                <div className="flex gap-2">
                  {offset > 0 ? (
                    <Link
                      href={listHref({
                        status,
                        q,
                        offset: Math.max(0, offset - PAGE_SIZE),
                      })}
                      className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-content hover:bg-surface-subtle"
                    >
                      {labels.previous}
                    </Link>
                  ) : null}
                  {offset + result.items.length < result.pagination.total ? (
                    <Link
                      href={listHref({ status, q, offset: offset + PAGE_SIZE })}
                      className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-content hover:bg-surface-subtle"
                    >
                      {labels.next}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          }
        />
      </div>
    </div>
  );
}
