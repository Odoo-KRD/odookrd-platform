export const TRAINING_STORAGE_PROVIDERS = ['AWS_S3', 'LOCAL'] as const;
export type TrainingStorageProvider =
  (typeof TRAINING_STORAGE_PROVIDERS)[number];

export const DEFAULT_TRAINING_STORAGE_PROVIDER: TrainingStorageProvider =
  'AWS_S3';
export const LOCAL_TRAINING_TRANSCODING_ENABLED = false;
export const DEFAULT_LESSON_COMPLETION_PERCENTAGE = 90;
