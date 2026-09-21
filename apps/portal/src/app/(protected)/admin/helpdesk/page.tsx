import {
  PERMISSIONS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type PaginatedResult,
  type StaffTicketListItem,
  type TicketDepartmentRef,
} from "@odookrd/types";
import { EmptyState, PageHeading } from "@odookrd/ui";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AdminDataTable,
  type AdminDataTableRow,
} from "@/components/admin/admin-data-table";
import {
  TicketPriorityIndicator,
  TicketReference,
  TicketStatusBadge,
  UserAvatar,
} from "@/components/helpdesk/ticket-visuals";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { helpdeskDictionaries } from "@/lib/i18n/helpdesk";
import { helpdeskAdminDictionaries } from "@/lib/i18n/helpdesk-admin";
import { getLocale } from "@/lib/i18n/server";

import { batchQueueAction } from "./actions";

const PAGE_SIZE = 25;

interface QueuePageProps {
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

export default async function HelpdeskQueuePage({
  searchParams,
}: QueuePageProps) {
  const [{ session, token }, locale, parameters] = await Promise.all([
    getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE),
    getLocale(),
    searchParams,
  ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const labels = helpdeskAdminDictionaries[locale];
  const shared = helpdeskDictionaries[locale];
  const canAssign = hasPermission(session, PERMISSIONS.HELPDESK_ASSIGN);

  const status = single(parameters.status);
  const priority = single(parameters.priority);
  const departmentId = single(parameters.departmentId);
  const assignee = single(parameters.assignee);
  const q = single(parameters.q).trim().slice(0, 100);
  const offset = selectedOffset(single(parameters.offset));

  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
    // Most recent activity first: the queue's default working order.
    sort: "activity",
  });
  if ((TICKET_STATUSES as readonly string[]).includes(status)) {
    query.set("status", status);
  }
  if ((TICKET_PRIORITIES as readonly string[]).includes(priority)) {
    query.set("priority", priority);
  }
  if (departmentId) query.set("departmentId", departmentId);
  if (assignee) query.set("assignee", assignee);
  if (q) query.set("q", q);

  const [result, departments] = await Promise.all([
    apiRequest<PaginatedResult<StaffTicketListItem>>(
      `/helpdesk/admin/tickets?${query.toString()}`,
      { token },
    ),
    apiRequest<TicketDepartmentRef[]>("/helpdesk/admin/departments", {
      token,
    }).catch(() => [] as TicketDepartmentRef[]),
  ]);
  const now = new Date();
  const filtered = Boolean(status || priority || departmentId || assignee || q);

  function queueHref(nextOffset: number): string {
    const target = new URLSearchParams();
    if (status) target.set("status", status);
    if (priority) target.set("priority", priority);
    if (departmentId) target.set("departmentId", departmentId);
    if (assignee) target.set("assignee", assignee);
    if (q) target.set("q", q);
    if (nextOffset > 0) target.set("offset", String(nextOffset));
    const search = target.toString();
    return `/admin/helpdesk${search ? `?${search}` : ""}`;
  }

  const rows: AdminDataTableRow[] = result.items.map((ticket) => {
    const assigneeName = ticket.assignee
      ? (ticket.assignee.displayName ?? ticket.assignee.email ?? "—")
      : null;

    return {
      id: ticket.id,
      searchText: `${ticket.reference} ${ticket.subject}`,
      cells: {
        ticket: {
          type: "node",
          value: (
            <div className="min-w-0 max-w-md">
              <Link
                href={`/admin/helpdesk/${ticket.id}`}
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
        company: {
          type: "node",
          value: (
            <bdi className="text-sm text-content">{ticket.company.name}</bdi>
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
              labels={shared.priorities}
            />
          ),
        },
        assignee: {
          type: "node",
          value: assigneeName ? (
            <span className="flex items-center gap-2 whitespace-nowrap">
              <UserAvatar name={assigneeName} size="sm" />
              <bdi className="text-sm text-content">{assigneeName}</bdi>
            </span>
          ) : (
            <span className="text-sm text-muted">{labels.unassigned}</span>
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
              label: labels.open,
              href: `/admin/helpdesk/${ticket.id}`,
              icon: "view",
            },
          ],
        },
      },
    };
  });

  const filterSelect =
    "h-9 rounded-md border border-line bg-white px-3 text-sm text-content";

  return (
    <div className="grid gap-7">
      <PageHeading title={labels.title} description={labels.description} />

      <AdminDataTable
        locale={locale}
        columns={[
          { key: "ticket", label: labels.columnTicket },
          { key: "company", label: labels.columnCompany },
          { key: "status", label: labels.columnStatus },
          { key: "priority", label: labels.columnPriority },
          { key: "assignee", label: labels.columnAssignee },
          { key: "updated", label: labels.columnUpdated },
          { key: "actions", label: labels.columnActions },
        ]}
        rows={rows}
        labels={adminTableDictionaries[locale]}
        searchEnabled={false}
        selectable
        batchAction={batchQueueAction}
        batchActions={[
          ...(canAssign
            ? [
                { value: "assign-me", label: labels.batchAssignMe },
                { value: "unassign", label: labels.batchUnassign },
              ]
            : []),
          { value: "IN_PROGRESS", label: labels.batchInProgress },
          { value: "RESOLVED", label: labels.batchResolve },
          {
            value: "CLOSED",
            label: labels.batchClose,
            tone: "danger" as const,
          },
        ]}
        minWidthClassName="min-w-[1080px]"
        toolbar={
          <Form
            action="/admin/helpdesk"
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          >
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={labels.searchPlaceholder}
              className="h-9 min-w-52 flex-1 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
            <select
              name="status"
              defaultValue={status}
              className={filterSelect}
            >
              <option value="">{labels.allStatuses}</option>
              {TICKET_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {labels.statuses[value]}
                </option>
              ))}
            </select>
            <select
              name="priority"
              defaultValue={priority}
              className={filterSelect}
            >
              <option value="">{labels.allPriorities}</option>
              {TICKET_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {shared.priorities[value]}
                </option>
              ))}
            </select>
            <select
              name="departmentId"
              defaultValue={departmentId}
              className={filterSelect}
            >
              <option value="">{labels.allDepartments}</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <select
              name="assignee"
              defaultValue={assignee}
              className={filterSelect}
            >
              <option value="">{labels.anyAssignee}</option>
              <option value="me">{labels.assignedToMe}</option>
              <option value="unassigned">{labels.unassigned}</option>
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-content hover:bg-surface-subtle"
            >
              {labels.search}
            </button>
            {filtered ? (
              <Link
                href="/admin/helpdesk"
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
            <p className="text-sm text-muted">
              {labels.showing
                .replace("{shown}", String(result.items.length))
                .replace("{total}", String(result.pagination.total))}
            </p>
            {result.pagination.total > result.pagination.limit ? (
              <div className="flex gap-2">
                {offset > 0 ? (
                  <Link
                    href={queueHref(Math.max(0, offset - PAGE_SIZE))}
                    className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-content hover:bg-surface-subtle"
                  >
                    {labels.previous}
                  </Link>
                ) : null}
                {offset + result.items.length < result.pagination.total ? (
                  <Link
                    href={queueHref(offset + PAGE_SIZE)}
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
  );
}
