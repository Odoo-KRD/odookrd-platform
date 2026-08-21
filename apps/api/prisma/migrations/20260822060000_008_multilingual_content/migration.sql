-- Stage 2F is additive: legacy values remain authoritative and are backfilled.
CREATE OR REPLACE FUNCTION odookrd_valid_localized_text(
    translations JSONB,
    maximum_length INTEGER
)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $function$
    SELECT CASE
        WHEN jsonb_typeof(translations) <> 'object' THEN FALSE
        ELSE NOT EXISTS (
            SELECT 1
            FROM jsonb_each(translations) AS entry(locale, value)
            WHERE entry.locale !~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
                OR jsonb_typeof(entry.value) <> 'string'
                OR char_length(btrim(entry.value #>> '{}')) = 0
                OR char_length(entry.value #>> '{}') > maximum_length
        )
    END;
$function$;

ALTER TABLE "companies"
    ADD COLUMN "name_translations" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "companies"
SET "name_translations" = jsonb_build_object('ku', "name");

ALTER TABLE "companies"
    ADD CONSTRAINT "companies_name_translations_check"
    CHECK (odookrd_valid_localized_text("name_translations", 200));

ALTER TABLE "services"
    ADD COLUMN "name_translations" JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN "description_translations" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "services"
SET "name_translations" = jsonb_build_object('ku', "name"),
    "description_translations" = CASE
        WHEN "description" IS NULL OR btrim("description") = '' THEN '{}'::jsonb
        ELSE jsonb_build_object('ku', "description")
    END;

ALTER TABLE "services"
    ADD CONSTRAINT "services_name_translations_check"
    CHECK (odookrd_valid_localized_text("name_translations", 200)),
    ADD CONSTRAINT "services_description_translations_check"
    CHECK (odookrd_valid_localized_text("description_translations", 1000));

ALTER TABLE "company_services"
    ADD COLUMN "display_name_translations" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "company_services"
SET "display_name_translations" = CASE
    WHEN "display_name" IS NULL OR btrim("display_name") = '' THEN '{}'::jsonb
    ELSE jsonb_build_object('ku', "display_name")
END;

ALTER TABLE "company_services"
    ADD CONSTRAINT "company_services_display_name_translations_check"
    CHECK (odookrd_valid_localized_text("display_name_translations", 200));
