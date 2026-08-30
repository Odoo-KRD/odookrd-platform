CREATE TYPE "training_lesson_content_type" AS ENUM ('VIDEO', 'DOCUMENT', 'ARTICLE', 'QUIZ');

ALTER TABLE "training_video_lessons"
  ADD COLUMN "content_type" "training_lesson_content_type",
  ADD COLUMN "article_content_translations" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "training_video_lessons"
SET "content_type" = CASE
  WHEN "media_type" = 'PDF_SLIDES' AND "slide_asset_id" IS NOT NULL
    THEN 'DOCUMENT'::"training_lesson_content_type"
  WHEN "media_type" = 'VIDEO' AND "video_asset_id" IS NOT NULL
    THEN 'VIDEO'::"training_lesson_content_type"
  ELSE NULL
END;

ALTER TABLE "training_video_lessons"
  RENAME COLUMN "slide_asset_id" TO "document_asset_id";
ALTER TABLE "training_video_lessons"
  RENAME COLUMN "slide_page_count" TO "document_page_count";

ALTER TABLE "training_video_lessons"
  RENAME CONSTRAINT "training_video_lessons_slide_asset_id_fkey"
  TO "training_video_lessons_document_asset_id_fkey";
ALTER TABLE "training_video_lessons"
  RENAME CONSTRAINT "training_video_lessons_slide_page_count_check"
  TO "training_video_lessons_document_page_count_check";
ALTER INDEX "training_video_lessons_slide_asset_idx"
  RENAME TO "training_video_lessons_document_asset_idx";

ALTER TABLE "training_video_lessons" DROP COLUMN "media_type";
DROP TYPE "training_lesson_media_type";

CREATE TABLE "training_lesson_resources" (
  "id" UUID NOT NULL,
  "lesson_id" UUID NOT NULL,
  "file_asset_id" UUID NOT NULL,
  "title" VARCHAR(250) NOT NULL,
  "title_translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "customer_visible" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "training_lesson_resources_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_lesson_resources_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "training_video_lessons"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "training_lesson_resources_file_asset_id_fkey"
    FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "training_lesson_resources_sort_order_check"
    CHECK ("sort_order" >= 0)
);

CREATE UNIQUE INDEX "training_lesson_resources_lesson_file_unique"
  ON "training_lesson_resources"("lesson_id", "file_asset_id");
CREATE INDEX "training_lesson_resources_lesson_order_idx"
  ON "training_lesson_resources"("lesson_id", "sort_order", "id");
CREATE INDEX "training_lesson_resources_file_asset_idx"
  ON "training_lesson_resources"("file_asset_id");
CREATE INDEX "training_lesson_resources_customer_visible_idx"
  ON "training_lesson_resources"("lesson_id", "customer_visible");
