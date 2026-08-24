import {
  PERMISSIONS,
  type NotificationProviderAdministrationStatus,
} from "@odookrd/types";
import { Badge, PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin-server";
import { notificationAdministrationDictionaries } from "@/lib/i18n/notification-administration";

export default async function NotificationProvidersPage() {
  const [{ session, token }, { locale }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.NOTIFICATIONS_MANAGE),
    getAdminDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/admin/notifications/deliveries");
  }

  const providerStatus =
    await apiRequest<NotificationProviderAdministrationStatus>(
      "/notification-administration/provider-status",
      { token },
    );

  const labels = notificationAdministrationDictionaries[locale];

  const entries = [
    [labels.emailProvider, providerStatus.email.provider ?? "—"],
    [
      labels.transport,
      providerStatus.email.transport === "smtp" ? "SES SMTP" : "SES API",
    ],
    [labels.region, providerStatus.email.region ?? "—"],
    [labels.senderEmail, providerStatus.email.senderEmail ?? "—"],
    [labels.senderName, providerStatus.email.senderName ?? "—"],
    [labels.replyTo, providerStatus.email.replyTo ?? "—"],
    ...(providerStatus.email.transport === "smtp"
      ? [
          [labels.smtpHost, providerStatus.email.smtp.host ?? "—"],
          [labels.smtpPort, providerStatus.email.smtp.port?.toString() ?? "—"],
          [
            labels.smtpSecurity,
            providerStatus.email.smtp.security?.toUpperCase() ?? "—",
          ],
          [
            labels.smtpUsername,
            providerStatus.email.smtp.username.masked ?? labels.notConfigured,
          ],
          [
            labels.smtpPassword,
            providerStatus.email.smtp.password.masked ?? labels.notConfigured,
          ],
        ]
      : [
          [
            labels.accessKeyId,
            providerStatus.email.accessKeyId.masked ?? labels.notConfigured,
          ],
          [
            labels.secretAccessKey,
            providerStatus.email.secretAccessKey.masked ?? labels.notConfigured,
          ],
          [
            labels.sessionToken,
            providerStatus.email.sessionToken.configured
              ? providerStatus.email.sessionToken.masked
              : labels.notConfigured,
          ],
        ]),
  ];

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.providerStatus}
        description={labels.providerStatusDescription}
      />

      <Panel className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-content">
            {labels.emailProvider}
          </h2>
          <Badge tone={providerStatus.email.ready ? "success" : "danger"}>
            {providerStatus.email.ready ? labels.ready : labels.notReady}
          </Badge>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map(([label, value]) => (
            <div
              key={label}
              className="rounded-md border border-line bg-slate-50 p-4"
            >
              <dt className="text-xs font-medium text-muted">{label}</dt>
              <dd
                dir="ltr"
                className="mt-2 break-all text-sm font-medium text-content"
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-xs leading-5 text-muted">
          {labels.secretNotice}
        </p>
      </Panel>
    </div>
  );
}
