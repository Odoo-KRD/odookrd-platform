import {
  PERMISSIONS,
  type NotificationAdministrationDeliveryPage,
  type NotificationAdministrationKind,
  type NotificationChannel,
  type NotificationDeliveryStatus,
  type NotificationProviderAdministrationStatus,
} from "@odookrd/types";
import { Badge, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { ProviderTestEmailForm } from "@/components/notifications/provider-test-email-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getAdminDictionary } from "@/lib/i18n/admin-server";
import { notificationAdministrationDictionaries } from "@/lib/i18n/notification-administration";
import { notificationBroadcastDictionaries } from "@/lib/i18n/notification-broadcast";

import { sendNotificationTestEmailAction } from "./actions";

const PAGE_SIZE = 25;

interface NotificationAdministrationPageProps {
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

function statusTone(
  status: NotificationDeliveryStatus,
): "neutral" | "accent" | "success" | "danger" {
  if (status === "SENT") return "success";
  if (status === "FAILED") return "danger";
  if (status === "PROCESSING" || status === "PENDING") return "accent";
  return "neutral";
}

export default async function NotificationAdministrationPage({
  searchParams,
}: NotificationAdministrationPageProps) {
  const [{ session, token }, { locale }, rawParameters] = await Promise.all([
    getAdminApiContext(PERMISSIONS.NOTIFICATIONS_MANAGE),
    getAdminDictionary(),
    searchParams,
  ]);

  const labels = notificationAdministrationDictionaries[locale];
  const broadcastLabels = notificationBroadcastDictionaries[locale];
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

  const deliveriesPromise = apiRequest<NotificationAdministrationDeliveryPage>(
    `/notification-administration/deliveries?${deliveryQuery.toString()}`,
    { token },
  );

  const providerStatusPromise =
    session.user.accountScope === "PLATFORM"
      ? apiRequest<NotificationProviderAdministrationStatus>(
          "/notification-administration/provider-status",
          { token },
        )
      : Promise.resolve(null);

  const [deliveries, providerStatus] = await Promise.all([
    deliveriesPromise,
    providerStatusPromise,
  ]);

  const nextOffset = selectedOffset + PAGE_SIZE;
  const previousOffset = Math.max(0, selectedOffset - PAGE_SIZE);
  const hasPrevious = selectedOffset > 0;
  const hasNext = nextOffset < deliveries.pagination.total;

  const baseFilters = {
    kind,
    channel,
    status,
    companyId,
  };

  return (
    <div className="grid gap-7">
      <PageHeading title={labels.title} description={labels.description} />

      <div className="flex justify-end">
        <Link
          href="/admin/notifications/new"
          className="inline-flex h-10 items-center rounded-md bg-[#714b67] px-4 text-sm font-medium text-white hover:bg-[#62405a]"
        >
          {broadcastLabels.openComposer}
        </Link>
      </div>

      {providerStatus ? (
        <>
          <Panel className="p-5 sm:p-6">
            <div className="grid gap-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    {labels.providerStatus}
                  </h2>
                  <Badge
                    tone={providerStatus.email.ready ? "success" : "danger"}
                  >
                    {providerStatus.email.ready
                      ? labels.ready
                      : labels.notReady}
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {labels.providerStatusDescription}
                </p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  [labels.emailProvider, providerStatus.email.provider ?? "—"],
                  [
                    labels.transport,
                    providerStatus.email.transport === "smtp"
                      ? "SES SMTP"
                      : "SES API",
                  ],
                  [labels.region, providerStatus.email.region ?? "—"],
                  [labels.senderEmail, providerStatus.email.senderEmail ?? "—"],
                  [labels.senderName, providerStatus.email.senderName ?? "—"],
                  [labels.replyTo, providerStatus.email.replyTo ?? "—"],
                  ...(providerStatus.email.transport === "smtp"
                    ? [
                        [
                          labels.smtpHost,
                          providerStatus.email.smtp.host ?? "—",
                        ],
                        [
                          labels.smtpPort,
                          providerStatus.email.smtp.port?.toString() ?? "—",
                        ],
                        [
                          labels.smtpSecurity,
                          providerStatus.email.smtp.security?.toUpperCase() ??
                            "—",
                        ],
                        [
                          labels.smtpUsername,
                          providerStatus.email.smtp.username.masked ??
                            labels.notConfigured,
                        ],
                        [
                          labels.smtpPassword,
                          providerStatus.email.smtp.password.masked ??
                            labels.notConfigured,
                        ],
                      ]
                    : [
                        [
                          labels.accessKeyId,
                          providerStatus.email.accessKeyId.masked ??
                            labels.notConfigured,
                        ],
                        [
                          labels.secretAccessKey,
                          providerStatus.email.secretAccessKey.masked ??
                            labels.notConfigured,
                        ],
                        [
                          labels.sessionToken,
                          providerStatus.email.sessionToken.configured
                            ? providerStatus.email.sessionToken.masked
                            : labels.notConfigured,
                        ],
                      ]),
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border border-slate-200 bg-slate-50 p-4"
                  >
                    <dt className="text-xs font-medium text-slate-500">
                      {label}
                    </dt>
                    <dd
                      dir="ltr"
                      className="mt-2 break-all text-sm font-medium text-slate-900"
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="text-xs leading-5 text-slate-500">
                {labels.secretNotice}
              </p>
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <div className="grid gap-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {labels.testEmail}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {labels.testEmailDescription}
                </p>
              </div>

              <ProviderTestEmailForm
                action={sendNotificationTestEmailAction}
                locale={locale}
                labels={labels}
              />
            </div>
          </Panel>
        </>
      ) : null}

      <Panel className="p-5 sm:p-6">
        <div className="grid gap-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {labels.deliveryLog}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {labels.deliveryLogDescription}
            </p>
          </div>

          <form
            method="get"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {session.user.accountScope === "PLATFORM" ? (
              <select
                name="companyId"
                defaultValue={companyId ?? ""}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
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
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">
                {labels.type}: {labels.all}
              </option>
              {(["NOTIFICATION", "INVITATION", "TEST"] as const).map(
                (value) => (
                  <option key={value} value={value}>
                    {labels.kinds[value]}
                  </option>
                ),
              )}
            </select>

            <select
              name="channel"
              defaultValue={channel ?? ""}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
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
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">
                {labels.status}: {labels.all}
              </option>
              {(
                ["PENDING", "PROCESSING", "SENT", "FAILED", "SKIPPED"] as const
              ).map((value) => (
                <option key={value} value={value}>
                  {labels.statuses[value]}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="h-10 rounded-md bg-[#714b67] px-4 text-sm font-medium text-white hover:bg-[#62405a]"
            >
              {labels.deliveryLog}
            </button>
          </form>

          {deliveries.items.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              {labels.emptyLog}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-start text-xs text-slate-500">
                    <th className="px-3 py-3 text-start">{labels.created}</th>
                    <th className="px-3 py-3 text-start">{labels.company}</th>
                    <th className="px-3 py-3 text-start">{labels.recipient}</th>
                    <th className="px-3 py-3 text-start">{labels.type}</th>
                    <th className="px-3 py-3 text-start">{labels.channel}</th>
                    <th className="px-3 py-3 text-start">{labels.status}</th>
                    <th className="px-3 py-3 text-start">{labels.attempts}</th>
                    <th className="px-3 py-3 text-start">
                      {labels.failureCode}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.items.map((item) => (
                    <tr
                      key={`${item.kind}-${item.id}`}
                      className="border-b border-slate-100 align-top"
                    >
                      <td className="whitespace-nowrap px-3 py-4 text-slate-600">
                        {formatDate(item.createdAt, locale)}
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {item.companyName ?? "—"}
                      </td>
                      <td
                        dir="ltr"
                        className="max-w-[260px] break-all px-3 py-4 text-slate-700"
                      >
                        {item.recipient}
                      </td>
                      <td className="px-3 py-4">
                        <Badge>
                          {item.templateKey === "admin.broadcast"
                            ? broadcastLabels.logType
                            : labels.kinds[item.kind]}
                        </Badge>
                      </td>
                      <td className="px-3 py-4">
                        <Badge>{labels.channels[item.channel]}</Badge>
                      </td>
                      <td className="px-3 py-4">
                        <Badge tone={statusTone(item.status)}>
                          {labels.statuses[item.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {item.attemptCount}
                      </td>
                      <td
                        dir="ltr"
                        className="max-w-[220px] break-all px-3 py-4 text-xs text-slate-600"
                      >
                        {item.failureCode ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hasPrevious || hasNext ? (
            <nav className="flex items-center justify-between gap-3">
              {hasPrevious ? (
                <Link
                  href={`/admin/notifications?${queryString({
                    ...baseFilters,
                    offset: String(previousOffset),
                  })}`}
                  className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700"
                >
                  {labels.previous}
                </Link>
              ) : (
                <span />
              )}

              {hasNext ? (
                <Link
                  href={`/admin/notifications?${queryString({
                    ...baseFilters,
                    offset: String(nextOffset),
                  })}`}
                  className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700"
                >
                  {labels.next}
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
