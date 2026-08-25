CREATE TYPE "company_service_feature_source" AS ENUM (
    'CATALOG_DEFAULT', 'ADMIN_OVERRIDE'
);

CREATE TABLE "company_service_features" (
    "id" UUID NOT NULL,
    "company_service_id" UUID NOT NULL,
    "service_feature_id" UUID NOT NULL,
    "value" JSONB NOT NULL,
    "value_translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "source" "company_service_feature_source" NOT NULL DEFAULT 'CATALOG_DEFAULT',
    "customer_visible_override" BOOLEAN,
    "sort_order_override" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_service_features_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_service_features_value_type_check"
        CHECK (jsonb_typeof("value") IN ('boolean', 'number', 'string')),
    CONSTRAINT "company_service_features_value_translations_check"
        CHECK (odookrd_valid_localized_text("value_translations", 500)),
    CONSTRAINT "company_service_features_sort_order_check"
        CHECK ("sort_order_override" IS NULL
            OR "sort_order_override" BETWEEN 0 AND 10000)
);

CREATE UNIQUE INDEX "company_service_features_assignment_feature_unique"
    ON "company_service_features" ("company_service_id", "service_feature_id");

CREATE INDEX "company_service_features_assignment_sort_idx"
    ON "company_service_features" ("company_service_id", "sort_order_override", "id");

CREATE INDEX "company_service_features_feature_id_idx"
    ON "company_service_features" ("service_feature_id");

ALTER TABLE "company_service_features"
    ADD CONSTRAINT "company_service_features_company_service_id_fkey"
    FOREIGN KEY ("company_service_id") REFERENCES "company_services" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_service_features"
    ADD CONSTRAINT "company_service_features_service_feature_id_fkey"
    FOREIGN KEY ("service_feature_id") REFERENCES "service_features" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
