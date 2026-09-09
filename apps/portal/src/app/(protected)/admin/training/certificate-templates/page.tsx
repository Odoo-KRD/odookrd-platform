import {
  PERMISSIONS,
  type TrainingCertificateBackgroundPreset,
  type TrainingCertificateTemplatePage,
} from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { trainingCertificateDesignerDictionaries } from "@/lib/i18n/training/certificate-designer";
import { trainingCertificateDictionaries } from "@/lib/i18n/training/certificates";
import { getTrainingDictionary } from "@/lib/i18n/training/server";

function statusClass(status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "ARCHIVED") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default async function TrainingCertificateTemplatesPage() {
  const [{ session, token }, { locale }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
    getTrainingDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  const [result, presets] = await Promise.all([
    apiRequest<TrainingCertificateTemplatePage>(
      "/training/certificate-templates",
      { token },
    ),
    apiRequest<TrainingCertificateBackgroundPreset[]>(
      "/training/certificate-templates/presets",
      { token },
    ),
  ]);

  const labels = trainingCertificateDictionaries[locale];
  const designer = trainingCertificateDesignerDictionaries[locale];
  const presetByKey = new Map(presets.map((preset) => [preset.key, preset]));

  return (
    <div className="grid gap-7">
      <PageHeading
        title={designer.templateGallery}
        description={designer.templateGalleryDescription}
        actions={
          <Link
            href="/admin/training/certificate-templates/new"
            className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            {labels.addTemplate}
          </Link>
        }
      />

      {result.items.length === 0 ? (
        <Panel className="p-6">
          <EmptyState
            title={labels.noTemplates}
            description={designer.templateGalleryDescription}
          />
        </Panel>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {result.items.map((template) => {
            const preset = template.backgroundPresetKey
              ? presetByKey.get(template.backgroundPresetKey)
              : null;
            const backgroundSource = template.backgroundPresetKey
              ? `/api/training/certificate-templates/presets/${encodeURIComponent(template.backgroundPresetKey)}/artwork`
              : template.backgroundFileAssetId
                ? `/api/files/${encodeURIComponent(template.backgroundFileAssetId)}/content`
                : null;

            return (
              <article
                key={template.id}
                className="overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[1600/1131] overflow-hidden bg-white">
                  {backgroundSource ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${backgroundSource})` }}
                    />
                  ) : null}
                  <div className="absolute inset-x-[18%] top-[22%] text-center">
                    <div
                      className="text-[clamp(11px,1.2vw,18px)] font-bold"
                      style={{ color: template.primaryColor }}
                    >
                      {template.titleTranslations[locale] ??
                        template.titleTranslations.ku ??
                        template.titleTranslations.ar ??
                        template.titleTranslations.en ??
                        labels.certificateTitle}
                    </div>
                    <div className="mt-[8%] text-[clamp(8px,0.8vw,12px)] text-slate-500">
                      {template.introTranslations[locale] ?? ""}
                    </div>
                    <div className="mt-[3%] text-[clamp(13px,1.5vw,22px)] font-bold text-slate-900">
                      STUDENT NAME
                    </div>
                  </div>
                  <div className="absolute inset-x-3 top-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(template.status)}`}
                    >
                      {template.status === "ACTIVE"
                        ? designer.statusActive
                        : template.status === "ARCHIVED"
                          ? designer.statusArchived
                          : designer.statusDraft}
                    </span>
                    {template.isDefault ? (
                      <span className="rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-[10px] font-semibold text-brand">
                        {designer.defaultBadge}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 border-t border-line p-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-content">
                          {template.name}
                        </h2>
                        <p
                          dir="ltr"
                          className="mt-1 truncate text-xs text-muted"
                        >
                          {template.key}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      {template.backgroundPresetKey
                        ? `${designer.preset}: ${preset?.name ?? template.backgroundPresetKey}`
                        : template.backgroundFileAssetId
                          ? `${designer.custom}: ${designer.customBackground}`
                          : designer.noBackground}
                    </p>
                  </div>

                  <Link
                    href={`/admin/training/certificate-templates/${encodeURIComponent(template.id)}`}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-content hover:border-brand/40 hover:bg-surface-subtle"
                  >
                    {designer.editDesigner}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
