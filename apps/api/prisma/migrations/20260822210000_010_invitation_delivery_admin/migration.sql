ALTER TABLE "users"
ADD COLUMN "whatsapp_number" VARCHAR(16);

ALTER TABLE "users"
ADD CONSTRAINT "users_whatsapp_number_e164_check"
CHECK ("whatsapp_number" IS NULL OR "whatsapp_number" ~ '^\+[1-9][0-9]{7,14}$');

CREATE TABLE "user_invitation_dispatches" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "company_id" UUID,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_invitation_dispatches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_invitation_deliveries" (
  "id" UUID NOT NULL,
  "dispatch_id" UUID NOT NULL,
  "channel" "notification_channel" NOT NULL,
  "status" "notification_delivery_status" NOT NULL DEFAULT 'PENDING',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "provider_message_id" VARCHAR(255),
  "failure_code" VARCHAR(80),
  "last_attempt_at" TIMESTAMPTZ(6),
  "sent_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "user_invitation_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_invitation_deliveries_channel_check" CHECK ("channel" IN ('EMAIL', 'WHATSAPP')),
  CONSTRAINT "user_invitation_deliveries_attempt_check" CHECK ("attempt_count" BETWEEN 0 AND 1)
);

CREATE INDEX "user_invitation_dispatches_user_created_idx" ON "user_invitation_dispatches"("user_id", "created_at");
CREATE INDEX "user_invitation_dispatches_company_created_idx" ON "user_invitation_dispatches"("company_id", "created_at");
CREATE UNIQUE INDEX "user_invitation_deliveries_dispatch_channel_unique" ON "user_invitation_deliveries"("dispatch_id", "channel");
CREATE INDEX "user_invitation_deliveries_status_created_idx" ON "user_invitation_deliveries"("status", "created_at");

ALTER TABLE "user_invitation_dispatches" ADD CONSTRAINT "user_invitation_dispatches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_invitation_dispatches" ADD CONSTRAINT "user_invitation_dispatches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_invitation_deliveries" ADD CONSTRAINT "user_invitation_deliveries_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "user_invitation_dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE FUNCTION enforce_user_invitation_dispatch_scope()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE target_company UUID; target_scope account_scope;
BEGIN
  SELECT "company_id", "account_scope" INTO target_company, target_scope FROM "users" WHERE "id" = NEW."user_id";
  IF target_scope IS NULL THEN RAISE EXCEPTION 'Invitation target does not exist.' USING ERRCODE = '23503'; END IF;
  IF (target_scope = 'COMPANY' AND (target_company IS NULL OR NEW."company_id" IS DISTINCT FROM target_company))
     OR (target_scope = 'PLATFORM' AND NEW."company_id" IS NOT NULL) THEN
    RAISE EXCEPTION 'Invitation dispatch scope is invalid.' USING ERRCODE = '23514', CONSTRAINT = 'user_invitation_dispatch_company_scope';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER enforce_user_invitation_dispatch_scope_trigger
BEFORE INSERT OR UPDATE OF "user_id", "company_id" ON "user_invitation_dispatches"
FOR EACH ROW EXECUTE FUNCTION enforce_user_invitation_dispatch_scope();
