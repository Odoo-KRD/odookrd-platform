export const TRAINING_VIDEO_COMPLETION_PERCENTAGE = 90;

export function normalizeVideoPosition(
  value: number,
  durationSeconds: number | null,
): number {
  const position = Math.max(0, Math.floor(value));
  if (!durationSeconds || durationSeconds <= 0) return position;
  return Math.min(position, durationSeconds);
}

export function isVideoLessonComplete(
  furthestPositionSeconds: number,
  durationSeconds: number | null,
): boolean {
  if (!durationSeconds || durationSeconds <= 0) return false;
  const required = Math.ceil(
    (durationSeconds * TRAINING_VIDEO_COMPLETION_PERCENTAGE) / 100,
  );
  return furthestPositionSeconds >= required;
}

export function normalizeDocumentPage(
  value: number,
  pageCount: number,
): number {
  return Math.min(Math.max(1, Math.floor(value)), Math.max(1, pageCount));
}

export function calculateTrainingProgressPercentage(
  completedLessons: number,
  totalLessons: number,
): number {
  if (totalLessons <= 0) return 0;
  return Math.min(
    100,
    Math.max(0, Math.round((completedLessons / totalLessons) * 100)),
  );
}
