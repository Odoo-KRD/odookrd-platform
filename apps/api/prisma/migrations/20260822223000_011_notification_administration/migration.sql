CREATE TABLE "notification_provider_tests" (
  "id" UUID NOT NULL,
  "actor_user_id" UUID NOT NULL,
  "channel" "notification_channel" NOT NULL,
  "destination" VARCHAR(320) NOT NULL,
  "status" "notification_delivery_status" NOT NULL DEFAULT 'PENDING',
  "attempt_count" INTEGER NOT NULL DEFAULT 1,
  "provider_message_id" VARCHAR(255),
  "failure_code" VARCHAR(80),
  "last_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sent_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "notification_provider_tests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_provider_tests_channel_check"
    CHECK ("channel" IN ('EMAIL', 'WHATSAPP')),
  CONSTRAINT "notification_provider_tests_attempt_check"
    CHECK ("attempt_count" = 1)
);

CREATE INDEX "notification_provider_tests_actor_created_idx"
ON "notification_provider_tests"("actor_user_id", "created_at");

CREATE INDEX "notification_provider_tests_status_created_idx"
ON "notification_provider_tests"("status", "created_at");

ALTER TABLE "notification_provider_tests"
ADD CONSTRAINT "notification_provider_tests_actor_user_id_fkey"
FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE VIEW "notification_delivery_log" AS
SELECT
  d."id",
  'NOTIFICATION'::VARCHAR(20) AS "kind",
  r."company_id",
  c."name" AS "company_name",
  r."user_id",
  COALESCE(d."destination", u."email")::VARCHAR(320) AS "recipient",
  n."template_key"::VARCHAR(150) AS "template_key",
  d."channel",
  d."status",
  d."attempt_count",
  d."provider_message_id",
  d."failure_code",
  d."created_at",
  d."last_attempt_at",
  d."sent_at"
FROM "notification_deliveries" d
JOIN "notification_recipients" r ON r."id" = d."recipient_id"
JOIN "notifications" n ON n."id" = r."notification_id"
JOIN "users" u ON u."id" = r."user_id"
JOIN "companies" c ON c."id" = r."company_id"

UNION ALL

SELECT
  d."id",
  'INVITATION'::VARCHAR(20) AS "kind",
  x."company_id",
  c."name" AS "company_name",
  x."user_id",
  CASE
    WHEN d."channel" = 'WHATSAPP'
      THEN COALESCE(u."whatsapp_number", u."email")
    ELSE u."email"
  END::VARCHAR(320) AS "recipient",
  'account.invitation'::VARCHAR(150) AS "template_key",
  d."channel",
  d."status",
  d."attempt_count",
  d."provider_message_id",
  d."failure_code",
  d."created_at",
  d."last_attempt_at",
  d."sent_at"
FROM "user_invitation_deliveries" d
JOIN "user_invitation_dispatches" x ON x."id" = d."dispatch_id"
JOIN "users" u ON u."id" = x."user_id"
LEFT JOIN "companies" c ON c."id" = x."company_id"

UNION ALL

SELECT
  t."id",
  'TEST'::VARCHAR(20) AS "kind",
  NULL::UUID AS "company_id",
  NULL::VARCHAR(255) AS "company_name",
  t."actor_user_id" AS "user_id",
  t."destination"::VARCHAR(320) AS "recipient",
  'provider.test'::VARCHAR(150) AS "template_key",
  t."channel",
  t."status",
  t."attempt_count",
  t."provider_message_id",
  t."failure_code",
  t."created_at",
  t."last_attempt_at",
  t."sent_at"
FROM "notification_provider_tests" t;
