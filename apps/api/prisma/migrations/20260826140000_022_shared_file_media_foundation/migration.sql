-- Stage 3B.1 — Shared File / Media Upload Foundation
-- Reusable authenticated file assets for images, PDFs and ordinary attachments.
-- Video upload/transcoding remains outside this substage.
-- PostgreSQL transaction keeps this migration atomic.

BEGIN;

CREATE TYPE "file_asset_kind" AS ENUM ('IMAGE', 'DOCUMENT', 'ATTACHMENT');
CREATE TYPE "file_storage_provider" AS ENUM ('LOCAL', 'AWS_S3');
CREATE TYPE "file_asset_status" AS ENUM ('READY', 'DELETED');

CREATE TABLE "file_assets" (
  "id" UUID NOT NULL,
  "account_scope" "account_scope" NOT NULL,
  "company_id" UUID,
  "kind" "file_asset_kind" NOT NULL,
  "storage_provider" "file_storage_provider" NOT NULL,
  "storage_key" VARCHAR(512) NOT NULL,
  "original_filename" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(127) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "sha256" VARCHAR(64) NOT NULL,
  "status" "file_asset_status" NOT NULL DEFAULT 'READY',
  "uploaded_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "deleted_at" TIMESTAMPTZ(6),

  CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "file_assets_scope_check" CHECK (
    ("account_scope" = 'PLATFORM' AND "company_id" IS NULL)
    OR ("account_scope" = 'COMPANY' AND "company_id" IS NOT NULL)
  ),
  CONSTRAINT "file_assets_size_check" CHECK ("size_bytes" > 0),
  CONSTRAINT "file_assets_sha256_check" CHECK ("sha256" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "file_assets_storage_key_check" CHECK (char_length(btrim("storage_key")) BETWEEN 1 AND 512),
  CONSTRAINT "file_assets_filename_check" CHECK (char_length(btrim("original_filename")) BETWEEN 1 AND 255),
  CONSTRAINT "file_assets_status_check" CHECK (
    ("status" = 'READY' AND "deleted_at" IS NULL)
    OR ("status" = 'DELETED' AND "deleted_at" IS NOT NULL)
  ),
  CONSTRAINT "file_assets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "file_assets_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "file_assets_storage_provider_storage_key_key"
  ON "file_assets"("storage_provider", "storage_key");
CREATE INDEX "file_assets_company_id_idx" ON "file_assets"("company_id");
CREATE INDEX "file_assets_account_scope_status_idx" ON "file_assets"("account_scope", "status");
CREATE INDEX "file_assets_company_id_status_idx" ON "file_assets"("company_id", "status");
CREATE INDEX "file_assets_kind_idx" ON "file_assets"("kind");
CREATE INDEX "file_assets_uploaded_by_user_id_idx" ON "file_assets"("uploaded_by_user_id");
CREATE INDEX "file_assets_created_at_idx" ON "file_assets"("created_at");

INSERT INTO "permissions"
  ("id", "key", "name", "description", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'files.read', 'Read files', 'Read file metadata and content within the authorized scope.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'files.upload', 'Upload files', 'Upload supported files within the authorized scope.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'files.manage', 'Manage files', 'Delete file assets within the authorized scope.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."key" IN ('files.read', 'files.upload', 'files.manage')
WHERE r."key" IN ('platform_admin', 'company_admin')
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."key" IN ('files.read', 'files.upload')
WHERE r."key" = 'company_user'
ON CONFLICT DO NOTHING;

COMMIT;
