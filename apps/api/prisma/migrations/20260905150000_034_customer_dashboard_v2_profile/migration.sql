-- Customer Dashboard V2: self-profile display name and avatar relation.
ALTER TABLE "users"
  ADD COLUMN "display_name" VARCHAR(160),
  ADD COLUMN "avatar_file_asset_id" UUID;

CREATE INDEX "users_avatar_file_asset_idx"
  ON "users"("avatar_file_asset_id");

ALTER TABLE "users"
  ADD CONSTRAINT "users_avatar_file_asset_id_fkey"
  FOREIGN KEY ("avatar_file_asset_id")
  REFERENCES "file_assets"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
