ALTER TABLE "service_features"
    DROP CONSTRAINT "service_features_value_type_check",
    ADD CONSTRAINT "service_features_value_type_check" CHECK (
        ("value_type" = 'BOOLEAN'
            AND jsonb_typeof("default_value") = 'boolean'
            AND "unit" IS NULL
            AND "value_translations" = '{}'::jsonb)
        OR ("value_type" = 'NUMBER'
            AND jsonb_typeof("default_value") = 'number'
            AND "value_translations" = '{}'::jsonb)
        OR ("value_type" = 'STORAGE'
            AND jsonb_typeof("default_value") = 'number'
            AND ("unit" IS NULL OR "unit" IN ('MB', 'GB', 'TB'))
            AND "value_translations" = '{}'::jsonb)
        OR ("value_type" = 'TEXT'
            AND jsonb_typeof("default_value") = 'string'
            AND char_length(btrim("default_value" #>> '{}')) BETWEEN 1 AND 500
            AND "unit" IS NULL)
    );

ALTER TABLE "service_feature_definitions"
    DROP CONSTRAINT "service_feature_definitions_typed_value_check",
    ADD CONSTRAINT "service_feature_definitions_typed_value_check" CHECK (
        ("value_type" = 'BOOLEAN'
            AND jsonb_typeof("default_value") = 'boolean'
            AND "unit" IS NULL
            AND "value_translations" = '{}'::jsonb)
        OR ("value_type" = 'NUMBER'
            AND jsonb_typeof("default_value") = 'number'
            AND "value_translations" = '{}'::jsonb)
        OR ("value_type" = 'STORAGE'
            AND jsonb_typeof("default_value") = 'number'
            AND ("unit" IS NULL OR "unit" IN ('MB', 'GB', 'TB'))
            AND "value_translations" = '{}'::jsonb)
        OR ("value_type" = 'TEXT'
            AND jsonb_typeof("default_value") = 'string'
            AND char_length(btrim("default_value" #>> '{}')) BETWEEN 1 AND 500
            AND "unit" IS NULL)
    );
