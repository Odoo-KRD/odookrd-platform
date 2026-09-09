import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { ProviderTestEmailForm } from "@/components/notifications/provider-test-email-form";
import { getAdminApiContext } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin/server";
import { notificationAdministrationDictionaries } from "@/lib/i18n/notifications/administration";

import { sendNotificationTestEmailAction } from "../actions";

export default async function NotificationTestEmailPage() {
  const [{ session }, { locale }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.NOTIFICATIONS_MANAGE),
    getAdminDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/admin/notifications/deliveries");
  }

  const labels = notificationAdministrationDictionaries[locale];

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.testEmail}
        description={labels.testEmailDescription}
      />

      <Panel className="p-5 sm:p-7">
        <ProviderTestEmailForm
          action={sendNotificationTestEmailAction}
          locale={locale}
          labels={labels}
        />
      </Panel>
    </div>
  );
}
