import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { getAdminApiContext } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin-server";
import { notificationBroadcastDictionaries } from "@/lib/i18n/notification-broadcast";

export default async function NotificationBroadcastsPage() {
  const [, { locale }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.NOTIFICATIONS_MANAGE),
    getAdminDictionary(),
  ]);

  const labels = notificationBroadcastDictionaries[locale];

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.title}
        description={labels.description}
        actions={
          <Link
            href="/admin/notifications/broadcasts/new"
            className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
          >
            {labels.openComposer}
          </Link>
        }
      />

      <Panel className="p-6">
        <p className="max-w-3xl text-sm leading-6 text-muted">
          {labels.activeUsersOnly}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          {labels.channelSettingsNotice}
        </p>
      </Panel>
    </div>
  );
}
