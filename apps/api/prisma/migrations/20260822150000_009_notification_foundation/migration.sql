-- Stage 2H notification foundation is additive and preserves all existing data.
CREATE TYPE "notification_channel" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP');
CREATE TYPE "notification_delivery_status" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED');

CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "template_key" VARCHAR(150) NOT NULL,
    "idempotency_key" VARCHAR(200) NOT NULL,
    "action_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_recipients" (
    "id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "body" VARCHAR(4000) NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notification_recipients_locale_check" CHECK ("locale" IN ('ku', 'ar', 'en'))
);

CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "status" "notification_delivery_status" NOT NULL DEFAULT 'PENDING',
    "destination" VARCHAR(320),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "provider_message_id" VARCHAR(255),
    "failure_code" VARCHAR(80),
    "failure_message" VARCHAR(255),
    "last_attempt_at" TIMESTAMPTZ(6),
    "next_attempt_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notification_deliveries_attempts_check" CHECK (
      "attempt_count" >= 0 AND "max_attempts" BETWEEN 1 AND 10 AND "attempt_count" <= "max_attempts"
    )
);

CREATE UNIQUE INDEX "notifications_company_idempotency_unique"
ON "notifications"("company_id", "idempotency_key");
CREATE INDEX "notifications_company_created_at_idx"
ON "notifications"("company_id", "created_at");
CREATE UNIQUE INDEX "notification_recipients_notification_user_unique"
ON "notification_recipients"("notification_id", "user_id");
CREATE INDEX "notification_recipients_inbox_idx"
ON "notification_recipients"("company_id", "user_id", "read_at", "created_at");
CREATE UNIQUE INDEX "notification_deliveries_recipient_channel_unique"
ON "notification_deliveries"("recipient_id", "channel");
CREATE INDEX "notification_deliveries_retry_idx"
ON "notification_deliveries"("status", "next_attempt_at");

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notification_recipients"
ADD CONSTRAINT "notification_recipients_notification_id_fkey"
FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_recipients"
ADD CONSTRAINT "notification_recipients_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notification_recipients"
ADD CONSTRAINT "notification_recipients_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notification_deliveries"
ADD CONSTRAINT "notification_deliveries_recipient_id_fkey"
FOREIGN KEY ("recipient_id") REFERENCES "notification_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE FUNCTION enforce_notification_recipient_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    notification_company UUID;
    recipient_user_company UUID;
    recipient_account_scope account_scope;
BEGIN
    SELECT "company_id"
      INTO notification_company
      FROM "notifications"
     WHERE "id" = NEW."notification_id";

    SELECT "company_id", "account_scope"
      INTO recipient_user_company, recipient_account_scope
      FROM "users"
     WHERE "id" = NEW."user_id";

    IF notification_company IS NULL
       OR notification_company <> NEW."company_id"
       OR recipient_user_company IS NULL
       OR recipient_user_company <> NEW."company_id"
       OR recipient_account_scope <> 'COMPANY'
    THEN
        RAISE EXCEPTION 'Notification recipient company scope is invalid.'
          USING ERRCODE = '23514',
                CONSTRAINT = 'notification_recipient_company_scope';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER enforce_notification_recipient_scope_trigger
BEFORE INSERT OR UPDATE OF "notification_id", "company_id", "user_id"
ON "notification_recipients"
FOR EACH ROW
EXECUTE FUNCTION enforce_notification_recipient_scope();
