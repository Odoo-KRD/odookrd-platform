-- Stage 3B.2R.2E — Role lifecycle foundation.
-- Additive and backwards-compatible: existing roles remain active (NULL).
ALTER TABLE "roles"
  ADD COLUMN "archived_at" TIMESTAMPTZ(6);
