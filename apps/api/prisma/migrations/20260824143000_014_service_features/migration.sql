CREATE TYPE "service_feature_value_type" AS ENUM ('BOOLEAN', 'NUMBER', 'TEXT');

CREATE TYPE "service_feature_status" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "service_features" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "description" VARCHAR(1000),
    "description_translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "value_type" "service_feature_value_type" NOT NULL,
    "default_value" JSONB NOT NULL,
    "value_translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "unit" VARCHAR(32),
    "status" "service_feature_status" NOT NULL DEFAULT 'ACTIVE',
    "customer_visible" BOOLEAN NOT NULL DEFAULT TRUE,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "service_features_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_features_key_format_check"
        CHECK ("key" ~ '^[a-z][a-z0-9_-]{1,99}$'),
    CONSTRAINT "service_features_sort_order_check"
        CHECK ("sort_order" BETWEEN 0 AND 10000),
    CONSTRAINT "service_features_name_translations_check"
        CHECK (odookrd_valid_localized_text("name_translations", 200)),
    CONSTRAINT "service_features_description_translations_check"
        CHECK (odookrd_valid_localized_text("description_translations", 1000)),
    CONSTRAINT "service_features_value_translations_check"
        CHECK (odookrd_valid_localized_text("value_translations", 500)),
    CONSTRAINT "service_features_value_type_check" CHECK (
        ("value_type" = 'BOOLEAN'
            AND jsonb_typeof("default_value") = 'boolean'
            AND "unit" IS NULL
            AND "value_translations" = '{}'::jsonb)
        OR ("value_type" = 'NUMBER'
            AND jsonb_typeof("default_value") = 'number'
            AND "value_translations" = '{}'::jsonb)
        OR ("value_type" = 'TEXT'
            AND jsonb_typeof("default_value") = 'string'
            AND char_length(btrim("default_value" #>> '{}')) BETWEEN 1 AND 500
            AND "unit" IS NULL)
    ),
    CONSTRAINT "service_features_non_monetary_unit_check" CHECK (
        "unit" IS NULL OR upper(btrim("unit")) NOT IN (
            'USD', 'IQD', 'EUR', 'GBP', 'AED', 'SAR', 'DOLLAR', 'DOLLARS',
            'DINAR', 'DINARS', 'EURO', 'EUROS', '$', '€', '£'
        )
    )
);

CREATE UNIQUE INDEX "service_features_service_id_key_unique"
    ON "service_features" ("service_id", "key");

CREATE INDEX "service_features_service_status_sort_idx"
    ON "service_features" ("service_id", "status", "sort_order", "id");

ALTER TABLE "service_features"
    ADD CONSTRAINT "service_features_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "services" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
