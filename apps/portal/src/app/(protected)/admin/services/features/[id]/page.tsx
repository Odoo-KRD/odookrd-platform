import { PERMISSIONS, type ServiceFeatureDefinition } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { FeatureDefinitionForm } from "@/components/services/feature-definition-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getServicesDictionary } from "@/lib/i18n/services-server";

import { updateFeatureDefinitionAction } from "../../actions";

interface FeatureDefinitionDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function FeatureDefinitionDetailsPage({
  params,
}: FeatureDefinitionDetailsPageProps) {
  const [{ session, token }, { services, serviceFeatures, content }, { id }] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.SERVICES_MANAGE),
      getServicesDictionary(),
      params,
    ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  const definition = await apiRequest<ServiceFeatureDefinition>(
    `/service-feature-definitions/${encodeURIComponent(id)}`,
    { token },
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={definition.name}
        description={serviceFeatures.editFeatureDefinition}
      />
      <Panel className="p-6 sm:p-8">
        <FeatureDefinitionForm
          action={updateFeatureDefinitionAction.bind(null, definition.id)}
          labels={services}
          features={serviceFeatures}
          content={content}
          initial={definition}
        />
      </Panel>
    </div>
  );
}
