"use client";

import type {
  Company,
  CompanyServiceAssignment,
  CompanyServiceStatus,
  ManagedService,
} from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import Link from "next/link";
import { useActionState } from "react";

import { LocalizedTextFields } from "@/components/i18n/localized-text-fields";
import type { FormState } from "@/lib/forms";
import type { ServicesDictionary } from "@/lib/i18n/services";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

const statuses: readonly CompanyServiceStatus[] = [
  "PROVISIONING",
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "CANCELLED",
];

type AssignmentFormAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

interface ServiceAssignmentFormProps {
  action: AssignmentFormAction;
  labels: ServicesDictionary;
  content: ContentEditorDictionary;
  companies?: Company[];
  services?: ManagedService[];
  initial?: CompanyServiceAssignment;
  selectedServiceId?: string;
  cancelHref: string;
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15";

export function ServiceAssignmentForm({
  action,
  labels,
  content,
  companies = [],
  services = [],
  initial,
  selectedServiceId,
  cancelHref,
}: ServiceAssignmentFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form action={formAction} className="grid max-w-3xl gap-5">
      {initial ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {labels.company}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {initial.company.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {labels.service}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {initial.service.name}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <label
              htmlFor="assignment-company"
              className="text-sm font-medium text-slate-700"
            >
              {labels.company}
            </label>
            <select
              id="assignment-company"
              name="companyId"
              defaultValue=""
              required
              className={inputClassName}
            >
              <option value="">{labels.chooseCompany}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="assignment-service"
              className="text-sm font-medium text-slate-700"
            >
              {labels.service}
            </label>
            <select
              id="assignment-service"
              name="serviceId"
              defaultValue={selectedServiceId ?? ""}
              required
              className={inputClassName}
            >
              <option value="">{labels.chooseService}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <LocalizedTextFields
        field="displayName"
        label={labels.displayName}
        content={content}
        translations={initial?.displayNameTranslations}
        fallback={initial?.displayName}
        maxLength={200}
      />

      <div className="grid gap-2">
        <label
          htmlFor="assignment-status"
          className="text-sm font-medium text-slate-700"
        >
          {labels.status}
        </label>
        <select
          id="assignment-status"
          name="status"
          defaultValue={initial?.status ?? "PROVISIONING"}
          className={inputClassName}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {labels.assignmentStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="assignment-url"
          className="text-sm font-medium text-slate-700"
        >
          {labels.serviceUrl}
        </label>
        <input
          id="assignment-url"
          name="serviceUrl"
          type="url"
          dir="ltr"
          placeholder="https://"
          defaultValue={initial?.serviceUrl ?? ""}
          maxLength={2048}
          className={inputClassName}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label
            htmlFor="assignment-starts"
            className="text-sm font-medium text-slate-700"
          >
            {labels.startsAt}
          </label>
          <input
            id="assignment-starts"
            name="startsAt"
            type="date"
            dir="ltr"
            defaultValue={initial?.startsAt?.slice(0, 10) ?? ""}
            className={inputClassName}
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="assignment-expires"
            className="text-sm font-medium text-slate-700"
          >
            {labels.expiresAt}
          </label>
          <input
            id="assignment-expires"
            name="expiresAt"
            type="date"
            dir="ltr"
            defaultValue={initial?.expiresAt?.slice(0, 10) ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="assignment-notes"
          className="text-sm font-medium text-slate-700"
        >
          {labels.notes}
        </label>
        <textarea
          id="assignment-notes"
          name="notes"
          defaultValue={initial?.notes ?? ""}
          maxLength={2000}
          rows={3}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="assignment-internal-notes"
          className="text-sm font-medium text-slate-700"
        >
          {labels.internalNotes}
        </label>
        <p className="text-xs text-slate-500">{labels.internalNotesHint}</p>
        <textarea
          id="assignment-internal-notes"
          name="internalNotes"
          defaultValue={initial?.internalNotes ?? ""}
          maxLength={2000}
          rows={3}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15"
        />
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <ActionButton type="submit" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </ActionButton>
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}
