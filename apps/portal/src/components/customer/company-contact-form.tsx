"use client";

import type { CompanyProfile } from "@odookrd/types";
import { useCompanyEditAction } from "@/components/companies/company-edit-modal";

import type { FormState } from "@/lib/forms";
import type { CompanyProfileV2Dictionary } from "@/lib/i18n/company-profile-v2";

interface CompanyContactFormProps {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  company: CompanyProfile;
  labels: CompanyProfileV2Dictionary;
  onSaved?: () => void;
}

export function CompanyContactForm({
  action,
  company,
  labels,
  onSaved,
}: CompanyContactFormProps) {
  const [state, formAction, pending] = useCompanyEditAction(action, onSaved);

  return (
    <form action={formAction} className="grid gap-5 min-w-0 w-full">
      <div
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))",
        }}
        className="grid gap-5 min-w-0"
      >
        <label className="grid gap-2 min-w-0">
          <span className="text-sm font-semibold text-content">
            {labels.email}
          </span>
          <input
            name="contactEmail"
            type="email"
            dir="ltr"
            maxLength={320}
            defaultValue={company.contactEmail ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
          />
        </label>

        <label className="grid gap-2 min-w-0">
          <span className="text-sm font-semibold text-content">
            {labels.website}
          </span>
          <input
            name="websiteUrl"
            type="url"
            dir="ltr"
            maxLength={500}
            placeholder="https://example.com"
            defaultValue={company.websiteUrl ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
          />
        </label>

        <label className="grid gap-2 min-w-0">
          <span className="text-sm font-semibold text-content">
            {labels.phone}
          </span>
          <input
            name="phone"
            type="tel"
            dir="ltr"
            maxLength={32}
            defaultValue={company.phone ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
          />
        </label>

        <label className="grid gap-2 min-w-0">
          <span className="text-sm font-semibold text-content">
            {labels.countryCode}
          </span>
          <input
            name="countryCode"
            dir="ltr"
            maxLength={2}
            placeholder="IQ"
            defaultValue={company.countryCode ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm uppercase text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
          />
        </label>

        <label className="grid gap-2 min-w-0 col-span-full">
          <span className="text-sm font-semibold text-content">
            {labels.addressLine1}
          </span>
          <input
            name="addressLine1"
            maxLength={250}
            defaultValue={company.addressLine1 ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
          />
        </label>

        <label className="grid gap-2 min-w-0 col-span-full">
          <span className="text-sm font-semibold text-content">
            {labels.addressLine2}
          </span>
          <input
            name="addressLine2"
            maxLength={250}
            defaultValue={company.addressLine2 ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
          />
        </label>

        <label className="grid gap-2 min-w-0">
          <span className="text-sm font-semibold text-content">
            {labels.city}
          </span>
          <input
            name="city"
            maxLength={120}
            defaultValue={company.city ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
          />
        </label>

        <label className="grid gap-2 min-w-0">
          <span className="text-sm font-semibold text-content">
            {labels.region}
          </span>
          <input
            name="region"
            maxLength={120}
            defaultValue={company.region ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
          />
        </label>

        <label className="grid gap-2 min-w-0">
          <span className="text-sm font-semibold text-content">
            {labels.postalCode}
          </span>
          <input
            name="postalCode"
            dir="ltr"
            maxLength={32}
            defaultValue={company.postalCode ?? ""}
            className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 min-w-0 w-full box-border"
          />
        </label>
      </div>

      <p className="text-xs leading-5 text-muted">{labels.contactHint}</p>

      {state.message && !state.success ? (
        <p
          role="status"
          className="rounded-md bg-surface-subtle px-3 py-2.5 text-sm text-content"
        >
          {state.message}
        </p>
      ) : null}

      <div className="border-t border-line pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? labels.saving : labels.saveContact}
        </button>
      </div>
    </form>
  );
}
