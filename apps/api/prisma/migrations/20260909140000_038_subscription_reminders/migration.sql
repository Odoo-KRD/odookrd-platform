BEGIN;

CREATE TYPE "subscription_reminder_milestone" AS ENUM (
  'T_MINUS_30',
  'T_MINUS_14',
  'T_MINUS_7',
  'T_MINUS_1',
  'EXPIRED',
  'GRACE_ENDED'
);

-- One row per reminder actually sent. Including the period end in the unique
-- key means a renewal re-arms every milestone automatically: the new period has
-- a different end, so no row matches and the countdown starts again.
CREATE TABLE "subscription_reminders" (
  "id" UUID NOT NULL,
  "subscription_id" UUID NOT NULL,
  "milestone" "subscription_reminder_milestone" NOT NULL,
  "period_end" TIMESTAMPTZ(6) NOT NULL,
  "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscription_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_reminders_unique"
  ON "subscription_reminders"("subscription_id", "milestone", "period_end");
CREATE INDEX "subscription_reminders_subscription_period_idx"
  ON "subscription_reminders"("subscription_id", "period_end");

ALTER TABLE "subscription_reminders"
  ADD CONSTRAINT "subscription_reminders_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
