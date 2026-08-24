ALTER TABLE "roles"
ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

UPDATE "roles"
SET "is_system" = true
WHERE "key" IN ('platform_admin', 'company_admin', 'company_user');
