CREATE TYPE "company_service_lifecycle_source" AS ENUM (
    'ADMIN', 'SYSTEM', 'INTEGRATION'
);

CREATE TABLE "company_service_lifecycle_events" (
    "id" UUID NOT NULL,
    "company_service_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "from_status" "company_service_status",
    "to_status" "company_service_status" NOT NULL,
    "source" "company_service_lifecycle_source" NOT NULL DEFAULT 'ADMIN',
    "reason_code" VARCHAR(80),
    "reason" VARCHAR(1000),
    "actor_user_id" UUID,
    "actor_email_snapshot" VARCHAR(320),
    "effective_at" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_service_lifecycle_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_service_lifecycle_events_transition_check"
        CHECK ("from_status" IS NULL OR "from_status" <> "to_status")
);

CREATE INDEX "company_service_lifecycle_assignment_effective_idx"
    ON "company_service_lifecycle_events" (
        "company_service_id", "effective_at" DESC, "id" DESC
    );

CREATE INDEX "company_service_lifecycle_company_effective_idx"
    ON "company_service_lifecycle_events" (
        "company_id", "effective_at" DESC, "id" DESC
    );

CREATE INDEX "company_service_lifecycle_status_effective_idx"
    ON "company_service_lifecycle_events" ("to_status", "effective_at");

ALTER TABLE "company_service_lifecycle_events"
    ADD CONSTRAINT "company_service_lifecycle_events_company_service_id_fkey"
    FOREIGN KEY ("company_service_id") REFERENCES "company_services" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_service_lifecycle_events"
    ADD CONSTRAINT "company_service_lifecycle_events_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "company_service_lifecycle_events"
    ADD CONSTRAINT "company_service_lifecycle_events_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "company_service_lifecycle_events" (
    "id", "company_service_id", "company_id", "from_status", "to_status",
    "source", "effective_at", "metadata", "created_at"
)
SELECT
    gen_random_uuid(), assignment."id", assignment."company_id", NULL,
    assignment."status", 'SYSTEM', assignment."created_at",
    '{"backfilled": true}'::jsonb, CURRENT_TIMESTAMP
FROM "company_services" AS assignment;
