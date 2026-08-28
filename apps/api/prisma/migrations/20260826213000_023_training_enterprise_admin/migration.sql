BEGIN;

ALTER TABLE "training_courses"
  ADD COLUMN "cover_image_asset_id" UUID;

CREATE INDEX "training_courses_cover_image_asset_idx"
  ON "training_courses"("cover_image_asset_id");

ALTER TABLE "training_courses"
  ADD CONSTRAINT "training_courses_cover_image_asset_id_fkey"
  FOREIGN KEY ("cover_image_asset_id")
  REFERENCES "file_assets"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

COMMIT;
