import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { ServiceForm } from "@/components/services/service-form";
import { getAdminApiContext } from "@/lib/authorization";
import { getServicesDictionary } from "@/lib/i18n/services-server";

import { createServiceAction } from "../actions";

export default async function NewServicePage() {
  const [{ session }, { services }] = await Promise.all([
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
          action={createServiceAction}
          labels={services}
          cancelHref="/admin/services"
        />
      </Panel>
    </div>
  );
}
