import {
  PERMISSIONS,
  type NotificationAdministrationDeliveryPage,
  type NotificationAdministrationKind,
  type NotificationChannel,
  type NotificationDeliveryStatus,
} from "@odookrd/types";
import { PageHeading } from "@odookrd/ui";
import Link from "next/link";

import {
  AdminDataTable,
  type AdminDataTableRow,
  type AdminTableTone,
} from "@/components/admin/admin-data-table";
import { AdminRecordDetailsAction } from "@/components/admin/admin-record-details-action";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getAdminDictionary } from "@/lib/i18n/admin/server";
import { adminLifecycleDictionaries } from "@/lib/i18n/companies/lifecycle";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { notificationAdministrationDictionaries } from "@/lib/i18n/notifications/administration";
import { notificationBroadcastDictionaries } from "@/lib/i18n/notifications/broadcast";

const PAGE_SIZE = 25;

interface DeliveriesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function offset(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? parsed
    : 0;
}

function queryString(parameters: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(parameters)) {
    if (value) query.set(key, value);
  }
  return query.toString();
}

function statusTone(status: NotificationDeliveryStatus): AdminTableTone {
  if (status === "SENT") return "success";
  if (status === "FAILED") return "danger";
  if (status === "PROCESSING" || status === "PENDING") return "accent";
  return "neutral";
}

export default async function NotificationDeliveriesPage({
  searchParams,
}: DeliveriesPageProps) {
  const [{ session, token }, { locale }, rawParameters] = await Promise.all([
    getAdminApiContext(PERMISSIONS.NOTIFICATIONS_MANAGE),
    getAdminDictionary(),
    searchParams,
  ]);

  const labels = notificationAdministrationDictionaries[locale];
  const broadcastLabels = notificationBroadcastDictionaries[locale];
  const tableLabels = adminTableDictionaries[locale];
  const lifecycle = adminLifecycleDictionaries[locale];
  const selectedOffset = offset(one(rawParameters.offset));
  const kind = one(rawParameters.kind) as
    NotificationAdministrationKind | undefined;
  const channel = one(rawParameters.channel) as NotificationChannel | undefined;
  const status = one(rawParameters.status) as
    NotificationDeliveryStatus | undefined;
  const companyId = one(rawParameters.companyId);

  const deliveryQuery = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(selectedOffset),
  });
  if (kind) deliveryQuery.set("kind", kind);
  if (channel) deliveryQuery.set("channel", channel);
  if (status) deliveryQuery.set("status", status);
  if (companyId) deliveryQuery.set("companyId", companyId);

  const deliveries = await apiRequest<NotificationAdministrationDeliveryPage>(
    `/notification-administration/deliveries?${deliveryQuery.toString()}`,
    { token },
  );

  const nextOffset = selectedOffset + PAGE_SIZE;
  const previousOffset = Math.max(0, selectedOffset - PAGE_SIZE);
  const hasPrevious = selectedOffset > 0;
  const hasNext = nextOffset < deliveries.pagination.total;
  const baseFilters = { kind, channel, status, companyId };

  const rows: AdminDataTableRow[] = deliveries.items.map(
    (item): AdminDataTableRow => ({
      id: `${item.kind}-${item.id}`,
      searchText: [
        item.companyName ?? "",
        item.recipient,
        labels.kinds[item.kind],
        labels.channels[item.channel],
        labels.statuses[item.status],
        item.failureCode ?? "",
      ].join(" "),
      cells: {
        created: {
          type: "text",
          value: formatDate(item.createdAt, locale),
          muted: true,
        },
        company: { type: "text", value: item.companyName ?? "—" },
        recipient: {
          type: "text",
          value: item.recipient,
          dir: "ltr",
          className: "max-w-[260px] break-all",
        },
        type: {
          type: "badge",
          label:
            item.templateKey === "admin.broadcast"
              ? broadcastLabels.logType
              : labels.kinds[item.kind],
        },
        channel: {
          type: "badge",
          label: labels.channels[item.channel],
        },
        status: {
          type: "badge",
          label: labels.statuses[item.status],
          tone: statusTone(item.status),
        },
        attempts: { type: "text", value: String(item.attemptCount) },
        failureCode: {
          type: "text",
          value: item.failureCode ?? "—",
          dir: "ltr",
          muted: true,
          className: "max-w-[220px] break-all text-xs",
        },
        actions: {
          type: "node",
          value: (
            <AdminRecordDetailsAction
              label={lifecycle.view}
              title={`${labels.deliveryLog}: ${item.recipient}`}
              closeLabel={lifecycle.cancel}
              details={[
                {
                  label: labels.created,
                  value: formatDate(item.createdAt, locale),
                },
                {
                  label: labels.company,
                  value: item.companyName ?? "—",
                },
                {
                  label: labels.recipient,
                  value: item.recipient,
                  dir: "ltr",
                },
                {
                  label: labels.type,
                  value:
                    item.templateKey === "admin.broadcast"
                      ? broadcastLabels.logType
                      : labels.kinds[item.kind],
                },
                {
                  label: labels.channel,
                  value: labels.channels[item.channel],
                },
                {
                  label: labels.status,
                  value: labels.statuses[item.status],
                },
                {
                  label: labels.attempts,
                  value: String(item.attemptCount),
                },
                {
                  label: labels.providerMessageId,
                  value: item.providerMessageId ?? "—",
                  dir: "ltr",
                },
                {
                  label: labels.failureCode,
                  value: item.failureCode ?? "—",
                  dir: "ltr",
                },
                {
                  label: labels.lastAttempt,
                  value: item.lastAttemptAt
                    ? formatDate(item.lastAttemptAt, locale)
                    : "—",
                },
                {
                  label: labels.sent,
                  value: item.sentAt ? formatDate(item.sentAt, locale) : "—",
                },
              ]}
            />
          ),
        },
      },
    }),
  );

  const filters = (
    <form method="get" className="flex flex-wrap items-center gap-2">
      {session.user.accountScope === "PLATFORM" ? (
        <select
          name="companyId"
          defaultValue={companyId ?? ""}
          className="h-10 rounded-md border border-line bg-white px-3 text-sm"
        >
          <option value="">
            {labels.company}: {labels.all}
          </option>
          {deliveries.companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      ) : null}

      <select
        name="kind"
        defaultValue={kind ?? ""}
        className="h-10 rounded-md border border-line bg-white px-3 text-sm"
      >
        <option value="">
          {labels.type}: {labels.all}
        </option>
        {(["NOTIFICATION", "INVITATION", "TEST"] as const).map((value) => (
          <option key={value} value={value}>
            {labels.kinds[value]}
          </option>
        ))}
      </select>

      <select
        name="channel"
        defaultValue={channel ?? ""}
        className="h-10 rounded-md border border-line bg-white px-3 text-sm"
      >
        <option value="">
          {labels.channel}: {labels.all}
        </option>
        {(["IN_APP", "EMAIL", "WHATSAPP"] as const).map((value) => (
          <option key={value} value={value}>
            {labels.channels[value]}
          </option>
        ))}
      </select>

      <select
        name="status"
        defaultValue={status ?? ""}
        className="h-10 rounded-md border border-line bg-white px-3 text-sm"
      >
        <option value="">
          {labels.status}: {labels.all}
        </option>
        {(["PENDING", "PROCESSING", "SENT", "FAILED", "SKIPPED"] as const).map(
          (value) => (
            <option key={value} value={value}>
              {labels.statuses[value]}
            </option>
          ),
        )}
      </select>

      <button
        type="submit"
        className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
      >
        {labels.deliveryLog}
      </button>
    </form>
  );

  const footer =
    hasPrevious || hasNext ? (
      <nav className="flex items-center justify-between gap-3">
        {hasPrevious ? (
          <Link
            href={`/admin/notifications/deliveries?${queryString({
              ...baseFilters,
              offset: String(previousOffset),
            })}`}
            className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-medium text-content"
          >
            {labels.previous}
          </Link>
        ) : (
          <span />
        )}

        {hasNext ? (
          <Link
            href={`/admin/notifications/deliveries?${queryString({
              ...baseFilters,
              offset: String(nextOffset),
            })}`}
            className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-medium text-content"
          >
            {labels.next}
          </Link>
        ) : null}
      </nav>
    ) : undefined;

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.deliveryLog}
        description={labels.deliveryLogDescription}
      />

      <AdminDataTable
        locale={locale}
        columns={[
          { key: "created", label: labels.created },
          { key: "company", label: labels.company },
          { key: "recipient", label: labels.recipient },
          { key: "type", label: labels.type },
          { key: "channel", label: labels.channel },
          { key: "status", label: labels.status },
          { key: "attempts", label: labels.attempts },
          { key: "failureCode", label: labels.failureCode },
          { key: "actions", label: lifecycle.view },
        ]}
        rows={rows}
        labels={tableLabels}
        toolbar={filters}
        footer={footer}
        empty={
          <p className="text-center text-sm text-muted">{labels.emptyLog}</p>
        }
        minWidthClassName="min-w-[1100px]"
      />
    </div>
  );
}
