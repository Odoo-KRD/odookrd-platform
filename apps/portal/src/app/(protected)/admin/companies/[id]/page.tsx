import { PERMISSIONS, type Company } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { CompanyForm } from "@/components/companies/company-form";
import { CompanyStatusBadge } from "@/components/companies/company-status-badge";
import { CompanyStatusForm } from "@/components/companies/company-status-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getAdminDictionary } from "@/lib/i18n/admin-server";

import { updateCompanyAction, updateCompanyStatusAction } from "../actions";

interface CompanyDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailsPage({
  params,
}: CompanyDetailsPageProps) {
  const [{ session, token }, { locale, admin, content }, { id }] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.COMPANIES_READ),
      getAdminDictionary(),
      params,
    ]);

  const company = await apiRequest<Company>(
    `/companies/${encodeURIComponent(id)}`,
    { token },
  );

  const canManage = hasPermission(session, PERMISSIONS.COMPANIES_MANAGE);
  const canChangeStatus = canManage && session.user.accountScope === "PLATFORM";

  return (
    <div className="grid gap-7">
      <PageHeading
        title={company.name}
        description={admin.companies.detailsTitle}
        actions={
          <Link
            href="/admin/companies"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {admin.companies.cancel}
          </Link>
        }
      />

      <Panel className="p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {admin.companies.status}
            </p>
            <div className="mt-3">
              <CompanyStatusBadge
                status={company.status}
                labels={admin.companies}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              {admin.companies.created}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-800">
              {formatDate(company.createdAt, locale)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              {admin.companies.updated}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-800">
              {formatDate(company.updatedAt, locale)}
            </p>
          </div>
        </div>
      </Panel>

      {canManage ? (
        <Panel className="p-6 sm:p-8">
          <h2 className="mb-6 text-base font-semibold text-slate-900">
            {admin.companies.editTitle}
          </h2>
          <CompanyForm
            action={updateCompanyAction.bind(null, company.id)}
            labels={admin.companies}
            content={content}
            initialName={company.name}
            initialTranslations={company.nameTranslations}
            cancelHref="/admin/companies"
          />
        </Panel>
      ) : null}

      {canChangeStatus ? (
        <Panel className="p-6 sm:p-8">
          <h2 className="mb-6 text-base font-semibold text-slate-900">
            {admin.companies.changeStatus}
          </h2>
          <CompanyStatusForm
            action={updateCompanyStatusAction.bind(null, company.id)}
            labels={admin.companies}
            currentStatus={company.status}
          />
        </Panel>
      ) : null}
    </div>
  );
}
