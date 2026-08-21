import {
  PERMISSIONS,
  type CompanyServiceAssignment,
  type ManagedService,
  type PaginatedResult,
  type ServiceCatalogStatus,
} from "@odookrd/types";
import { DataTable, EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AssignmentStatusBadge,
  CatalogStatusBadge,
} from "@/components/services/service-status-badge";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getServicesDictionary } from "@/lib/i18n/services-server";

interface ServicesPageProps {
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

function serviceListHref(
  status: ServiceCatalogStatus | null,
  offset: number,
): string {
  const query = new URLSearchParams();

  if (status) {
    query.set("status", status);
  }

  if (offset > 0) {
    query.set("offset", String(offset));
  }

  const serialized = query.toString();
  return serialized ? `/admin/services?${serialized}` : "/admin/services";
}

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps) {
  const [{ session, token }, { locale, services }, parameters] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.SERVICES_MANAGE),
      getServicesDictionary(),
      searchParams,
    ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  const status =
    parameters.status === "ACTIVE" || parameters.status === "INACTIVE"
      ? parameters.status
      : null;
  const offset = selectedOffset(parameters.offset);
  const catalogQuery = new URLSearchParams({
    limit: "20",
    offset: String(offset),
  });

  if (status) {
    catalogQuery.set("status", status);
  }

  const [catalog, assignments] = await Promise.all([
    apiRequest<PaginatedResult<ManagedService>>(`/services?${catalogQuery}`, {
      token,
    }),
    apiRequest<PaginatedResult<CompanyServiceAssignment>>(
      "/service-assignments?limit=20&offset=0",
      { token },
    ),
  ]);

  const createLink = (
    <Link
      href="/admin/services/new"
      className="inline-flex h-10 items-center rounded-md bg-[#714b67] px-4 text-sm font-medium text-white hover:bg-[#62405a]"
    >
      {services.addService}
    </Link>
  );

  const assignLink = (
    <Link
      href="/admin/services/assign"
      className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {services.assignService}
    </Link>
  );

  return (
    <div className="grid gap-8">
      <PageHeading
        title={services.title}
        description={services.description}
        actions={
          <>
            {assignLink}
            {createLink}
          </>
        }
      />

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            {services.catalog}
          </h2>
          <div className="flex flex-wrap gap-2">
            {[null, "ACTIVE", "INACTIVE"].map((selected) => (
              <Link
                key={selected ?? "ALL"}
                href={serviceListHref(
                  selected === "ACTIVE" || selected === "INACTIVE"
                    ? selected
                    : null,
                  0,
                )}
                className={`rounded-md border px-3 py-2 text-xs font-medium ${
                  selected === status
                    ? "border-[#714b67]/30 bg-[#714b67]/8 text-[#714b67]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {selected === "ACTIVE" || selected === "INACTIVE"
                  ? services.catalogStatusLabels[selected]
                  : services.allStatuses}
              </Link>
            ))}
          </div>
        </div>

        <Panel>
          {catalog.items.length === 0 ? (
            <EmptyState
              title={services.emptyCatalogTitle}
              description={services.emptyCatalogDescription}
              action={createLink}
            />
          ) : (
            <DataTable
              headings={[
                services.name,
                services.category,
                services.status,
                services.assignmentCount,
                services.actions,
              ]}
            >
              {catalog.items.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50/70">
                  <td className="border-b border-slate-100 px-5 py-4">
                    <p className="font-medium text-slate-900">{service.name}</p>
                    <p dir="ltr" className="mt-1 text-xs text-slate-500">
                      {service.key}
                    </p>
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-slate-700">
                    {services.categoryLabels[service.category]}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4">
                    <CatalogStatusBadge
                      status={service.status}
                      labels={services}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-slate-700">
                    {service.assignmentCount}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4">
                    <Link
                      href={`/admin/services/${service.id}`}
                      className="text-sm font-medium text-[#714b67] hover:text-[#62405a]"
                    >
                      {services.view}
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}

          {catalog.pagination.total > 0 ? (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
              <p className="text-xs text-slate-500">
                {catalog.pagination.total} {services.records}
              </p>
              <div className="flex gap-2">
                {catalog.pagination.offset > 0 ? (
                  <Link
                    href={serviceListHref(
                      status,
                      Math.max(
                        0,
                        catalog.pagination.offset - catalog.pagination.limit,
                      ),
                    )}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {services.previous}
                  </Link>
                ) : null}
                {catalog.pagination.offset + catalog.items.length <
                catalog.pagination.total ? (
                  <Link
                    href={serviceListHref(
                      status,
                      catalog.pagination.offset + catalog.pagination.limit,
                    )}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {services.next}
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </Panel>
      </section>

      <section className="grid gap-4">
        <h2 className="text-base font-semibold text-slate-900">
          {services.assignments}
        </h2>
        <Panel>
          {assignments.items.length === 0 ? (
            <EmptyState
              title={services.emptyAssignmentsTitle}
              description={services.emptyAssignmentsDescription}
              action={assignLink}
            />
          ) : (
            <DataTable
              headings={[
                services.company,
                services.service,
                services.status,
                services.expiresAt,
                services.actions,
              ]}
            >
              {assignments.items.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50/70">
                  <td className="border-b border-slate-100 px-5 py-4 font-medium text-slate-900">
                    {assignment.company.name}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-slate-700">
                    {assignment.displayName ?? assignment.service.name}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4">
                    <AssignmentStatusBadge
                      status={assignment.status}
                      labels={services}
                    />
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-slate-700">
                    {assignment.expiresAt
                      ? formatDate(assignment.expiresAt, locale)
                      : "—"}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4">
                    <Link
                      href={`/admin/services/assignments/${assignment.id}`}
                      className="text-sm font-medium text-[#714b67] hover:text-[#62405a]"
                    >
                      {services.view}
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>
      </section>
    </div>
  );
}
