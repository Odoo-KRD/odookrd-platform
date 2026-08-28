BEGIN;

ALTER TABLE "training_sections"
  ADD COLUMN "rich_description_translations" JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "training_video_lessons"
  ADD COLUMN "rich_description_translations" JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
