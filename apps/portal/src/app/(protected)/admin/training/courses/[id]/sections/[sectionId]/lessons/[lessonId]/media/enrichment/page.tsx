import {
  PERMISSIONS,
  type Locale,
  type TrainingVideoEnrichmentAdmin,
} from "@odookrd/types";
import { PageHeading } from "@odookrd/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrainingVideoEnrichmentManager } from "@/components/training/training-video-enrichment-manager";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getTrainingDictionary } from "@/lib/i18n/training/server";

const labels: Record<
  Locale,
  { title: string; description: string; back: string }
> = {
  en: {
    title: "Captions & Video Chapters",
    description:
      "Manage protected WebVTT captions and multilingual video navigation chapters.",
    back: "Back to lesson editor",
  },
  ku: {
    title: "ژێرنووس و بەشەکانی ڤیدیۆ",
    description:
      "ژێرنووسی پارێزراوی WebVTT و بەشە فرەزمانەکانی ڤیدیۆ بەڕێوەبەرە.",
    back: "گەڕانەوە بۆ دەستکاریکەری وانە",
  },
  ar: {
    title: "الترجمات وفصول الفيديو",
    description: "إدارة ترجمات WebVTT المحمية وفصول الفيديو متعددة اللغات.",
    back: "العودة إلى محرر الدرس",
  },
};

export default async function TrainingVideoEnrichmentPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string; lessonId: string }>;
}) {
  const [{ token }, { locale }, { id, sectionId, lessonId }] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
      getTrainingDictionary(),
      params,
    ]);

  let initialState: TrainingVideoEnrichmentAdmin;
  try {
    initialState = await apiRequest<TrainingVideoEnrichmentAdmin>(
      `/training/courses/${id}/sections/${sectionId}/lessons/${lessonId}/media/enrichment`,
      { token },
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  const dictionary = labels[locale];

  return (
    <div className="grid gap-6">
      <PageHeading
        title={dictionary.title}
        description={dictionary.description}
        actions={
          <Link
            href={`/admin/training/courses/${id}/sections/${sectionId}/lessons/${lessonId}/editor?tab=content`}
            className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            {dictionary.back}
          </Link>
        }
      />

      <TrainingVideoEnrichmentManager
        courseId={id}
        sectionId={sectionId}
        lessonId={lessonId}
        locale={locale}
        initialState={initialState}
      />
    </div>
  );
}
