ALTER TABLE "training_certificate_templates"
ADD COLUMN "logo_file_asset_id" UUID,
ADD COLUMN "background_file_asset_id" UUID,
ADD COLUMN "signature_file_asset_id" UUID;

CREATE INDEX "training_certificate_templates_logo_file_asset_idx"
ON "training_certificate_templates"("logo_file_asset_id");

CREATE INDEX "training_certificate_templates_background_file_asset_idx"
ON "training_certificate_templates"("background_file_asset_id");

CREATE INDEX "training_certificate_templates_signature_file_asset_idx"
ON "training_certificate_templates"("signature_file_asset_id");

ALTER TABLE "training_certificate_templates"
ADD CONSTRAINT "training_certificate_templates_logo_file_asset_id_fkey"
FOREIGN KEY ("logo_file_asset_id")
REFERENCES "file_assets"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "training_certificate_templates"
ADD CONSTRAINT "training_certificate_templates_background_file_asset_id_fkey"
FOREIGN KEY ("background_file_asset_id")
REFERENCES "file_assets"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "training_certificate_templates"
ADD CONSTRAINT "training_certificate_templates_signature_file_asset_id_fkey"
FOREIGN KEY ("signature_file_asset_id")
REFERENCES "file_assets"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
