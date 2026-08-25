CREATE TABLE "service_feature_definitions" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "description" VARCHAR(1000),
    "description_translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "category" "service_category" NOT NULL,
    "value_type" "service_feature_value_type" NOT NULL,
    "parameter_label" VARCHAR(100) NOT NULL,
    "parameter_label_translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "default_value" JSONB NOT NULL,
    "value_translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "unit" VARCHAR(32),
    "status" "service_feature_status" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "service_feature_definitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_feature_definitions_key_check"
        CHECK ("key" ~ '^[a-z][a-z0-9_-]{1,99}$'),
    CONSTRAINT "service_feature_definitions_sort_order_check"
        CHECK ("sort_order" BETWEEN 0 AND 10000),
    CONSTRAINT "service_feature_definitions_parameter_label_check"
        CHECK (char_length(btrim("parameter_label")) BETWEEN 1 AND 100),
    CONSTRAINT "service_feature_definitions_name_translations_check"
        CHECK (odookrd_valid_localized_text("name_translations", 200)),
    CONSTRAINT "service_feature_definitions_description_translations_check"
        CHECK (odookrd_valid_localized_text("description_translations", 1000)),
    CONSTRAINT "service_feature_definitions_parameter_translations_check"
        CHECK (odookrd_valid_localized_text("parameter_label_translations", 100)),
    CONSTRAINT "service_feature_definitions_value_translations_check"
        CHECK (odookrd_valid_localized_text("value_translations", 500)),
    CONSTRAINT "service_feature_definitions_typed_value_check" CHECK (
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
    CONSTRAINT "service_feature_definitions_non_monetary_unit_check" CHECK (
        "unit" IS NULL OR upper(btrim("unit")) NOT IN (
            'USD', 'IQD', 'EUR', 'GBP', 'AED', 'SAR', 'DOLLAR', 'DOLLARS',
            'DINAR', 'DINARS', 'EURO', 'EUROS', '$', '€', '£'
        )
    )
);

CREATE UNIQUE INDEX "service_feature_definitions_key_key"
    ON "service_feature_definitions" ("key");

CREATE INDEX "service_feature_definitions_category_status_sort_idx"
    ON "service_feature_definitions" ("category", "status", "sort_order", "id");

ALTER TABLE "service_features"
    ADD COLUMN "definition_id" UUID,
    ADD COLUMN "parameter_label" VARCHAR(100),
    ADD COLUMN "parameter_label_translations" JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "service_features"
    ADD CONSTRAINT "service_features_parameter_translations_check"
    CHECK (odookrd_valid_localized_text("parameter_label_translations", 100));

CREATE UNIQUE INDEX "service_features_service_definition_unique"
    ON "service_features" ("service_id", "definition_id");

CREATE INDEX "service_features_definition_id_idx"
    ON "service_features" ("definition_id");

ALTER TABLE "service_features"
    ADD CONSTRAINT "service_features_definition_id_fkey"
    FOREIGN KEY ("definition_id") REFERENCES "service_feature_definitions" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
