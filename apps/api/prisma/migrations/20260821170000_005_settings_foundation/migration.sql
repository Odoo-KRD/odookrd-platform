CREATE TYPE "setting_scope" AS ENUM ('PLATFORM', 'COMPANY');

CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(150) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "value_type" VARCHAR(32) NOT NULL,
    "scope" "setting_scope" NOT NULL,
    "scope_key" VARCHAR(80) NOT NULL,
    "company_id" UUID,
    "value" JSONB,
    "encrypted_value" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "settings_scope_context_check" CHECK (
        (
            "scope" = 'PLATFORM'
            AND "company_id" IS NULL
            AND "scope_key" = 'platform'
        )
        OR (
            "scope" = 'COMPANY'
            AND "company_id" IS NOT NULL
            AND "scope_key" = 'company:' || "company_id"::TEXT
        )
    ),
    CONSTRAINT "settings_value_type_check" CHECK (
        "value_type" IN ('STRING', 'NUMBER', 'BOOLEAN', 'SECRET')
    ),
    CONSTRAINT "settings_secret_storage_check" CHECK (
        (
            "value_type" = 'SECRET'
            AND "encrypted_value" IS NOT NULL
            AND "value" IS NULL
        )
        OR (
            "value_type" <> 'SECRET'
            AND "encrypted_value" IS NULL
            AND "value" IS NOT NULL
        )
    )
);

CREATE UNIQUE INDEX "settings_scope_key_key_unique"
    ON "settings" ("scope_key", "key");

CREATE INDEX "settings_scope_company_id_idx"
    ON "settings" ("scope", "company_id");

CREATE INDEX "settings_category_idx"
    ON "settings" ("category");

ALTER TABLE "settings"
    ADD CONSTRAINT "settings_company_id_fkey"
    FOREIGN KEY ("company_id")
    REFERENCES "companies" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
