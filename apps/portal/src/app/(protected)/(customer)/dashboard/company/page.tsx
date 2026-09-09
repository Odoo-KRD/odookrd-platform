import {
  PERMISSIONS,
  type CompanyIdentityChangeRequest,
  type CompanyProfile,
} from "@odookrd/types";
import { Badge } from "@odookrd/ui";

import { CustomerCompanyContactEditModal } from "@/components/customer/company-contact-edit-modal";
import { CompanyIdentityRequestForm } from "@/components/customer/company-identity-request-form";
import { apiRequest } from "@/lib/api";
import { getCustomerApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { companyProfileV2Dictionaries } from "@/lib/i18n/companies/profile";
import { getFrontendDictionary } from "@/lib/i18n/public/server";
import Image from "next/image";

import {
  requestCompanyIdentityChangeAction,
  updateCompanyContactAction,
} from "./actions";

function completeness(company: CompanyProfile): number {
  const fields = [
    company.name,
    company.slug,
    company.contactEmail,
    company.websiteUrl,
    company.phone,
    company.addressLine1,
    company.city,
    company.region,
    company.countryCode,
    company.logoFileAssetId,
  ];

  return Math.round(
    (fields.filter((item) => Boolean(item)).length / fields.length) * 100,
  );
}

function requestTone(
  status: CompanyIdentityChangeRequest["status"],
): "success" | "warning" | "danger" | "neutral" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "danger";
  return "neutral";
}

export default async function CustomerCompanyProfilePage() {
  const [{ session, token }, { locale, workspace }] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.COMPANIES_READ),
    getFrontendDictionary(),
  ]);

  const [company, requests] = await Promise.all([
    apiRequest<CompanyProfile>("/workspace/company", { token }),
    apiRequest<CompanyIdentityChangeRequest[]>(
      "/workspace/company/identity-requests",
      { token },
    ),
  ]);

  const labels = companyProfileV2Dictionaries[locale];
  const canManage = hasPermission(session, PERMISSIONS.COMPANIES_MANAGE);
  const percent = completeness(company);
  const pending = requests.some((request) => request.status === "PENDING");
  const requestLabels = {
    PENDING: labels.pending,
    APPROVED: labels.approved,
    REJECTED: labels.rejected,
    CANCELLED: labels.cancelled,
  } as const;

  const address = [
    company.addressLine1,
    company.addressLine2,
    company.city,
    company.region,
    company.postalCode,
    company.countryCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid gap-6 sm:gap-7">
      <section className="rounded-xl border border-line bg-surface-panel px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              {labels.eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-content sm:text-3xl">
              {labels.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              {labels.description}
            </p>
          </div>

          <div className="min-w-52 rounded-lg bg-surface-subtle p-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-muted">
                {labels.profileCompleteness}
              </span>
              <span dir="ltr" className="font-semibold text-content">
                {percent}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <div className="rounded-xl border border-line bg-surface-panel p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white">
              {company.hasLogo ? (
                <Image
                  src={`/api/workspace/company/logo?v=${encodeURIComponent(
                    company.logoFileAssetId ?? "logo",
                  )}`}
                  alt=""
                  width={160}
                  height={160}
                  unoptimized
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

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">
                    {labels.identity}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-content text-start min-w-0 break-words">
                    <bdi dir="auto">{company.name}</bdi>
                  </h2>
                  <p className="mt-1 text-sm text-muted text-start min-w-0 break-words">
                    <bdi dir="ltr">{company.slug ?? "—"}</bdi>
                  </p>
                </div>
                <Badge
                  tone={company.status === "ACTIVE" ? "success" : "warning"}
                >
                  {workspace.company.statusLabels[company.status]}
                </Badge>
              </div>

              <div className="mt-5 rounded-lg border border-line bg-surface-subtle p-4">
                <p className="text-sm font-semibold text-content">
                  {labels.platformManaged}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {labels.platformManagedDescription}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface-panel p-5 shadow-sm sm:p-6 relative">
          {canManage ? (
            <div className="absolute end-5 top-5">
              <CustomerCompanyContactEditModal
                action={updateCompanyContactAction}
                company={company}
                labels={labels}
              />
            </div>
          ) : null}

          <h2 className="text-base font-semibold text-content pe-10">
            {labels.contact}
          </h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-muted">{labels.email}</dt>
              <dd className="mt-1 font-medium text-content text-start min-w-0 break-words">
                <bdi dir="ltr">{company.contactEmail ?? "—"}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                {labels.website}
              </dt>
              <dd className="mt-1 break-all font-medium text-content text-start min-w-0 break-words">
                <bdi dir="ltr">{company.websiteUrl ?? "—"}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">{labels.phone}</dt>
              <dd className="mt-1 font-medium text-content text-start min-w-0 break-words">
                <bdi dir="ltr">{company.phone ?? "—"}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">
                {labels.address}
              </dt>
              <dd className="mt-1 leading-6 text-content">{address || "—"}</dd>
            </div>
          </dl>
        </div>
      </section>

      {canManage ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="rounded-xl border border-line bg-surface-panel p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-content">
              {labels.requestIdentity}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {labels.requestIdentityDescription}
            </p>
            <div className="mt-5">
              <CompanyIdentityRequestForm
                action={requestCompanyIdentityChangeAction}
                labels={labels}
                disabled={pending}
              />
            </div>
            {pending ? (
              <p className="mt-4 rounded-md bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                {labels.pending}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-line bg-surface-panel p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-content">
              {labels.requestHistory}
            </h2>

            {requests.length === 0 ? (
              <p className="mt-5 rounded-lg bg-surface-subtle p-4 text-sm text-muted">
                {labels.noRequests}
              </p>
            ) : (
              <div className="mt-5 grid gap-3">
                {requests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-lg border border-line p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        {request.proposedName ? (
                          <p className="text-sm font-semibold text-content">
                            {request.proposedName}
                          </p>
                        ) : (
                          <p className="text-sm font-semibold text-content">
                            {labels.proposedLogo}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted">
                          {labels.requestedAt}:{" "}
                          {formatDate(request.createdAt, locale)}
                        </p>
                      </div>
                      <Badge tone={requestTone(request.status)}>
                        {requestLabels[request.status]}
                      </Badge>
                    </div>

                    {request.hasProposedLogo ? (
                      <p className="mt-3 text-xs font-medium text-brand">
                        {labels.proposedLogoIncluded}
                      </p>
                    ) : null}

                    {request.reviewNote ? (
                      <p className="mt-3 rounded-md bg-surface-subtle px-3 py-2 text-xs leading-5 text-muted">
                        {labels.reviewNote}: {request.reviewNote}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

// data-odookrd-directional-values: isolated profile values.
