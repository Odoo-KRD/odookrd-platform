CREATE TYPE "training_video_delivery_mode" AS ENUM ('AWS_AUTOMATED', 'AWS_MANUAL', 'LOCAL');
CREATE TYPE "training_lesson_media_type" AS ENUM ('VIDEO', 'PDF_SLIDES');

ALTER TABLE "training_video_assets"
  ADD COLUMN "delivery_mode" "training_video_delivery_mode" NOT NULL DEFAULT 'AWS_AUTOMATED',
  ADD COLUMN "processed_size_bytes" BIGINT;

ALTER TABLE "training_video_lessons"
  ADD COLUMN "media_type" "training_lesson_media_type" NOT NULL DEFAULT 'VIDEO',
  ADD COLUMN "slide_asset_id" UUID,
  ADD COLUMN "slide_page_count" INTEGER;

ALTER TABLE "training_video_lessons"
  ADD CONSTRAINT "training_video_lessons_slide_asset_id_fkey"
  FOREIGN KEY ("slide_asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "training_video_lessons"
  ADD CONSTRAINT "training_video_lessons_slide_page_count_check"
  CHECK ("slide_page_count" IS NULL OR "slide_page_count" > 0);

CREATE INDEX "training_video_lessons_slide_asset_idx"
  ON "training_video_lessons"("slide_asset_id");
