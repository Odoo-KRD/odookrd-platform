"use client";

import type { CompanyProfile } from "@odookrd/types";

import { CompanyContactForm } from "@/components/customer/company-contact-form";
import { CompanyEditModalDialog } from "@/components/companies/company-edit-modal";
import type { FormState } from "@/lib/forms";
import type { CompanyProfileV2Dictionary } from "@/lib/i18n/company-profile-v2";

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20ZM13.5 7.5l3 3" />
    </svg>
  );
}

export function CustomerCompanyContactEditModal({
  action,
  company,
  labels,
}: {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  company: CompanyProfile;
  labels: CompanyProfileV2Dictionary;
}) {
  return (
    <CompanyEditModalDialog
      title={labels.contact}
      description={labels.contactDescription}
      closeLabel={labels.close}
      triggerLabel={labels.edit}
      triggerClassName="inline-flex size-8 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:bg-surface-subtle hover:text-content"
      triggerContent={<PencilIcon />}
      widthClassName="max-w-3xl"
    >
      {(onSaved) => (
        <CompanyContactForm
          action={action}
          company={company}
          labels={labels}
          onSaved={onSaved}
        />
      )}
    </CompanyEditModalDialog>
  );
}
