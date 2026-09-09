"use client";

import type {
  Locale,
  NotificationBroadcastCompanySummary,
  NotificationBroadcastOptions,
} from "@odookrd/types";
import { ActionButton, Badge } from "@odookrd/ui";
import { useActionState, useMemo, useState } from "react";

import type { NotificationBroadcastFormState } from "@/app/(protected)/admin/notifications/new/actions";
import type { NotificationBroadcastDictionary } from "@/lib/i18n/notifications/broadcast";

interface NotificationBroadcastFormProps {
  action: (
    previousState: NotificationBroadcastFormState,
    formData: FormData,
  ) => Promise<NotificationBroadcastFormState>;
  locale: Locale;
  initialRequestId: string;
  options: NotificationBroadcastOptions;
  labels: NotificationBroadcastDictionary;
}

export function NotificationBroadcastForm({
  action,
  locale,
  initialRequestId,
  options,
  labels,
}: NotificationBroadcastFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
    result: null,
  });
  const requestId = initialRequestId;
  const [audience, setAudience] = useState<"ALL_CUSTOMERS" | "COMPANY">(
    options.isPlatform ? "ALL_CUSTOMERS" : "COMPANY",
  );
  const [companyId, setCompanyId] = useState(options.companies[0]?.id ?? "");
  const [messageLocale, setMessageLocale] = useState<Locale>(locale);
  const [confirmed, setConfirmed] = useState(false);

  const selectedCompany = useMemo(
    () => options.companies.find((company) => company.id === companyId) ?? null,
    [companyId, options.companies],
  );

  const summary =
    audience === "ALL_CUSTOMERS"
      ? options.allCustomers
      : selectedCompany
        ? {
            companyCount: 1,
            recipientCount: selectedCompany.recipientCount,
            emailCount: selectedCompany.emailCount,
            whatsappCount: selectedCompany.whatsappCount,
            overLimit: selectedCompany.overLimit,
          }
        : null;

  const unavailable =
    !summary || summary.recipientCount < 1 || summary.overLimit;

  const inputDirection = messageLocale === "en" ? "ltr" : "rtl";

  function changeAudience(value: "ALL_CUSTOMERS" | "COMPANY") {
    setAudience(value);
    setConfirmed(false);
  }

  function changeCompany(value: string) {
    setCompanyId(value);
    setConfirmed(false);
  }

  return (
    <form action={formAction} className="grid gap-6">
      <input type="hidden" name="requestId" value={requestId} />

      <div className="grid gap-2">
        <label
          htmlFor="broadcast-audience"
          className="text-sm font-medium text-slate-700"
        >
          {labels.audience}
        </label>

        {options.isPlatform ? (
          <select
            id="broadcast-audience"
            name="audience"
            value={audience}
            onChange={(event) =>
              changeAudience(event.target.value as "ALL_CUSTOMERS" | "COMPANY")
            }
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="ALL_CUSTOMERS">{labels.allCustomers}</option>
            <option value="COMPANY">{labels.selectedCompany}</option>
          </select>
        ) : (
          <>
            <input type="hidden" name="audience" value="COMPANY" />
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {labels.ownCompany}
            </div>
          </>
        )}
      </div>

      {audience === "COMPANY" ? (
        <div className="grid gap-2">
          <label
            htmlFor="broadcast-company"
            className="text-sm font-medium text-slate-700"
          >
            {labels.company}
          </label>
          <select
            id="broadcast-company"
            name="companyId"
            value={companyId}
            onChange={(event) => changeCompany(event.target.value)}
            required
            disabled={!options.isPlatform}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-50"
          >
            {options.companies.map(
              (company: NotificationBroadcastCompanySummary) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ),
            )}
          </select>
          {!options.isPlatform && companyId ? (
            <input type="hidden" name="companyId" value={companyId} />
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          {labels.audienceSummary}
        </h2>

        {summary ? (
          <div className="flex flex-wrap gap-2">
            <Badge>
              {labels.recipients}: {summary.recipientCount}
            </Badge>
            <Badge>
              {labels.companies}: {summary.companyCount}
            </Badge>
            <Badge>
              {labels.emailDestinations}: {summary.emailCount}
            </Badge>
            <Badge>
              {labels.whatsappDestinations}: {summary.whatsappCount}
            </Badge>
          </div>
        ) : null}

        <p className="text-xs leading-5 text-slate-500">
          {labels.activeUsersOnly}
        </p>

        {summary?.recipientCount === 0 ? (
          <p className="text-sm text-amber-700">{labels.noRecipients}</p>
        ) : null}

        {summary?.overLimit ? (
          <p className="text-sm text-red-700">
            {labels.overLimit} ({options.maxRecipients})
          </p>
        ) : null}
      </section>

      <div className="grid gap-2">
        <label
          htmlFor="broadcast-locale"
          className="text-sm font-medium text-slate-700"
        >
          {labels.language}
        </label>
        <select
          id="broadcast-locale"
          name="locale"
          value={messageLocale}
          onChange={(event) => setMessageLocale(event.target.value as Locale)}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          {(["ku", "ar", "en"] as const).map((value) => (
            <option key={value} value={value}>
              {labels.languages[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="broadcast-title"
          className="text-sm font-medium text-slate-700"
        >
          {labels.notificationTitle}
        </label>
        <input
          id="broadcast-title"
          name="title"
          type="text"
          dir={inputDirection}
          required
          maxLength={300}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="broadcast-body"
          className="text-sm font-medium text-slate-700"
        >
          {labels.message}
        </label>
        <textarea
          id="broadcast-body"
          name="body"
          dir={inputDirection}
          required
          maxLength={3500}
          rows={8}
          className="rounded-md border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="broadcast-action-url"
          className="text-sm font-medium text-slate-700"
        >
          {labels.actionUrl}
        </label>
        <input
          id="broadcast-action-url"
          name="actionUrl"
          type="text"
          dir="ltr"
          maxLength={500}
          placeholder="/dashboard"
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
        />
        <p className="text-xs text-slate-500">{labels.actionUrlHint}</p>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-slate-700">
          {labels.channels}
        </legend>

        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["IN_APP", labels.inApp, true],
            ["EMAIL", labels.email, true],
            ["WHATSAPP", labels.whatsapp, false],
          ].map(([value, label, checked]) => (
            <label
              key={String(value)}
              className="flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                name="channels"
                value={String(value)}
                defaultChecked={Boolean(checked)}
                className="size-4 accent-[#714b67]"
              />
              {String(label)}
            </label>
          ))}
        </div>

        <p className="text-xs leading-5 text-slate-500">
          {labels.channelSettingsNotice}
        </p>
        <p className="text-xs leading-5 text-slate-500">
          {labels.backgroundNotice}
        </p>
      </fieldset>

      <label className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          required
          className="mt-0.5 size-4 accent-[#714b67]"
        />
        <span>
          <strong>{labels.confirm}:</strong> {labels.confirmPrefix}
          {summary ? ` (${summary.recipientCount})` : ""}
        </span>
      </label>

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      {state.result ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <strong>{labels.sentTitle}</strong>
          <p className="mt-1">
            {state.result.created
              ? labels.sentDescription
              : labels.duplicateDescription}
          </p>
          <p className="mt-2">
            {labels.recipients}: {state.result.recipientCount}
          </p>
        </div>
      ) : null}

      <div>
        <ActionButton
          type="submit"
          disabled={pending || !confirmed || unavailable}
        >
          {pending ? labels.sending : labels.send}
        </ActionButton>
      </div>
    </form>
  );
}
