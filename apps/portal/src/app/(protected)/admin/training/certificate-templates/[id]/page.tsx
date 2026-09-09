import {
  PERMISSIONS,
  type TrainingCertificateBackgroundPreset,
  type TrainingCertificateTemplate,
} from "@odookrd/types";
import { PageHeading } from "@odookrd/ui";
import { notFound, redirect } from "next/navigation";

import { TrainingCertificateTemplateForm } from "@/components/training/training-certificate-template-form";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { trainingCertificateDesignerDictionaries } from "@/lib/i18n/training/certificate-designer";
import { trainingCertificateDictionaries } from "@/lib/i18n/training/certificates";
import { getTrainingDictionary } from "@/lib/i18n/training/server";

export default async function EditTrainingCertificateTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ session, token }, { locale }, { id }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
    getTrainingDictionary(),
    params,
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  let template: TrainingCertificateTemplate;
  let presets: TrainingCertificateBackgroundPreset[];
  try {
    [template, presets] = await Promise.all([
      apiRequest<TrainingCertificateTemplate>(
        `/training/certificate-templates/${encodeURIComponent(id)}`,
        { token },
      ),
      apiRequest<TrainingCertificateBackgroundPreset[]>(
        "/training/certificate-templates/presets",
        { token },
      ),
    ]);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const labels = trainingCertificateDictionaries[locale];
  const designer = trainingCertificateDesignerDictionaries[locale];

  return (
    <div className="grid gap-7">
      <PageHeading
        title={template.name}
        description={designer.designerDescription}
      />
      <TrainingCertificateTemplateForm
        initial={template}
        labels={labels}
        designer={designer}
        presets={presets}
        locale={locale}
      />
    </div>
  );
}
