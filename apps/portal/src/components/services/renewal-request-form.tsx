"use client";

import type {
  ServiceEntitlement,
  SubscriptionRenewalRequest,
  SubscriptionTerm,
} from "@odookrd/types";
import { useActionState, useId } from "react";

import type { FormState } from "@/lib/forms";
import {
  SUBSCRIPTION_TERMS,
  type SubscriptionsDictionary,
} from "@/lib/i18n/subscriptions";

interface RenewalRequestFormProps {
  entitlement: ServiceEntitlement;
  pending: SubscriptionRenewalRequest | null;
  labels: SubscriptionsDictionary;
  requestAction: (state: FormState, formData: FormData) => Promise<FormState>;
  withdrawAction: (state: FormState, formData: FormData) => Promise<FormState>;
}

export function RenewalRequestForm({
  entitlement,
  pending,
  labels,
  requestAction,
  withdrawAction,
}: RenewalRequestFormProps) {
  const fieldId = useId();
  const [requestState, requestFormAction, requesting] = useActionState(
    requestAction,
    { message: null },
  );
  const [withdrawState, withdrawFormAction, withdrawing] = useActionState(
    withdrawAction,
    { message: null },
  );

  // Perpetual services have nothing to renew.
  if (entitlement.state === "PERPETUAL") {
    return null;
  }

  if (pending) {
    return (
      <div className="grid gap-3">
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {labels.requestPending}
        </p>
        <p className="text-sm text-muted">
          {labels.term}:{" "}
          <span className="font-medium text-content">
            {labels.termLabels[pending.requestedTerm]}
          </span>
        </p>
        <form action={withdrawFormAction}>
          <input type="hidden" name="requestId" value={pending.id} />
          {withdrawState.message ? (
            <p className="mb-2 text-sm text-rose-600">
              {withdrawState.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={withdrawing}
            className="w-fit rounded-lg border border-line px-4 py-2 text-sm font-medium text-content disabled:opacity-60"
          >
            {labels.withdrawRequest}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={requestFormAction} className="grid max-w-xl gap-4">
      <p className="text-sm text-muted">{labels.requestRenewalHint}</p>

      <div className="grid gap-1">
        <label htmlFor={`${fieldId}-term`} className="text-sm font-medium">
          {labels.term}
        </label>
        <select
          id={`${fieldId}-term`}
          name="requestedTerm"
          defaultValue="ANNUAL"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          {SUBSCRIPTION_TERMS.filter(
            (term: SubscriptionTerm) => term !== "CUSTOM",
          ).map((term) => (
            <option key={term} value={term}>
              {labels.termLabels[term]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <label htmlFor={`${fieldId}-note`} className="text-sm font-medium">
          {labels.note}
        </label>
        <textarea
          id={`${fieldId}-note`}
          name="note"
          maxLength={1000}
          rows={3}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
      </div>

      {requestState.message ? (
        <p className="text-sm text-rose-600">{requestState.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={requesting}
        className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {requesting
          ? labels.requestRenewalSubmitting
          : labels.requestRenewalSubmit}
      </button>
    </form>
  );
}
