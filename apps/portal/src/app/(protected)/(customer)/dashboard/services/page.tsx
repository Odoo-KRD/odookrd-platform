import {
  PERMISSIONS,
  type CompanyServiceAssignment,
  type PaginatedResult,
} from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { AssignmentStatusBadge } from "@/components/services/service-status-badge";
import { apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getFrontendDictionary } from "@/lib/i18n/frontend-server";

interface CustomerServicesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function selectedOffset(value: string | string[] | undefined): number {
  if (typeof value !== "string") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? parsed
    : 0;
}

export default async function CustomerServicesPage({
  searchParams,
}: CustomerServicesPageProps) {
  const [{ token }, { locale, services }, parameters] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.SERVICES_READ),
    getFrontendDictionary(),
    searchParams,
  ]);

  const offset = selectedOffset(parameters.offset);
  const result = await apiRequest<PaginatedResult<CompanyServiceAssignment>>(
    `/service-assignments?limit=20&offset=${offset}`,
    { token },
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={services.customerTitle}
        description={services.customerDescription}
      />

      {result.items.length === 0 ? (
        <Panel>
          <EmptyState
            title={services.customerEmptyTitle}
            description={services.customerEmptyDescription}
          />
        </Panel>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map((assignment) => (
            <Panel key={assignment.id} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    {services.categoryLabels[assignment.service.category]}
                  </p>
                  <h2 className="mt-2 text-base font-semibold text-slate-900">
                    {assignment.displayName ?? assignment.service.name}
                  </h2>
                </div>
                <AssignmentStatusBadge
                  status={assignment.status}
                  labels={services}
                />
              </div>

              {assignment.expiresAt ? (
                <p className="mt-5 text-sm text-slate-500">
                  {services.expiresAt}:{" "}
                  {formatDate(assignment.expiresAt, locale)}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href={`/dashboard/services/${assignment.id}`}
                  className="text-sm font-medium text-[#714b67] hover:text-[#62405a]"
                >
                  {services.view}
                </Link>

                {assignment.serviceUrl ? (
                  <a
                    href={assignment.serviceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    {services.openService}
                  </a>
                ) : null}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {result.pagination.total > result.pagination.limit ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {result.pagination.total} {services.records}
          </p>
          <div className="flex gap-2">
            {result.pagination.offset > 0 ? (
              <Link
                href={`/dashboard/services?offset=${Math.max(0, result.pagination.offset - result.pagination.limit)}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {services.previous}
              </Link>
            ) : null}
            {result.pagination.offset + result.items.length <
            result.pagination.total ? (
              <Link
                href={`/dashboard/services?offset=${result.pagination.offset + result.pagination.limit}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {services.next}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
