CREATE TYPE "service_category" AS ENUM (
    'ODOO', 'HOSTING', 'DOMAIN', 'SUPPORT', 'TRAINING', 'OTHER'
);

CREATE TYPE "service_catalog_status" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE "company_service_status" AS ENUM (
    'PROVISIONING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED'
);

CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" "service_category" NOT NULL,
    "description" VARCHAR(1000),
    "status" "service_catalog_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "services_key_format_check" CHECK (
        "key" ~ '^[a-z][a-z0-9_-]{1,99}$'
    )
);

CREATE UNIQUE INDEX "services_key_key" ON "services" ("key");

CREATE INDEX "services_category_status_idx"
    ON "services" ("category", "status");

CREATE TABLE "company_services" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "display_name" VARCHAR(200),
    "status" "company_service_status" NOT NULL DEFAULT 'PROVISIONING',
    "service_url" VARCHAR(2048),
    "starts_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "notes" VARCHAR(2000),
    "internal_notes" VARCHAR(2000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_services_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_services_dates_check" CHECK (
        "starts_at" IS NULL
        OR "expires_at" IS NULL
        OR "starts_at" <= "expires_at"
    ),
    CONSTRAINT "company_services_url_https_check" CHECK (
        "service_url" IS NULL OR "service_url" ~ '^https://'
    )
);

CREATE INDEX "company_services_company_status_idx"
    ON "company_services" ("company_id", "status");

CREATE INDEX "company_services_service_id_idx"
    ON "company_services" ("service_id");

CREATE INDEX "company_services_expires_at_idx"
    ON "company_services" ("expires_at");

ALTER TABLE "company_services"
    ADD CONSTRAINT "company_services_company_id_fkey"
    FOREIGN KEY ("company_id")
    REFERENCES "companies" ("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE "company_services"
    ADD CONSTRAINT "company_services_service_id_fkey"
    FOREIGN KEY ("service_id")
    REFERENCES "services" ("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
