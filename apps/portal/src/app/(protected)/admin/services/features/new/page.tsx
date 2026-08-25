import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { FeatureDefinitionForm } from "@/components/services/feature-definition-form";
import { getAdminApiContext } from "@/lib/authorization";
import { getServicesDictionary } from "@/lib/i18n/services-server";

import { createFeatureDefinitionAction } from "../../actions";

export default async function NewFeatureDefinitionPage() {
  const [{ session }, { services, serviceFeatures, content }] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.SERVICES_MANAGE),
      getServicesDictionary(),
    ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  return (
    <div className="grid gap-7">
      <PageHeading
        title={serviceFeatures.newFeatureDefinition}
        description={serviceFeatures.featureDefinitionsDescription}
      />
      <Panel className="p-6 sm:p-8">
        <FeatureDefinitionForm
          action={createFeatureDefinitionAction}
          labels={services}
          features={serviceFeatures}
          content={content}
        />
      </Panel>
    </div>
  );
}
