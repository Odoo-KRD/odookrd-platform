-- Allow platform administrators to receive company-scoped notifications.
--
-- The trigger from migration 009 required every recipient to be a COMPANY user
-- of the notification's own company. That contradicts the application layer,
-- where NotificationsService.publish() accepts allowPlatformRecipients and
-- AdminEventNotificationService relies on it for every operational alert:
-- renewal requested, certificate issued, course completed, and now knowledge
-- base feedback. Those alerts are about a company but are addressed to staff,
-- so no company user is a valid recipient for them.
--
-- The company-match rule is unchanged for COMPANY recipients: a company user
-- still cannot receive another company's notification. The only new case is a
-- PLATFORM-scoped user, whose own company_id is NULL by definition, being
-- allowed as a recipient. The recipient row's company_id must still match the
-- notification's, so the notification stays attributable to one company.

CREATE OR REPLACE FUNCTION enforce_notification_recipient_scope()
RETURNS TRIGGER
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

    -- The notification must still belong to the company named on the row.
    IF notification_company IS NULL
       OR notification_company <> NEW."company_id"
    THEN
        RAISE EXCEPTION 'Notification recipient company scope is invalid.'
          USING ERRCODE = '23514',
                CONSTRAINT = 'notification_recipient_company_scope';
    END IF;

    -- A company recipient must belong to that same company.
    IF recipient_account_scope = 'COMPANY'
       AND (recipient_user_company IS NULL
            OR recipient_user_company <> NEW."company_id")
    THEN
        RAISE EXCEPTION 'Notification recipient company scope is invalid.'
          USING ERRCODE = '23514',
                CONSTRAINT = 'notification_recipient_company_scope';
    END IF;

    -- Anything that is neither a COMPANY nor a PLATFORM user is rejected.
    IF recipient_account_scope IS NULL
       OR recipient_account_scope NOT IN ('COMPANY', 'PLATFORM')
    THEN
        RAISE EXCEPTION 'Notification recipient company scope is invalid.'
          USING ERRCODE = '23514',
                CONSTRAINT = 'notification_recipient_company_scope';
    END IF;

    RETURN NEW;
END;
$function$;
