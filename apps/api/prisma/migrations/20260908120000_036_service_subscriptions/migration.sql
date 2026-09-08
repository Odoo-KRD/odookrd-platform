BEGIN;

CREATE TYPE "service_billing_model" AS ENUM (
  'PERPETUAL',
  'SUBSCRIPTION'
);

CREATE TYPE "subscription_term" AS ENUM (
  'MONTHLY',
  'QUARTERLY',
  'SEMI_ANNUAL',
  'ANNUAL',
  'BIENNIAL',
  'TRIENNIAL',
  'CUSTOM'
);

CREATE TYPE "subscription_status" AS ENUM (
  'TRIAL',
  'ACTIVE',
  'GRACE',
  'EXPIRED',
  'CANCELLED'
);

CREATE TYPE "subscription_period_source" AS ENUM (
  'INITIAL',
  'MANUAL_RENEWAL',
  'AUTO_RENEWAL',
  'ADMIN_ADJUSTMENT'
);

CREATE TYPE "subscription_renewal_request_status" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

-- Existing catalogue services keep their current behaviour: the default marks
-- every row PERPETUAL, so nothing is subscription-gated until an operator
-- explicitly switches a service over in Stage 4D.
ALTER TABLE "services"
  ADD COLUMN "billing_model" "service_billing_model" NOT NULL DEFAULT 'PERPETUAL';

CREATE INDEX "services_billing_model_idx"
  ON "services"("billing_model");

CREATE TABLE "subscriptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_service_id" UUID NOT NULL,
  "term" "subscription_term" NOT NULL,
  "status" "subscription_status" NOT NULL DEFAULT 'ACTIVE',
  "auto_renew" BOOLEAN NOT NULL DEFAULT FALSE,
  "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT FALSE,
  "current_period_start" TIMESTAMPTZ(6) NOT NULL,
  "current_period_end" TIMESTAMPTZ(6) NOT NULL,
  "grace_period_days" INTEGER NOT NULL DEFAULT 0,
  "external_billing_ref" VARCHAR(200),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_period_ordered"
    CHECK ("current_period_end" > "current_period_start"),
  CONSTRAINT "subscriptions_grace_period_bounded"
    CHECK ("grace_period_days" >= 0 AND "grace_period_days" <= 90)
);

CREATE UNIQUE INDEX "subscriptions_company_service_id_key"
  ON "subscriptions"("company_service_id");
CREATE INDEX "subscriptions_status_period_end_idx"
  ON "subscriptions"("status", "current_period_end");
CREATE INDEX "subscriptions_period_end_idx"
  ON "subscriptions"("current_period_end");
CREATE INDEX "subscriptions_auto_renew_period_end_idx"
  ON "subscriptions"("auto_renew", "current_period_end");

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_company_service_id_fkey"
  FOREIGN KEY ("company_service_id") REFERENCES "company_services"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "subscription_periods" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "subscription_id" UUID NOT NULL,
  "sequence" INTEGER NOT NULL,
  "term" "subscription_term" NOT NULL,
  "starts_at" TIMESTAMPTZ(6) NOT NULL,
  "ends_at" TIMESTAMPTZ(6) NOT NULL,
  "source" "subscription_period_source" NOT NULL DEFAULT 'INITIAL',
  "actor_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscription_periods_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscription_periods_ordered"
    CHECK ("ends_at" > "starts_at"),
  CONSTRAINT "subscription_periods_sequence_positive"
    CHECK ("sequence" >= 1)
);

CREATE UNIQUE INDEX "subscription_periods_subscription_sequence_unique"
  ON "subscription_periods"("subscription_id", "sequence");
CREATE INDEX "subscription_periods_subscription_ends_at_idx"
  ON "subscription_periods"("subscription_id", "ends_at" DESC);
CREATE INDEX "subscription_periods_actor_user_id_idx"
  ON "subscription_periods"("actor_user_id");

ALTER TABLE "subscription_periods"
  ADD CONSTRAINT "subscription_periods_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_periods"
  ADD CONSTRAINT "subscription_periods_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "subscription_renewal_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "subscription_id" UUID NOT NULL,
  "requested_by_user_id" UUID NOT NULL,
  "requested_term" "subscription_term" NOT NULL,
  "status" "subscription_renewal_request_status" NOT NULL DEFAULT 'PENDING',
  "note" VARCHAR(1000),
  "review_note" VARCHAR(1000),
  "reviewed_by_user_id" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscription_renewal_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscription_renewal_requests_reviewed_together"
    CHECK (
      ("reviewed_by_user_id" IS NULL AND "reviewed_at" IS NULL)
      OR ("reviewed_at" IS NOT NULL)
    )
);

CREATE INDEX "subscription_renewal_requests_subscription_status_idx"
  ON "subscription_renewal_requests"("subscription_id", "status");
CREATE INDEX "subscription_renewal_requests_requested_by_idx"
  ON "subscription_renewal_requests"("requested_by_user_id");
CREATE INDEX "subscription_renewal_requests_reviewed_by_idx"
  ON "subscription_renewal_requests"("reviewed_by_user_id");
CREATE INDEX "subscription_renewal_requests_created_at_idx"
  ON "subscription_renewal_requests"("created_at");

-- A customer may only have one renewal awaiting review per subscription, so a
-- double-submitted request is rejected by the database rather than by timing.
CREATE UNIQUE INDEX "subscription_renewal_requests_one_pending_idx"
  ON "subscription_renewal_requests"("subscription_id")
  WHERE "status" = 'PENDING';

ALTER TABLE "subscription_renewal_requests"
  ADD CONSTRAINT "subscription_renewal_requests_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_renewal_requests"
  ADD CONSTRAINT "subscription_renewal_requests_requested_by_user_id_fkey"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subscription_renewal_requests"
  ADD CONSTRAINT "subscription_renewal_requests_reviewed_by_user_id_fkey"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
