import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { CompanyForm } from "@/components/companies/company-form";
import { requireAdminPermission } from "@/lib/authorization";
import { getAdminDictionary } from "@/lib/i18n/admin/server";

import { createCompanyAction } from "../actions";

export default async function NewCompanyPage() {
  const [session, { companies, content }] = await Promise.all([
    requireAdminPermission(PERMISSIONS.COMPANIES_MANAGE),
    getAdminDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/admin/companies");
  }

  return (
    <div className="grid gap-7">
      <PageHeading
        title={companies.createTitle}
        description={companies.createDescription}
      />

      <Panel className="p-6 sm:p-8">
        <CompanyForm
          action={createCompanyAction}
          labels={companies}
          content={content}
          cancelHref="/admin/companies"
        />
      </Panel>
    </div>
  );
}
