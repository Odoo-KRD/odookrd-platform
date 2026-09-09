import { randomUUID } from "node:crypto";

import { PERMISSIONS, type NotificationBroadcastOptions } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { NotificationBroadcastForm } from "@/components/notifications/notification-broadcast-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin/server";
import { notificationBroadcastDictionaries } from "@/lib/i18n/notifications/broadcast";

import { sendNotificationBroadcastAction } from "../../new/actions";

export default async function NewNotificationBroadcastPage() {
  const [{ token }, { locale }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.NOTIFICATIONS_MANAGE),
    getAdminDictionary(),
  ]);

  const options = await apiRequest<NotificationBroadcastOptions>(
    "/notification-administration/broadcasts/options",
    { token },
  );

  const labels = notificationBroadcastDictionaries[locale];

  return (
    <div className="grid gap-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title={labels.title} description={labels.description} />
        <Link
          href="/admin/notifications/broadcasts"
          className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content"
        >
          {labels.back}
        </Link>
      </div>

      <Panel className="p-5 sm:p-7">
        <NotificationBroadcastForm
          action={sendNotificationBroadcastAction}
          locale={locale}
          initialRequestId={randomUUID()}
          options={options}
          labels={labels}
        />
      </Panel>
    </div>
  );
}
