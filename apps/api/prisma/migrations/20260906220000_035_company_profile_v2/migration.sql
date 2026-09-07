BEGIN;

CREATE TYPE "company_identity_change_request_status" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

ALTER TABLE "companies"
  ADD COLUMN "slug" VARCHAR(160),
  ADD COLUMN "contact_email" VARCHAR(320),
  ADD COLUMN "website_url" VARCHAR(500),
  ADD COLUMN "phone" VARCHAR(32),
  ADD COLUMN "address_line_1" VARCHAR(250),
  ADD COLUMN "address_line_2" VARCHAR(250),
  ADD COLUMN "city" VARCHAR(120),
  ADD COLUMN "region" VARCHAR(120),
  ADD COLUMN "postal_code" VARCHAR(32),
  ADD COLUMN "country_code" CHAR(2),
  ADD COLUMN "logo_file_asset_id" UUID;

UPDATE "companies"
SET "slug" = 'company-' || replace("id"::text, '-', '')
WHERE "slug" IS NULL;

CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");
CREATE INDEX "companies_logo_file_asset_idx" ON "companies"("logo_file_asset_id");

ALTER TABLE "companies"
  ADD CONSTRAINT "companies_logo_file_asset_id_fkey"
  FOREIGN KEY ("logo_file_asset_id")
  REFERENCES "file_assets"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE TABLE "company_identity_change_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "requested_by_user_id" UUID NOT NULL,
  "proposed_name" VARCHAR(200),
  "proposed_logo_file_asset_id" UUID,
  "status" "company_identity_change_request_status" NOT NULL DEFAULT 'PENDING',
  "review_note" VARCHAR(1000),
  "reviewed_by_user_id" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_identity_change_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_identity_request_has_change"
    CHECK ("proposed_name" IS NOT NULL OR "proposed_logo_file_asset_id" IS NOT NULL)
);

CREATE INDEX "company_identity_change_requests_company_id_status_idx"
  ON "company_identity_change_requests"("company_id", "status");
CREATE INDEX "company_identity_change_requests_requested_by_user_id_idx"
  ON "company_identity_change_requests"("requested_by_user_id");
CREATE INDEX "company_identity_change_requests_reviewed_by_user_id_idx"
  ON "company_identity_change_requests"("reviewed_by_user_id");
CREATE INDEX "company_identity_change_requests_proposed_logo_file_asset_id_idx"
  ON "company_identity_change_requests"("proposed_logo_file_asset_id");
CREATE INDEX "company_identity_change_requests_created_at_idx"
  ON "company_identity_change_requests"("created_at");

ALTER TABLE "company_identity_change_requests"
  ADD CONSTRAINT "company_identity_change_requests_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_identity_change_requests"
  ADD CONSTRAINT "company_identity_change_requests_requested_by_user_id_fkey"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_identity_change_requests"
  ADD CONSTRAINT "company_identity_change_requests_reviewed_by_user_id_fkey"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "company_identity_change_requests"
  ADD CONSTRAINT "company_identity_change_requests_proposed_logo_file_asset_id_fkey"
  FOREIGN KEY ("proposed_logo_file_asset_id") REFERENCES "file_assets"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "company_identity_change_requests_one_pending_idx"
  ON "company_identity_change_requests"("company_id")
  WHERE "status" = 'PENDING';

COMMIT;
