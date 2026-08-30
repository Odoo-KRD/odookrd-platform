import {
  FileAssetStatus,
  TrainingLessonContentType,
  TrainingVideoAssetStatus,
} from '../../generated/prisma/enums';

export type TrainingLessonReadinessBlocker =
  | 'NO_CONTENT'
  | 'VIDEO_NOT_READY'
  | 'DOCUMENT_NOT_READY'
  | 'ARTICLE_EMPTY'
  | 'QUIZ_NOT_CONFIGURED';

export interface TrainingLessonReadinessInput {
  contentType: TrainingLessonContentType | null;
  videoStatus?: TrainingVideoAssetStatus | null;
  documentStatus?: FileAssetStatus | null;
  documentPageCount?: number | null;
  articleContentTranslations?: unknown;
  quizConfigured?: boolean;
}

function hasText(value: unknown, depth = 0): boolean {
  if (depth > 30 || value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value))
    return value.some((item) => hasText(item, depth + 1));
  if (typeof value !== 'object') return false;

  const record = value as Record<string, unknown>;
  if (typeof record.text === 'string' && record.text.trim()) return true;
  return Object.values(record).some((item) => hasText(item, depth + 1));
}

export function hasLocalizedRichTextContent(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return ['ku', 'ar', 'en'].some((locale) => hasText(record[locale]));
}

export function evaluateTrainingLessonReadiness(
  input: TrainingLessonReadinessInput,
): { ready: boolean; blockers: TrainingLessonReadinessBlocker[] } {
  const blockers: TrainingLessonReadinessBlocker[] = [];

  if (!input.contentType) {
    blockers.push('NO_CONTENT');
  } else if (input.contentType === TrainingLessonContentType.VIDEO) {
    if (input.videoStatus !== TrainingVideoAssetStatus.READY) {
      blockers.push('VIDEO_NOT_READY');
    }
  } else if (input.contentType === TrainingLessonContentType.DOCUMENT) {
    if (
      input.documentStatus !== FileAssetStatus.READY ||
      !input.documentPageCount ||
      input.documentPageCount <= 0
    ) {
      blockers.push('DOCUMENT_NOT_READY');
    }
  } else if (input.contentType === TrainingLessonContentType.ARTICLE) {
    if (!hasLocalizedRichTextContent(input.articleContentTranslations)) {
      blockers.push('ARTICLE_EMPTY');
    }
  } else if (input.contentType === TrainingLessonContentType.QUIZ) {
    if (!input.quizConfigured) blockers.push('QUIZ_NOT_CONFIGURED');
  }

  return { ready: blockers.length === 0, blockers };
}
