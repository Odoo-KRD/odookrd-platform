"use client";

import { useActionState, useId } from "react";

import type { FormState } from "@/lib/forms";
import type { SubscriptionsDictionary } from "@/lib/i18n/services/subscriptions";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

interface RenewalReviewActionsProps {
  labels: SubscriptionsDictionary;
  approveAction: Action;
  rejectAction: Action;
}

export function RenewalReviewActions({
  labels,
  approveAction,
  rejectAction,
}: RenewalReviewActionsProps) {
  const fieldId = useId();
  const [approveState, approveFormAction, approving] = useActionState(
    approveAction,
    { message: null },
  );
  const [rejectState, rejectFormAction, rejecting] = useActionState(
    rejectAction,
    { message: null },
  );

  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <label htmlFor={`${fieldId}-note`} className="text-sm font-medium">
          {labels.reviewNote}
        </label>
        <input
          id={`${fieldId}-note`}
          form={`${fieldId}-approve`}
          name="reviewNote"
          maxLength={1000}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {(approveState.message ?? rejectState.message) ? (
        <p className="text-sm text-rose-600">
          {approveState.message ?? rejectState.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <form id={`${fieldId}-approve`} action={approveFormAction}>
          <button
            type="submit"
            disabled={approving || rejecting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {approving ? labels.approving : labels.approve}
          </button>
        </form>

        <form action={rejectFormAction}>
          <button
            type="submit"
            disabled={approving || rejecting}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 disabled:opacity-60"
          >
            {rejecting ? labels.rejecting : labels.reject}
          </button>
        </form>
      </div>
    </div>
  );
}
