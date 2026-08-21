CREATE OR REPLACE FUNCTION enforce_odookrd_company_user_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  configured_value jsonb;
  maximum_users integer := 25;
  current_users bigint;
BEGIN
  IF NEW."account_scope" <> 'COMPANY' OR NEW."company_id" IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW."company_id"::text, 90210)
  );

  SELECT setting."value"
  INTO configured_value
  FROM "settings" AS setting
  WHERE setting."key" = 'companies.max_users_per_company'
    AND setting."scope_key" IN (
      'company:' || NEW."company_id"::text,
      'platform'
    )
  ORDER BY CASE
    WHEN setting."scope_key" = 'company:' || NEW."company_id"::text THEN 0
    ELSE 1
  END
  LIMIT 1;

  IF configured_value IS NOT NULL THEN
    IF jsonb_typeof(configured_value) <> 'number'
      OR configured_value::text !~ '^[0-9]+$'
    THEN
      RAISE EXCEPTION 'Invalid companies.max_users_per_company setting.';
    END IF;

    maximum_users := (configured_value #>> '{}')::integer;
  END IF;

  IF maximum_users < 1 THEN
    RAISE EXCEPTION 'Invalid companies.max_users_per_company setting.';
  END IF;

  SELECT count(*)
  INTO current_users
  FROM "users" AS company_user
  WHERE company_user."company_id" = NEW."company_id"
    AND company_user."id" <> NEW."id";

  IF current_users >= maximum_users THEN
    RAISE EXCEPTION 'Company user limit reached.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'company_user_limit';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_odookrd_company_user_limit_trigger ON "users";

CREATE TRIGGER enforce_odookrd_company_user_limit_trigger
BEFORE INSERT OR UPDATE OF "company_id", "account_scope"
ON "users"
FOR EACH ROW
EXECUTE FUNCTION enforce_odookrd_company_user_limit();
