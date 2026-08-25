import {
  PERMISSIONS,
  type CompanyServiceAssignment,
  type CompanyServiceFeature,
  type PaginatedResult,
} from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { AssignmentStatusBadge } from "@/components/services/service-status-badge";
import { apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getFrontendDictionary } from "@/lib/i18n/frontend-server";
import { serviceFeatureDictionaries } from "@/lib/i18n/service-features";

interface CustomerServiceDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerServiceDetailsPage({
  params,
}: CustomerServiceDetailsPageProps) {
  const [{ session, token }, { locale, services }, { id }] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.SERVICES_READ),
    getFrontendDictionary(),
    params,
  ]);

  const assignment = await apiRequest<CompanyServiceAssignment>(
    `/service-assignments/${encodeURIComponent(id)}`,
    { token },
  );

  if (assignment.companyId !== session.user.companyId) {
    throw new Error(
      "The service response crossed the authenticated company boundary.",
    );
  }

  const features = await apiRequest<PaginatedResult<CompanyServiceFeature>>(
    `/service-assignments/${encodeURIComponent(id)}/features?limit=100&offset=0`,
    { token },
  );
  const featureLabels = serviceFeatureDictionaries[locale];

  return (
    <div className="grid gap-7">
      <PageHeading
        title={assignment.displayName ?? assignment.service.name}
        description={services.categoryLabels[assignment.service.category]}
        actions={
          <Link
            href="/dashboard/services"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {services.back}
          </Link>
        }
      />

      <Panel className="p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.status}
            </p>
            <div className="mt-3">
              <AssignmentStatusBadge
                status={assignment.status}
                labels={services}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.startsAt}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {assignment.startsAt
                ? formatDate(assignment.startsAt, locale)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.expiresAt}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {assignment.expiresAt
                ? formatDate(assignment.expiresAt, locale)
                : "—"}
            </p>
          </div>
        </div>

        {assignment.service.description ? (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-xs font-medium text-slate-500">
              {services.serviceDescription}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {assignment.service.description}
            </p>
          </div>
        ) : null}

        {assignment.notes ? (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-xs font-medium text-slate-500">
              {services.notes}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {assignment.notes}
            </p>
          </div>
        ) : null}

        {assignment.serviceUrl ? (
          <div className="mt-8">
            <a
              href={assignment.serviceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-md bg-[#714b67] px-4 text-sm font-medium text-white hover:bg-[#62405a]"
            >
              {services.openService}
            </a>
          </div>
        ) : null}
      </Panel>

      {features.items.length > 0 ? (
        <Panel className="p-6 sm:p-8">
          <h2 className="text-base font-semibold text-slate-900">
            {featureLabels.features}
          </h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            {features.items.map((feature) => {
              const value =
                feature.feature.valueType === "BOOLEAN"
                  ? feature.value
                    ? featureLabels.yes
                    : featureLabels.no
                  : feature.feature.valueType === "TEXT"
                    ? (feature.valueTranslations[locale] ??
                      String(feature.value))
                    : `${String(feature.value)}${
                        feature.feature.unit ? ` ${feature.feature.unit}` : ""
                      }`;

              return (
                <div
                  key={feature.id}
                  className="rounded-md border border-slate-200 p-4"
                >
                  <dt className="text-xs font-medium text-slate-500">
                    {feature.feature.name}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-slate-900">
                    {value}
                  </dd>
                  {feature.feature.description ? (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {feature.feature.description}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </dl>
        </Panel>
      ) : null}
    </div>
  );
}
