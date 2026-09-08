BEGIN;

-- Reconciles long-standing drift between the hand-written migrations and what
-- the Prisma schema declares. Every statement here is cosmetic: no data is
-- touched and no behaviour changes.
--
-- The drift predates the subscription work. Migrations 029 and 035 introduced
-- database-level defaults and constraint names that Prisma does not generate,
-- which left `prisma migrate dev` permanently offering to create an extra
-- migration. Applying this once makes the diff empty again.
--
-- Dropping the id defaults is safe: Prisma always supplies a UUID from the
-- client for @default(uuid()) fields, and nothing in the codebase inserts into
-- these tables with raw SQL.

ALTER TABLE "company_identity_change_requests"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "subscriptions"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "subscription_periods"
  ALTER COLUMN "id" DROP DEFAULT;

ALTER TABLE "subscription_renewal_requests"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "training_video_caption_tracks"
  ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "training_video_chapters"
  ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "company_identity_change_requests"
  RENAME CONSTRAINT "company_identity_change_requests_proposed_logo_file_asset_id_fk"
  TO "company_identity_change_requests_proposed_logo_file_asset__fkey";

ALTER TABLE "training_video_caption_tracks"
  RENAME CONSTRAINT "training_video_caption_tracks_file_asset_fkey"
  TO "training_video_caption_tracks_file_asset_id_fkey";

ALTER TABLE "training_video_caption_tracks"
  RENAME CONSTRAINT "training_video_caption_tracks_video_asset_fkey"
  TO "training_video_caption_tracks_video_asset_id_fkey";

ALTER TABLE "training_video_chapters"
  RENAME CONSTRAINT "training_video_chapters_video_asset_fkey"
  TO "training_video_chapters_video_asset_id_fkey";

ALTER INDEX "company_identity_change_requests_proposed_logo_file_asset_id_id"
  RENAME TO "company_identity_change_requests_proposed_logo_file_asset_i_idx";

COMMIT;