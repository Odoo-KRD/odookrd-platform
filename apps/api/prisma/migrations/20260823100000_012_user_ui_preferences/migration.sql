CREATE TABLE "user_ui_preferences" (
  "user_id" UUID NOT NULL,
  "sidebar_collapsed" BOOLEAN NOT NULL DEFAULT false,
  "dashboard_preferences" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "user_ui_preferences_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "user_ui_preferences"
ADD CONSTRAINT "user_ui_preferences_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
