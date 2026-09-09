"use client";

import type {
  Locale,
  ServiceSubscriptionDetails,
  SubscriptionTerm,
} from "@odookrd/types";
import { useActionState, useId, useState } from "react";

import { formatDate } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import {
  SUBSCRIPTION_TERMS,
  type SubscriptionsDictionary,
} from "@/lib/i18n/services/subscriptions";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

interface SubscriptionPanelProps {
  details: ServiceSubscriptionDetails;
  billingModel: "PERPETUAL" | "SUBSCRIPTION";
  labels: SubscriptionsDictionary;
  createAction: Action;
  updateAction: Action;
  renewAction: Action;
  cancelAction: Action;
  locale: Locale;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-sm text-slate-900">{children}</span>
    </div>
  );
}

function TermSelect({
  id,
  name,
  labels,
  defaultValue,
  onChange,
}: {
  id: string;
  name: string;
  labels: SubscriptionsDictionary;
  defaultValue?: SubscriptionTerm;
  onChange?: (term: SubscriptionTerm) => void;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue ?? "ANNUAL"}
      onChange={(event) => onChange?.(event.target.value as SubscriptionTerm)}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
    >
      {SUBSCRIPTION_TERMS.map((term) => (
        <option key={term} value={term}>
          {labels.termLabels[term]}
        </option>
      ))}
    </select>
  );
}

export function SubscriptionPanel({
  details,
  billingModel,
  labels,
  createAction,
  updateAction,
  renewAction,
  cancelAction,
  locale,
}: SubscriptionPanelProps) {
  const showDate = (value: string | null): string =>
    value ? formatDate(value, locale) : "—";
  const fieldId = useId();
  const [createTerm, setCreateTerm] = useState<SubscriptionTerm>("ANNUAL");
  const [renewTerm, setRenewTerm] = useState<SubscriptionTerm>(
    details.subscription?.term ?? "ANNUAL",
  );

  const [createState, createFormAction, creating] = useActionState(
    createAction,
    { message: null },
  );
  const [updateState, updateFormAction, updating] = useActionState(
    updateAction,
    { message: null },
  );
  const [renewState, renewFormAction, renewing] = useActionState(renewAction, {
    message: null,
  });
  const [cancelState, cancelFormAction, cancelling] = useActionState(
    cancelAction,
    { message: null },
  );

  if (billingModel === "PERPETUAL") {
    return (
      <p className="text-sm text-slate-500">{labels.notSubscriptionBilled}</p>
    );
  }

  const subscription = details.subscription;

  if (!subscription) {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-slate-500">{labels.noneDescription}</p>
        <form action={createFormAction} className="grid max-w-2xl gap-4">
          <div className="grid gap-1">
            <label htmlFor={`${fieldId}-term`} className="text-sm font-medium">
              {labels.term}
            </label>
            <TermSelect
              id={`${fieldId}-term`}
              name="term"
              labels={labels}
              onChange={setCreateTerm}
            />
          </div>

          <div className="grid gap-1">
            <label
              htmlFor={`${fieldId}-startsAt`}
              className="text-sm font-medium"
            >
              {labels.startsAt}
            </label>
            <input
              id={`${fieldId}-startsAt`}
              name="startsAt"
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {createTerm === "CUSTOM" ? (
            <div className="grid gap-1">
              <label
                htmlFor={`${fieldId}-endsAt`}
                className="text-sm font-medium"
              >
                {labels.endsAt}
              </label>
              <input
                id={`${fieldId}-endsAt`}
                name="endsAt"
                type="date"
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-500">{labels.endsAtHint}</p>
            </div>
          ) : null}

          <div className="grid gap-1">
            <label htmlFor={`${fieldId}-grace`} className="text-sm font-medium">
              {labels.gracePeriodDays}
            </label>
            <input
              id={`${fieldId}-grace`}
              name="gracePeriodDays"
              type="number"
              min={0}
              max={90}
              defaultValue={0}
              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="autoRenew" value="true" />
            {labels.autoRenew}
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="trial" value="true" />
            {labels.trial}
          </label>

          <div className="grid gap-1">
            <label htmlFor={`${fieldId}-ref`} className="text-sm font-medium">
              {labels.externalBillingRef}
            </label>
            <input
              id={`${fieldId}-ref`}
              name="externalBillingRef"
              maxLength={200}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">
              {labels.externalBillingRefHint}
            </p>
          </div>

          {createState.message ? (
            <p className="text-sm text-rose-600">{createState.message}</p>
          ) : null}

          <button
            type="submit"
            disabled={creating}
            className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {creating ? labels.creating : labels.create}
          </button>
        </form>
      </div>
    );
  }

  const { entitlement } = details;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={labels.status}>
          {labels.statusLabels[entitlement.state] ?? entitlement.state}
        </Field>
        <Field label={labels.term}>
          {labels.termLabels[subscription.term]}
        </Field>
        <Field label={labels.periodEnd}>
          {showDate(subscription.currentPeriodEnd)}
        </Field>
        <Field label={labels.daysRemaining}>
          {entitlement.daysRemaining ?? "—"}
        </Field>
        <Field label={labels.accessEndsAt}>
          {showDate(entitlement.accessEndsAt)}
        </Field>
        <Field label={labels.gracePeriodDays}>
          {subscription.gracePeriodDays}
        </Field>
        <Field label={labels.autoRenew}>
          {subscription.autoRenew ? labels.yes : labels.no}
        </Field>
        <Field label={labels.externalBillingRef}>
          {subscription.externalBillingRef ?? "—"}
        </Field>
      </div>

      {entitlement.inGrace ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {labels.inGrace}
        </p>
      ) : null}

      <form action={updateFormAction} className="grid max-w-2xl gap-4">
        <div className="grid gap-1">
          <label
            htmlFor={`${fieldId}-update-term`}
            className="text-sm font-medium"
          >
            {labels.term}
          </label>
          <TermSelect
            id={`${fieldId}-update-term`}
            name="term"
            labels={labels}
            defaultValue={subscription.term}
          />
        </div>

        <div className="grid gap-1">
          <label
            htmlFor={`${fieldId}-update-grace`}
            className="text-sm font-medium"
          >
            {labels.gracePeriodDays}
          </label>
          <input
            id={`${fieldId}-update-grace`}
            name="gracePeriodDays"
            type="number"
            min={0}
            max={90}
            defaultValue={subscription.gracePeriodDays}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="autoRenew"
            value="true"
            defaultChecked={subscription.autoRenew}
          />
          {labels.autoRenew}
        </label>

        <div className="grid gap-1">
          <label
            htmlFor={`${fieldId}-update-ref`}
            className="text-sm font-medium"
          >
            {labels.externalBillingRef}
          </label>
          <input
            id={`${fieldId}-update-ref`}
            name="externalBillingRef"
            maxLength={200}
            defaultValue={subscription.externalBillingRef ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {updateState.message ? (
          <p className="text-sm text-rose-600">{updateState.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={updating}
          className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {updating ? labels.updating : labels.update}
        </button>
      </form>

      <form
        action={renewFormAction}
        className="grid max-w-2xl gap-4 border-t border-slate-200 pt-6"
      >
        <div className="grid gap-1">
          <label
            htmlFor={`${fieldId}-renew-term`}
            className="text-sm font-medium"
          >
            {labels.renew}
          </label>
          <TermSelect
            id={`${fieldId}-renew-term`}
            name="term"
            labels={labels}
            defaultValue={subscription.term}
            onChange={setRenewTerm}
          />
          <p className="text-xs text-slate-500">{labels.renewHint}</p>
        </div>

        {renewTerm === "CUSTOM" ? (
          <div className="grid gap-1">
            <label
              htmlFor={`${fieldId}-renew-endsAt`}
              className="text-sm font-medium"
            >
              {labels.endsAt}
            </label>
            <input
              id={`${fieldId}-renew-endsAt`}
              name="endsAt"
              type="date"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        ) : null}

        {renewState.message ? (
          <p className="text-sm text-rose-600">{renewState.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={renewing}
          className="w-fit rounded-lg border border-slate-900 px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-60"
        >
          {renewing ? labels.renewing : labels.renew}
        </button>
      </form>

      {subscription.status !== "CANCELLED" ? (
        <form
          action={cancelFormAction}
          className="grid max-w-2xl gap-4 border-t border-slate-200 pt-6"
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="atPeriodEnd"
              value="true"
              defaultChecked
            />
            {labels.cancelAtPeriodEndOption}
          </label>

          <div className="grid gap-1">
            <label
              htmlFor={`${fieldId}-cancel-reason`}
              className="text-sm font-medium"
            >
              {labels.reason}
            </label>
            <input
              id={`${fieldId}-cancel-reason`}
              name="reason"
              maxLength={1000}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {cancelState.message ? (
            <p className="text-sm text-rose-600">{cancelState.message}</p>
          ) : null}

          <button
            type="submit"
            disabled={cancelling}
            className="w-fit rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 disabled:opacity-60"
          >
            {cancelling ? labels.cancelling : labels.cancel}
          </button>
        </form>
      ) : null}

      <div className="border-t border-slate-200 pt-6">
        <h3 className="mb-3 text-sm font-semibold">{labels.history}</h3>
        {details.periods.length === 0 ? (
          <p className="text-sm text-slate-500">{labels.historyEmpty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2">{labels.sequence}</th>
                <th className="py-2">{labels.term}</th>
                <th className="py-2">{labels.periodStart}</th>
                <th className="py-2">{labels.periodEnd}</th>
                <th className="py-2">{labels.source}</th>
              </tr>
            </thead>
            <tbody>
              {details.periods.map((period) => (
                <tr key={period.id} className="border-t border-slate-100">
                  <td className="py-2">{period.sequence}</td>
                  <td className="py-2">{labels.termLabels[period.term]}</td>
                  <td className="py-2">{showDate(period.startsAt)}</td>
                  <td className="py-2">{showDate(period.endsAt)}</td>
                  <td className="py-2">
                    {labels.sourceLabels[period.source] ?? period.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
