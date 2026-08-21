"use client";

import type {
  ManagedService,
  ServiceCatalogStatus,
  ServiceCategory,
} from "@odookrd/types";
import { ActionButton } from "@odookrd/ui";
import Link from "next/link";
import { useActionState } from "react";

import type { FormState } from "@/lib/forms";
import type { ServicesDictionary } from "@/lib/i18n/services";

const categories: readonly ServiceCategory[] = [
  "ODOO",
  "HOSTING",
  "DOMAIN",
  "SUPPORT",
  "TRAINING",
  "OTHER",
];

const statuses: readonly ServiceCatalogStatus[] = ["ACTIVE", "INACTIVE"];

type ServiceFormAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

interface ServiceFormProps {
  action: ServiceFormAction;
  labels: ServicesDictionary;
  initial?: ManagedService;
  cancelHref: string;
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15";

export function ServiceForm({
  action,
  labels,
  initial,
  cancelHref,
}: ServiceFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <div className="grid gap-2">
        <label
          htmlFor="service-key"
          className="text-sm font-medium text-slate-700"
        >
          {labels.key}
        </label>
        <input
          id="service-key"
          name="key"
          type="text"
          dir="ltr"
          defaultValue={initial?.key ?? ""}
          pattern="[a-z][a-z0-9_-]{1,99}"
          maxLength={100}
          disabled={initial !== undefined}
          required={initial === undefined}
          className={inputClassName + " disabled:bg-slate-50"}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="service-name"
          className="text-sm font-medium text-slate-700"
        >
          {labels.name}
        </label>
        <input
          id="service-name"
          name="name"
          type="text"
          defaultValue={initial?.name ?? ""}
          maxLength={200}
          required
          className={inputClassName}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label
            htmlFor="service-category"
            className="text-sm font-medium text-slate-700"
          >
            {labels.category}
          </label>
          <select
            id="service-category"
            name="category"
            defaultValue={initial?.category ?? "ODOO"}
            className={inputClassName}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {labels.categoryLabels[category]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="service-status"
            className="text-sm font-medium text-slate-700"
          >
            {labels.status}
          </label>
          <select
            id="service-status"
            name="status"
            defaultValue={initial?.status ?? "ACTIVE"}
            className={inputClassName}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {labels.catalogStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="service-description"
          className="text-sm font-medium text-slate-700"
        >
          {labels.serviceDescription}
        </label>
        <textarea
          id="service-description"
          name="description"
          defaultValue={initial?.description ?? ""}
          maxLength={1000}
          rows={4}
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
