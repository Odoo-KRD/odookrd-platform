import {
  PERMISSIONS,
  type Company,
  type ManagedService,
  type PaginatedResult,
} from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { ServiceAssignmentForm } from "@/components/services/service-assignment-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getServicesDictionary } from "@/lib/i18n/services-server";

import { createAssignmentAction } from "../actions";

interface AssignServicePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AssignServicePage({
  searchParams,
}: AssignServicePageProps) {
  const [{ session, token }, { services }, parameters] = await Promise.all([
    getAdminApiContext(PERMISSIONS.SERVICES_MANAGE),
    getServicesDictionary(),
    searchParams,
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  const [companies, catalog] = await Promise.all([
    apiRequest<PaginatedResult<Company>>(
      "/companies?status=ACTIVE&limit=100&offset=0",
      {
        token,
      },
    ),
    apiRequest<PaginatedResult<ManagedService>>(
      "/services?status=ACTIVE&limit=100&offset=0",
      {
        token,
      },
    ),
  ]);

  return (
    <div className="grid gap-7">
      <PageHeading
        title={services.assignService}
        description={services.description}
      />
      <Panel className="p-6 sm:p-8">
        <ServiceAssignmentForm
          action={createAssignmentAction}
          labels={services}
          companies={companies.items}
          services={catalog.items}
          selectedServiceId={
            typeof parameters.serviceId === "string"
              ? parameters.serviceId
              : undefined
          }
          cancelHref="/admin/services"
        />
      </Panel>
    </div>
  );
}
