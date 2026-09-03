import {
  PERMISSIONS,
  type TrainingCertificateBackgroundPreset,
} from "@odookrd/types";
import { PageHeading } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { TrainingCertificateTemplateForm } from "@/components/training/training-certificate-template-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { trainingCertificateDesignerDictionaries } from "@/lib/i18n/training-certificate-designer";
import { trainingCertificateDictionaries } from "@/lib/i18n/training-certificates";
import { getTrainingDictionary } from "@/lib/i18n/training-server";

export default async function NewTrainingCertificateTemplatePage() {
  const [{ session, token }, { locale }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
    getTrainingDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  const presets = await apiRequest<TrainingCertificateBackgroundPreset[]>(
    "/training/certificate-templates/presets",
    { token },
  );
  const labels = trainingCertificateDictionaries[locale];
  const designer = trainingCertificateDesignerDictionaries[locale];

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.addTemplate}
        description={designer.designerDescription}
      />
      <TrainingCertificateTemplateForm
        labels={labels}
        designer={designer}
        presets={presets}
        locale={locale}
      />
    </div>
  );
}
