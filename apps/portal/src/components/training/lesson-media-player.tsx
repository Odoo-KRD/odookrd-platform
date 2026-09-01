import type {
  Locale,
  TrainingCustomerArticleContent,
  TrainingCustomerLessonDetail,
  TrainingCustomerVideoEnrichment,
  TrainingPlayerSettings,
} from "@odookrd/types";

import type { TrainingMediaDictionary } from "@/lib/i18n/training-media";
import { BrandedVideoPlayer } from "./branded-video-player";
import { LessonArticleViewer } from "./lesson-article-viewer";
import { PdfSlideViewer } from "./pdf-slide-viewer";

function articleDocument(
  content: TrainingCustomerArticleContent,
  locale: Locale,
): unknown {
  return (
    content.contentTranslations[locale] ??
    content.contentTranslations.ku ??
    content.contentTranslations.en ??
    content.contentTranslations.ar ??
    null
  );
}

export function LessonMediaPlayer({
  lesson,
  labels,
  locale,
  enrichment,
  playerSettings,
}: {
  lesson: TrainingCustomerLessonDetail;
  labels: TrainingMediaDictionary;
  locale: Locale;
  enrichment?: TrainingCustomerVideoEnrichment;
  playerSettings?: TrainingPlayerSettings;
}) {
  const content = lesson.content ?? lesson.media ?? null;
  if (!content) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center text-sm text-muted">
        {labels.lessonUnavailable}
      </div>
    );
  }
  if (content.type === "VIDEO")
    return (
      <BrandedVideoPlayer
        media={content}
        enrichment={enrichment}
        locale={locale}
        playerSettings={playerSettings}
      />
    );
  if (content.type === "DOCUMENT")
    return <PdfSlideViewer media={content} labels={labels} />;
  if (content.type === "ARTICLE") {
    return <LessonArticleViewer document={articleDocument(content, locale)} />;
  }
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-900">
      {labels.lessonUnavailable}
    </div>
  );
}
