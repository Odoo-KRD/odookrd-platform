"use client";

import type { Locale } from "@odookrd/types";
import { ActionButton, Badge } from "@odookrd/ui";
import { useActionState } from "react";

import type { TestEmailState } from "@/app/(protected)/admin/notifications/actions";
import type { NotificationAdministrationDictionary } from "@/lib/i18n/notifications/administration";

/** Must match TESTABLE_TEMPLATES in the notifications server actions. */
const WHATSAPP_TEST_TEMPLATES = [
  "user.invitation",
  "helpdesk.ticket.replied",
  "helpdesk.ticket.resolved",
  "subscription.reminder",
] as const;

const fieldClass =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15";

/** Same shape and styling as the email test form beside it. */
export function ProviderTestWhatsAppForm({
  action,
  locale,
  labels,
}: {
  action: (
    previousState: TestEmailState,
    formData: FormData,
  ) => Promise<TestEmailState>;
  locale: Locale;
  labels: NotificationAdministrationDictionary;
}) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
    result: null,
  });

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />

      <p className="rounded-md border border-line bg-surface-subtle p-3 text-sm leading-6 text-muted">
        {labels.whatsappTestHint}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-2">
          <label
            htmlFor="notification-test-whatsapp"
            className="text-sm font-medium text-slate-700"
          >
            {labels.destination}
          </label>
          <input
            id="notification-test-whatsapp"
            type="tel"
            name="destination"
            dir="ltr"
            required
            maxLength={24}
            placeholder="+9647501234567"
            className={fieldClass}
          />
        </div>

        <div className="grid content-start gap-2">
          <label
            htmlFor="notification-test-template"
            className="text-sm font-medium text-slate-700"
          >
            {labels.testTemplate}
          </label>
          <select
            id="notification-test-template"
            name="templateKey"
            defaultValue=""
            className={fieldClass}
          >
            <option value="">{labels.testTemplatePlain}</option>
            {WHATSAPP_TEST_TEMPLATES.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <ActionButton type="submit" disabled={pending}>
          {pending ? labels.sendingTestWhatsapp : labels.sendTestWhatsapp}
        </ActionButton>
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      {state.result ? (
        <div
          className={`grid gap-2 rounded-md border p-4 text-sm ${
            state.result.status === "SENT"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <strong>
              {state.result.status === "SENT"
                ? labels.testSent
                : labels.testFailed}
            </strong>
            <Badge>{labels.statuses[state.result.status]}</Badge>
          </div>
          {state.result.failureCode ? (
            <p dir="ltr">
              {labels.failureCode}: {state.result.failureCode}
            </p>
          ) : null}
          {state.result.providerMessageId ? (
            <p dir="ltr" className="break-all">
              {labels.providerMessageId}: {state.result.providerMessageId}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
