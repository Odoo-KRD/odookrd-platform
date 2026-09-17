import {
  PERMISSIONS,
  type CustomerNotificationPage,
  type NotificationUnreadCount,
} from "@odookrd/types";
import { Badge, EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(protected)/(customer)/dashboard/notifications/actions";
import { NotificationMessageButton } from "@/components/notifications/notification-message-dialog";
import { apiRequest } from "@/lib/api";
import { getNotificationApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getFrontendDictionary } from "@/lib/i18n/public/server";

const PAGE_SIZE = 20;

interface AdminInboxPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function selectedOffset(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 0;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? parsed
    : 0;
}

/**
 * The platform admin inbox. It reads the same endpoints as the customer inbox;
 * the API scopes a platform account's notifications by user instead of company.
 */
export default async function AdminNotificationInboxPage({
  searchParams,
}: AdminInboxPageProps) {
  const [{ token }, { locale, notifications }, parameters] = await Promise.all([
    getNotificationApiContext(PERMISSIONS.NOTIFICATIONS_READ),
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
                className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
              >
                {notifications.markAllRead}
              </button>
            </form>
          ) : undefined
        }
      />

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-content">
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
                    <h2 className="text-base font-semibold text-content">
                      <NotificationMessageButton
                        notification={item}
                        locale={locale}
                        labels={notifications}
                        className="text-start hover:text-brand"
                      >
                        {item.title}
                      </NotificationMessageButton>
                    </h2>
                    {!item.readAt ? (
                      <Badge tone="accent">{notifications.unread}</Badge>
                    ) : null}
                  </div>
                  <p
                    dir="auto"
                    className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-start text-sm leading-7 text-muted"
                  >
                    {item.body}
                  </p>
                  <p className="mt-4 text-xs text-muted">
                    {formatDate(item.createdAt, locale)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <NotificationMessageButton
                    notification={item}
                    locale={locale}
                    labels={notifications}
                    className="inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover"
                  >
                    {notifications.viewMessage}
                  </NotificationMessageButton>
                  {!item.readAt ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="recipientId" value={item.id} />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-md border border-line px-3 text-xs font-medium text-content hover:bg-surface-subtle"
                      >
                        {notifications.markRead}
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>

              {item.actionUrl ? (
                <div className="mt-5 border-t border-line pt-4">
                  <Link
                    href={item.actionUrl}
                    className="text-sm font-medium text-brand hover:text-brand-hover"
                  >
                    {notifications.openRelatedPage}
                  </Link>
                </div>
              ) : null}
            </Panel>
          ))}
        </div>
      )}

      {hasPrevious || hasNext ? (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between gap-3"
        >
          {hasPrevious ? (
            <Link
              href={`/admin/notifications/inbox?offset=${Math.max(0, offset - PAGE_SIZE)}`}
              className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
            >
              {notifications.previous}
            </Link>
          ) : (
            <span />
          )}
          {hasNext ? (
            <Link
              href={`/admin/notifications/inbox?offset=${nextOffset}`}
              className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
            >
              {notifications.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
