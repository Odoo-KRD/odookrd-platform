import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { ServiceForm } from "@/components/services/service-form";
import { getAdminApiContext } from "@/lib/authorization";
import { getServicesDictionary } from "@/lib/i18n/services/server";
import { subscriptionsDictionaries } from "@/lib/i18n/services/subscriptions";

import { createServiceAction } from "../actions";

export default async function NewServicePage() {
  const [{ session }, { locale, services, content }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.SERVICES_MANAGE),
    getServicesDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  return (
    <div className="grid gap-7">
      <PageHeading
        title={services.addService}
        description={services.description}
      />
      <Panel className="p-6 sm:p-8">
        <ServiceForm
          billingLabels={subscriptionsDictionaries[locale]}
          action={createServiceAction}
          labels={services}
          content={content}
          cancelHref="/admin/services"
        />
      </Panel>
    </div>
  );
}
