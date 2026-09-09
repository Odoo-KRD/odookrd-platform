"use client";

import type { CompanyServiceStatus } from "@odookrd/types";
import { useActionState, useId, useState } from "react";

import type { FormState } from "@/lib/forms";
import type { ServiceFeaturesDictionary } from "@/lib/i18n/services/features";
import type { ServicesDictionary } from "@/lib/i18n/services";

interface ServiceLifecycleFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  currentStatus: CompanyServiceStatus;
  labels: ServicesDictionary;
  features: ServiceFeaturesDictionary;
}

const allowedTransitions: Record<
  CompanyServiceStatus,
  readonly CompanyServiceStatus[]
> = {
  PROVISIONING: ["ACTIVE", "SUSPENDED", "CANCELLED"],
  ACTIVE: ["SUSPENDED", "EXPIRED", "CANCELLED"],
  SUSPENDED: ["ACTIVE", "EXPIRED", "CANCELLED"],
  EXPIRED: ["ACTIVE", "CANCELLED"],
  CANCELLED: [],
};

export function ServiceLifecycleForm({
  action,
  currentStatus,
  labels,
  features,
}: ServiceLifecycleFormProps) {
  const fieldId = useId();
  const availableStatuses = allowedTransitions[currentStatus];
  const [selectedStatus, setSelectedStatus] = useState(
    availableStatuses[0] ?? "",
  );
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  if (availableStatuses.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {labels.assignmentStatusLabels.CANCELLED}
      </p>
    );
  }

  const requiresReason =
    selectedStatus === "SUSPENDED" || selectedStatus === "CANCELLED";

  return (
    <form action={formAction} className="grid max-w-2xl gap-4">
      <div className="grid gap-2">
        <label
          htmlFor={`${fieldId}-status`}
          className="text-sm font-medium text-slate-700"
        >
          {labels.status}
        </label>
        <select
          id={`${fieldId}-status`}
          name="toStatus"
          value={selectedStatus}
          onChange={(event) =>
            setSelectedStatus(event.currentTarget.value as CompanyServiceStatus)
          }
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {labels.assignmentStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={`${fieldId}-reason`}
          className="text-sm font-medium text-slate-700"
        >
          {features.transitionReason}
        </label>
        <textarea
          id={`${fieldId}-reason`}
          name="reason"
          required={requiresReason}
          maxLength={1000}
          rows={3}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
        <p className="text-xs text-slate-500">{features.reasonHint}</p>
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {pending ? labels.saving : features.changeStatus}
        </button>
      </div>
    </form>
  );
}
