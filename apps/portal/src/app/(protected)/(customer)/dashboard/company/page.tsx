import { PERMISSIONS, type Company } from "@odookrd/types";
import { Badge, PageHeading, Panel } from "@odookrd/ui";
import { notFound } from "next/navigation";

import { CustomerCompanyForm } from "@/components/customer/company-profile-form";
import { apiRequest } from "@/lib/api";
import { getCustomerApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getFrontendDictionary } from "@/lib/i18n/frontend-server";

import { updateCustomerCompanyAction } from "./actions";

export default async function CustomerCompanyProfilePage() {
  const [{ session, token }, { locale, workspace, content }] =
    await Promise.all([
      getCustomerApiContext(PERMISSIONS.COMPANIES_READ),
      getFrontendDictionary(),
    ]);
  const companyId = session.user.companyId;

  if (!companyId) {
    notFound();
  }

  const company = await apiRequest<Company>(
    `/companies/${encodeURIComponent(companyId)}`,
    { token },
  );

  if (company.id !== companyId) {
    notFound();
  }

  const canManage = hasPermission(session, PERMISSIONS.COMPANIES_MANAGE);

  return (
    <div className="grid gap-7">
      <PageHeading
        title={workspace.company.title}
        description={workspace.company.description}
      />

      <Panel className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {company.name}
        </h2>
        <dl className="mt-7 grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-slate-500">
              {workspace.company.status}
            </dt>
            <dd className="mt-3">
              <Badge tone={company.status === "ACTIVE" ? "success" : "warning"}>
                {workspace.company.statusLabels[company.status]}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">
              {workspace.company.created}
            </dt>
            <dd className="mt-3 text-sm font-medium text-slate-800">
              {formatDate(company.createdAt, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">
              {workspace.company.updated}
            </dt>
            <dd className="mt-3 text-sm font-medium text-slate-800">
              {formatDate(company.updatedAt, locale)}
            </dd>
          </div>
        </dl>
      </Panel>

      {canManage ? (
        <Panel className="p-6 sm:p-8">
          <h2 className="text-base font-semibold text-slate-900">
            {workspace.company.editTitle}
          </h2>
          <p className="mb-6 mt-2 text-sm text-slate-500">
            {workspace.company.editDescription}
          </p>
          <CustomerCompanyForm
            action={updateCustomerCompanyAction}
            labels={workspace.company}
            content={content}
            initialName={company.name}
            initialTranslations={company.nameTranslations}
          />
        </Panel>
      ) : (
        <Panel className="p-6">
          <p className="text-sm leading-6 text-slate-500">
            {workspace.company.readOnly}
          </p>
        </Panel>
      )}
    </div>
  );
}
