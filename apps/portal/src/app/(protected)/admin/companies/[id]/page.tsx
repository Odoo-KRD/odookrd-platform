import {
  PERMISSIONS,
  type CompanyIdentityChangeRequest,
  type CompanyProfile,
  type CompanyServiceAssignment,
  type PaginatedResult,
} from "@odookrd/types";
import { Badge, EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import {
  AdminDataTable,
  type AdminDataTableRow,
  type AdminTableTone,
} from "@/components/admin/admin-data-table";
import { CompanyContactEditModal } from "@/components/companies/company-contact-admin-modal";
import { CompanyLogoActions } from "@/components/companies/company-logo-actions";
import { CompanyIdentityEditModal } from "@/components/companies/company-profile-admin-form";
import { CompanyStatusBadge } from "@/components/companies/company-status-badge";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getAdminDictionary } from "@/lib/i18n/admin/server";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { companyProfileV2Dictionaries } from "@/lib/i18n/companies/profile";
import { serviceFeatureDictionaries } from "@/lib/i18n/services/features";
import { servicesDictionaries } from "@/lib/i18n/services";

import {
  deleteCompanyLogoAction,
  reviewCompanyIdentityRequestAction,
  updateCompanyContactAdminAction,
  updateCompanyIdentityAction,
  uploadCompanyLogoAction,
} from "./profile-actions";

interface CompanyDetailsPageProps {
  params: Promise<{ id: string }>;
}

function requestTone(
  status: CompanyIdentityChangeRequest["status"],
): "success" | "warning" | "danger" | "neutral" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "danger";
  return "neutral";
}

export default async function CompanyDetailsPage({
  params,
}: CompanyDetailsPageProps) {
  const [{ session, token }, { locale, companies, content }, { id }] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.COMPANIES_READ),
      getAdminDictionary(),
      params,
    ]);

  const isPlatform = session.user.accountScope === "PLATFORM";
  const canReadServices =
    isPlatform && hasPermission(session, PERMISSIONS.SERVICES_READ);

  const [company, assignments, identityRequests] = await Promise.all([
    isPlatform
      ? apiRequest<CompanyProfile>(
          `/companies/${encodeURIComponent(id)}/profile`,
          { token },
        )
      : apiRequest<CompanyProfile>("/workspace/company", { token }),
    canReadServices
      ? apiRequest<PaginatedResult<CompanyServiceAssignment>>(
          `/service-assignments?companyId=${encodeURIComponent(
            id,
          )}&limit=50&offset=0`,
          { token },
        )
      : Promise.resolve(null),
    isPlatform
      ? apiRequest<CompanyIdentityChangeRequest[]>(
          `/companies/${encodeURIComponent(id)}/identity-requests`,
          { token },
        )
      : Promise.resolve([]),
  ]);

  const canManage =
    isPlatform && hasPermission(session, PERMISSIONS.COMPANIES_MANAGE);
  const canManageServices =
    isPlatform && hasPermission(session, PERMISSIONS.SERVICES_MANAGE);
  const services = servicesDictionaries[locale];
  const serviceFeatures = serviceFeatureDictionaries[locale];
  const profileLabels = companyProfileV2Dictionaries[locale];

  const requestLabels = {
    PENDING: profileLabels.pending,
    APPROVED: profileLabels.approved,
    REJECTED: profileLabels.rejected,
    CANCELLED: profileLabels.cancelled,
  } as const;

  const assignmentRows: AdminDataTableRow[] = (assignments?.items ?? []).map(
    (assignment): AdminDataTableRow => {
      const tone: AdminTableTone =
        assignment.status === "ACTIVE"
          ? "success"
          : assignment.status === "PROVISIONING"
            ? "warning"
            : assignment.status === "CANCELLED"
              ? "neutral"
              : "danger";

      return {
        id: assignment.id,
        searchText: assignment.displayName ?? assignment.service.name,
        cells: {
          service: {
            type: "text",
            value: assignment.displayName ?? assignment.service.name,
            emphasis: true,
          },
          status: {
            type: "badge",
            label: services.assignmentStatusLabels[assignment.status],
            tone,
          },
          startsAt: {
            type: "text",
            value: assignment.startsAt
              ? formatDate(assignment.startsAt, locale)
              : "—",
            muted: true,
          },
          expiresAt: {
            type: "text",
            value: assignment.expiresAt
              ? formatDate(assignment.expiresAt, locale)
              : "—",
            muted: true,
          },
          actions: {
            type: "link",
            label: services.view,
            href: `/admin/services/assignments/${assignment.id}`,
          },
        },
      };
    },
  );

  const logoUrl =
    company.hasLogo && company.logoFileAssetId
      ? isPlatform
        ? `/api/admin/companies/${encodeURIComponent(
            company.id,
          )}/logo?v=${encodeURIComponent(company.logoFileAssetId)}`
        : `/api/workspace/company/logo?v=${encodeURIComponent(
            company.logoFileAssetId,
          )}`
      : null;

  return (
    <div className="grid gap-7">
      <PageHeading
        title={company.name}
        description={companies.detailsTitle}
        actions={
          <Link
            href="/admin/companies"
            className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            {companies.cancel}
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <Panel className="relative p-6 sm:p-8">
          {canManage ? (
            <div className="absolute end-5 top-5 z-10">
              <CompanyIdentityEditModal
                action={updateCompanyIdentityAction.bind(null, company.id)}
                company={company}
                labels={profileLabels}
                content={content}
                statusLabels={{
                  ACTIVE: companies.statusActive,
                  SUSPENDED: companies.statusSuspended,
                  ARCHIVED: companies.statusArchived,
                }}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-6 sm:flex-row">
            {canManage ? (
              <CompanyLogoActions
                currentImageUrl={logoUrl}
                hasLogo={company.hasLogo}
                labels={profileLabels}
                uploadAction={uploadCompanyLogoAction.bind(null, company.id)}
                deleteAction={deleteCompanyLogoAction.bind(null, company.id)}
              />
            ) : (
              <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white">
                {logoUrl ? (
                  // Authenticated same-origin company logo.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="max-h-full max-w-full object-contain p-2"
                  />
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-10 text-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M4 20V7l8-3v16M12 9h8v11M7 9h2M7 13h2M7 17h2M15 12h2M15 16h2" />
                  </svg>
                )}
              </div>
            )}

            <div className="min-w-0 flex-1 pe-10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted">
                    {profileLabels.slug}
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-content text-start min-w-0 break-words">
                    <bdi dir="ltr">{company.slug ?? "—"}</bdi>
                  </p>
                </div>
              </div>

              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted">
                    {profileLabels.status}
                  </dt>
                  <dd className="mt-1.5">
                    <CompanyStatusBadge
                      status={company.status}
                      labels={companies}
                    />
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-muted">
                    {companies.created}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-content">
                    {formatDate(company.createdAt, locale)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-muted">
                    {companies.updated}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-content">
                    {formatDate(company.updatedAt, locale)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Panel>

        <Panel className="relative p-6">
          {canManage ? (
            <div className="absolute end-5 top-5">
              <CompanyContactEditModal
                action={updateCompanyContactAdminAction.bind(null, company.id)}
                company={company}
                labels={profileLabels}
              />
            </div>
          ) : null}

          <h2 className="pe-10 text-base font-semibold text-content">
            {profileLabels.contact}
          </h2>

          <dl className="mt-5 grid gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted">{profileLabels.email}</dt>
              <dd className="mt-1 font-medium text-content text-start min-w-0 break-words">
                <bdi dir="ltr">{company.contactEmail ?? "—"}</bdi>
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted">{profileLabels.website}</dt>
              <dd className="mt-1 break-all font-medium text-content text-start min-w-0 break-words">
                <bdi dir="ltr">{company.websiteUrl ?? "—"}</bdi>
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted">{profileLabels.phone}</dt>
              <dd className="mt-1 font-medium text-content text-start min-w-0 break-words">
                <bdi dir="ltr">{company.phone ?? "—"}</bdi>
              </dd>
            </div>

            <div>
              <dt className="text-xs text-muted">{profileLabels.address}</dt>
              <dd className="mt-1 leading-6 text-content text-start min-w-0 break-words">
                <bdi dir="ltr">
                  {[
                    company.addressLine1,
                    company.addressLine2,
                    company.city,
                    company.region,
                    company.postalCode,
                    company.countryCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </bdi>
              </dd>
            </div>
          </dl>
        </Panel>
      </section>

      {isPlatform ? (
        <Panel className="p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-content">
                {profileLabels.reviewRequests}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {profileLabels.requestIdentityDescription}
              </p>
            </div>
            <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-content">
              {identityRequests.length}
            </span>
          </div>

          {identityRequests.length === 0 ? (
            <p className="mt-5 rounded-lg bg-surface-subtle p-4 text-sm text-muted">
              {profileLabels.noRequests}
            </p>
          ) : (
            <div className="mt-5 grid gap-4">
              {identityRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-xl border border-line p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted">
                        {profileLabels.requestedBy}
                      </p>
                      <p
                        dir="ltr"
                        className="mt-1 text-sm font-semibold text-content"
                      >
                        {request.requestedByEmail}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDate(request.createdAt, locale)}
                      </p>
                    </div>
                    <Badge tone={requestTone(request.status)}>
                      {requestLabels[request.status]}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-lg bg-surface-subtle p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted">
                        {profileLabels.proposedName}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-content">
                        {request.proposedName ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted">
                        {profileLabels.proposedLogo}
                      </p>
                      {request.hasProposedLogo ? (
                        <a
                          href={`/api/admin/companies/${encodeURIComponent(
                            company.id,
                          )}/identity-requests/${encodeURIComponent(
                            request.id,
                          )}/logo`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex text-sm font-semibold text-brand hover:text-brand-hover"
                        >
                          {profileLabels.viewProposedLogo}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-muted">—</p>
                      )}
                    </div>
                  </div>

                  {request.reviewNote ? (
                    <p className="mt-3 text-sm text-muted">
                      {profileLabels.reviewNote}: {request.reviewNote}
                    </p>
                  ) : null}

                  {request.status === "PENDING" && canManage ? (
                    <div className="mt-4 grid gap-3">
                      <form
                        action={reviewCompanyIdentityRequestAction.bind(
                          null,
                          company.id,
                          request.id,
                          "APPROVED",
                        )}
                        className="flex flex-col gap-3 sm:flex-row"
                      >
                        <input
                          name="reviewNote"
                          maxLength={1000}
                          placeholder={profileLabels.reviewNote}
                          className="h-10 min-w-0 flex-1 rounded-md border border-line bg-white px-3 text-sm text-content"
                        />
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          {profileLabels.approve}
                        </button>
                      </form>

                      <form
                        action={reviewCompanyIdentityRequestAction.bind(
                          null,
                          company.id,
                          request.id,
                          "REJECTED",
                        )}
                        className="flex flex-col gap-3 sm:flex-row"
                      >
                        <input
                          name="reviewNote"
                          maxLength={1000}
                          placeholder={profileLabels.reviewNote}
                          className="h-10 min-w-0 flex-1 rounded-md border border-line bg-white px-3 text-sm text-content"
                        />
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                          {profileLabels.reject}
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {assignments ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-content">
              {serviceFeatures.companyServices}
            </h2>

            {canManageServices && company.status === "ACTIVE" ? (
              <Link
                href={`/admin/services/assign?companyId=${encodeURIComponent(
                  company.id,
                )}`}
                className="inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand-hover"
              >
                {services.assignService}
              </Link>
            ) : null}
          </div>

          <AdminDataTable
            locale={locale}
            columns={[
              { key: "service", label: services.service },
              { key: "status", label: services.status },
              { key: "startsAt", label: services.startsAt },
              { key: "expiresAt", label: services.expiresAt },
              { key: "actions", label: services.actions },
            ]}
            rows={assignmentRows}
            labels={adminTableDictionaries[locale]}
            empty={
              <EmptyState
                title={services.emptyAssignmentsTitle}
                description={services.emptyAssignmentsDescription}
              />
            }
          />
        </section>
      ) : null}
    </div>
  );
}

// data-odookrd-directional-values: isolated profile values.
