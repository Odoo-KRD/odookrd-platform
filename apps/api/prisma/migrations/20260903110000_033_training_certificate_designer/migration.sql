-- Stage 3C.5C — Enterprise Certificate Designer & Preview

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'training_certificate_template_status'
  ) THEN
    CREATE TYPE "training_certificate_template_status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
  END IF;
END $$;

ALTER TABLE "training_certificate_templates"
  ADD COLUMN IF NOT EXISTS "intro_translations" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "status" "training_certificate_template_status" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "background_preset_key" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "layout_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "layout_config" JSONB NOT NULL DEFAULT '{}';

UPDATE "training_certificate_templates"
SET "status" = 'DRAFT'
WHERE "active" = FALSE AND "status" = 'ACTIVE';

CREATE INDEX IF NOT EXISTS "training_certificate_templates_status_name_idx"
ON "training_certificate_templates"("status", "name");

CREATE INDEX IF NOT EXISTS "training_certificate_templates_background_preset_idx"
ON "training_certificate_templates"("background_preset_key");

CREATE UNIQUE INDEX IF NOT EXISTS "training_certificate_templates_single_default_idx"
ON "training_certificate_templates"(("is_default"))
WHERE "is_default" = TRUE AND "status" <> 'ARCHIVED';

ALTER TABLE "training_certificates"
  ADD COLUMN IF NOT EXISTS "template_layout_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "template_snapshot" JSONB NOT NULL DEFAULT '{}';
