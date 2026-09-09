import {
  PERMISSIONS,
  type CustomerNotificationPage,
  type NotificationUnreadCount,
} from "@odookrd/types";
import { Badge, EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getFrontendDictionary } from "@/lib/i18n/public/server";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "./actions";

const PAGE_SIZE = 20;

interface NotificationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function selectedOffset(value: string | string[] | undefined): number {
  if (typeof value !== "string") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? parsed
    : 0;
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const [{ token }, { locale, notifications }, parameters] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.NOTIFICATIONS_READ),
    getFrontendDictionary(),
    searchParams,
  ]);
  const offset = selectedOffset(parameters.offset);
  const [result, count] = await Promise.all([
    apiRequest<CustomerNotificationPage>(
      `/notifications?limit=${PAGE_SIZE}&offset=${offset}`,
      { token },
    ),
    apiRequest<NotificationUnreadCount>("/notifications/unread-count", {
      token,
    }),
  ]);
  const previousOffset = Math.max(0, offset - PAGE_SIZE);
  const nextOffset = offset + PAGE_SIZE;
  const hasPrevious = offset > 0;
  const hasNext = nextOffset < result.pagination.total;

  return (
    <div className="grid gap-7">
      <PageHeading
        title={notifications.title}
        description={notifications.description}
        actions={
          count.unread > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {notifications.markAllRead}
              </button>
            </form>
          ) : undefined
        }
      />

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">
            {notifications.unreadCount}
          </p>
          <Badge tone={count.unread > 0 ? "accent" : "neutral"}>
            {count.unread}
          </Badge>
        </div>
      </Panel>

      {result.items.length === 0 ? (
        <Panel>
          <EmptyState
            title={notifications.emptyTitle}
            description={notifications.emptyDescription}
          />
        </Panel>
      ) : (
        <div className="grid gap-4">
          {result.items.map((item) => (
            <Panel key={item.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">
                      {item.title}
                    </h2>
                    {!item.readAt ? (
                      <Badge tone="accent">{notifications.unread}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {item.body}
                  </p>
                  <p className="mt-4 text-xs text-slate-500">
                    {formatDate(item.createdAt, locale)}
                  </p>
                </div>

                {!item.readAt ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="recipientId" value={item.id} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {notifications.markRead}
                    </button>
                  </form>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {item.deliveries.map((delivery) => (
                  <Badge key={delivery.channel} tone="neutral">
                    {notifications.channels[delivery.channel]} ·{" "}
                    {notifications.deliveryStatuses[delivery.status]}
                  </Badge>
                ))}
              </div>

              {item.actionUrl ? (
                <div className="mt-5">
                  <Link
                    href={item.actionUrl}
                    className="text-sm font-medium text-[#714b67] hover:text-[#62405a]"
                  >
                    {item.title}
                  </Link>
                </div>
              ) : null}
            </Panel>
          ))}
        </div>
      )}

      {(hasPrevious || hasNext) && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between gap-3"
        >
          {hasPrevious ? (
            <Link
              href={`/dashboard/notifications?offset=${previousOffset}`}
              className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {notifications.previous}
            </Link>
          ) : (
            <span />
          )}
          {hasNext ? (
            <Link
              href={`/dashboard/notifications?offset=${nextOffset}`}
              className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {notifications.next}
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  );
}
