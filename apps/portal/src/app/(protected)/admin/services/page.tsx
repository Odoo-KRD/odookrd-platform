import {
  PERMISSIONS,
  type Company,
  type CompanyServiceAssignment,
  type CompanyServiceStatus,
  type ManagedService,
  type PaginatedResult,
  type ServiceCategory,
} from "@odookrd/types";
import { EmptyState, PageHeading } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AdminDataTable,
  type AdminDataTableRow,
  type AdminTableTone,
} from "@/components/admin/admin-data-table";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { adminTableDictionaries } from "@/lib/i18n/admin-table";
import { getServicesDictionary } from "@/lib/i18n/services-server";

import {
  batchAssignmentTransitionAction,
  batchServiceStatusAction,
} from "./actions";

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

const categories: readonly ServiceCategory[] = [
  "ODOO",
  "HOSTING",
  "DOMAIN",
  "SUPPORT",
  "TRAINING",
  "OTHER",
];

const assignmentStatuses: readonly CompanyServiceStatus[] = [
  "PROVISIONING",
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "CANCELLED",
];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function queryText(
  value: string | string[] | undefined,
  maximumLength = 200,
): string {
  return typeof value === "string" && value.trim().length <= maximumLength
    ? value.trim()
    : "";
}

function pageHref(
  parameters: Record<string, string | string[] | undefined>,
  changes: Record<string, string | number | null>,
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value === "string" && value) {
      query.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === 0 || value === "") {
      query.delete(key);
    } else {
      query.set(key, String(value));
    }
  }

  const serialized = query.toString();
  return serialized ? `/admin/services?${serialized}` : "/admin/services";
}

function assignmentTone(status: CompanyServiceStatus): AdminTableTone {
  if (status === "ACTIVE") return "success";
  if (status === "PROVISIONING") return "warning";
  if (status === "CANCELLED") return "neutral";
  return "danger";
}

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps) {
  const [
    { session, token },
    { locale, services, serviceFeatures },
    parameters,
  ] = await Promise.all([
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
  const category =
    typeof parameters.category === "string" &&
    categories.includes(parameters.category as ServiceCategory)
      ? (parameters.category as ServiceCategory)
      : null;
  const search = queryText(parameters.search);
  const offset = selectedOffset(parameters.offset);
  const assignmentOffset = selectedOffset(parameters.assignmentOffset);
  const assignmentSearch = queryText(parameters.assignmentSearch);
  const assignmentStatus =
    typeof parameters.assignmentStatus === "string" &&
    assignmentStatuses.includes(
      parameters.assignmentStatus as CompanyServiceStatus,
    )
      ? (parameters.assignmentStatus as CompanyServiceStatus)
      : null;
  const assignmentCompanyId =
    typeof parameters.companyId === "string" &&
    uuidPattern.test(parameters.companyId)
      ? parameters.companyId
      : null;
  const assignmentServiceId =
    typeof parameters.serviceId === "string" &&
    uuidPattern.test(parameters.serviceId)
      ? parameters.serviceId
      : null;
  const catalogQuery = new URLSearchParams({
    limit: "20",
    offset: String(offset),
  });

  if (status) {
    catalogQuery.set("status", status);
  }

  if (category) catalogQuery.set("category", category);
  if (search) catalogQuery.set("search", search);

  const assignmentQuery = new URLSearchParams({
    limit: "20",
    offset: String(assignmentOffset),
  });

  if (assignmentSearch) assignmentQuery.set("search", assignmentSearch);
  if (assignmentStatus) assignmentQuery.set("status", assignmentStatus);
  if (assignmentCompanyId)
    assignmentQuery.set("companyId", assignmentCompanyId);
  if (assignmentServiceId)
    assignmentQuery.set("serviceId", assignmentServiceId);

  for (const field of [
    "startsFrom",
    "startsTo",
    "expiresFrom",
    "expiresTo",
  ] as const) {
    const value = queryText(parameters[field], 10);

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      assignmentQuery.set(field, value);
    }
  }

  const canReadCompanies = hasPermission(session, PERMISSIONS.COMPANIES_READ);

  const [catalog, assignments, companies, filterServices] = await Promise.all([
    apiRequest<PaginatedResult<ManagedService>>(`/services?${catalogQuery}`, {
      token,
    }),
    apiRequest<PaginatedResult<CompanyServiceAssignment>>(
      `/service-assignments?${assignmentQuery.toString()}`,
      { token },
    ),
    canReadCompanies
      ? apiRequest<PaginatedResult<Company>>("/companies?limit=100&offset=0", {
          token,
        })
      : Promise.resolve(null),
    apiRequest<PaginatedResult<ManagedService>>(
      "/services?limit=100&offset=0",
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

  const catalogRows: AdminDataTableRow[] = catalog.items.map(
    (service): AdminDataTableRow => ({
      id: service.id,
      searchText: `${service.name} ${service.key}`,
      cells: {
        name: { type: "text", value: service.name, emphasis: true },
        key: { type: "text", value: service.key, dir: "ltr", muted: true },
        category: {
          type: "text",
          value: services.categoryLabels[service.category],
        },
        status: {
          type: "badge",
          label: services.catalogStatusLabels[service.status],
          tone: service.status === "ACTIVE" ? "success" : "neutral",
        },
        features: {
          type: "text",
          value: String(service.featureCount ?? 0),
        },
        assignments: {
          type: "text",
          value: String(service.assignmentCount),
        },
        actions: {
          type: "link",
          label: services.view,
          href: `/admin/services/${service.id}`,
        },
      },
    }),
  );

  const assignmentRows: AdminDataTableRow[] = assignments.items.map(
    (assignment): AdminDataTableRow => ({
      id: assignment.id,
      searchText: `${assignment.company.name} ${
        assignment.displayName ?? assignment.service.name
      }`,
      cells: {
        company: {
          type: "text",
          value: assignment.company.name,
          emphasis: true,
        },
        service: {
          type: "text",
          value: assignment.displayName ?? assignment.service.name,
        },
        status: {
          type: "badge",
          label: services.assignmentStatusLabels[assignment.status],
          tone: assignmentTone(assignment.status),
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
        serviceUrl: {
          type: "text",
          value: assignment.serviceUrl ?? "—",
          dir: "ltr",
          muted: true,
          className: "break-all",
        },
        actions: {
          type: "link",
          label: services.view,
          href: `/admin/services/assignments/${assignment.id}`,
        },
      },
    }),
  );

  const catalogFooter =
    catalog.pagination.total > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {catalog.pagination.total} {services.records}
        </p>
        <div className="flex gap-2">
          {catalog.pagination.offset > 0 ? (
            <Link
              href={pageHref(parameters, {
                offset: Math.max(
                  0,
                  catalog.pagination.offset - catalog.pagination.limit,
                ),
              })}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              {services.previous}
            </Link>
          ) : null}
          {catalog.pagination.offset + catalog.items.length <
          catalog.pagination.total ? (
            <Link
              href={pageHref(parameters, {
                offset: catalog.pagination.offset + catalog.pagination.limit,
              })}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              {services.next}
            </Link>
          ) : null}
        </div>
      </div>
    ) : undefined;

  const assignmentFooter =
    assignments.pagination.total > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {assignments.pagination.total} {services.records}
        </p>
        <div className="flex gap-2">
          {assignments.pagination.offset > 0 ? (
            <Link
              href={pageHref(parameters, {
                assignmentOffset: Math.max(
                  0,
                  assignments.pagination.offset - assignments.pagination.limit,
                ),
              })}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              {services.previous}
            </Link>
          ) : null}
          {assignments.pagination.offset + assignments.items.length <
          assignments.pagination.total ? (
            <Link
              href={pageHref(parameters, {
                assignmentOffset:
                  assignments.pagination.offset + assignments.pagination.limit,
              })}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              {services.next}
            </Link>
          ) : null}
        </div>
      </div>
    ) : undefined;

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
        </div>

        <AdminDataTable
          columns={[
            { key: "name", label: services.name },
            { key: "key", label: services.key },
            { key: "category", label: services.category },
            { key: "status", label: services.status },
            { key: "features", label: serviceFeatures.featureCount },
            { key: "assignments", label: services.assignmentCount },
            { key: "actions", label: services.actions },
          ]}
          rows={catalogRows}
          labels={adminTableDictionaries[locale]}
          selectable
          searchEnabled={false}
          batchAction={batchServiceStatusAction}
          batchActions={[
            {
              value: "ACTIVE",
              label: services.catalogStatusLabels.ACTIVE,
            },
            {
              value: "INACTIVE",
              label: services.catalogStatusLabels.INACTIVE,
              tone: "danger",
            },
          ]}
          toolbar={
            <form method="get" className="flex flex-wrap items-center gap-2">
              <input
                name="search"
                type="search"
                defaultValue={search}
                maxLength={200}
                placeholder={serviceFeatures.searchCatalog}
                className="h-9 min-w-52 rounded-md border border-slate-300 bg-white px-3 text-sm"
              />
              <select
                name="status"
                defaultValue={status ?? ""}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="">{services.allStatuses}</option>
                <option value="ACTIVE">
                  {services.catalogStatusLabels.ACTIVE}
                </option>
                <option value="INACTIVE">
                  {services.catalogStatusLabels.INACTIVE}
                </option>
              </select>
              <select
                name="category"
                defaultValue={category ?? ""}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="">{services.allCategories}</option>
                {categories.map((selectedCategory) => (
                  <option key={selectedCategory} value={selectedCategory}>
                    {services.categoryLabels[selectedCategory]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="h-9 rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand-hover"
              >
                {serviceFeatures.search}
              </button>
            </form>
          }
          footer={catalogFooter}
          empty={
            <EmptyState
              title={services.emptyCatalogTitle}
              description={services.emptyCatalogDescription}
              action={createLink}
            />
          }
          minWidthClassName="min-w-[1080px]"
        />
      </section>

      <section className="grid gap-4">
        <h2 className="text-base font-semibold text-slate-900">
          {serviceFeatures.companyServices}
        </h2>
        <AdminDataTable
          columns={[
            { key: "company", label: services.company },
            { key: "service", label: services.service },
            { key: "status", label: services.status },
            { key: "startsAt", label: services.startsAt },
            { key: "expiresAt", label: services.expiresAt },
            { key: "serviceUrl", label: services.serviceUrl },
            { key: "actions", label: services.actions },
          ]}
          rows={assignmentRows}
          labels={adminTableDictionaries[locale]}
          selectable
          searchEnabled={false}
          batchAction={batchAssignmentTransitionAction}
          batchActions={[
            {
              value: "ACTIVE",
              label: services.assignmentStatusLabels.ACTIVE,
            },
            {
              value: "SUSPENDED",
              label: services.assignmentStatusLabels.SUSPENDED,
              tone: "danger",
            },
            {
              value: "EXPIRED",
              label: services.assignmentStatusLabels.EXPIRED,
              tone: "danger",
            },
            {
              value: "CANCELLED",
              label: services.assignmentStatusLabels.CANCELLED,
              tone: "danger",
            },
          ]}
          batchFields={
            <input
              name="reason"
              type="text"
              maxLength={1000}
              placeholder={serviceFeatures.transitionReason}
              className="h-9 min-w-52 rounded-md border border-slate-300 bg-white px-3 text-xs"
            />
          }
          toolbar={
            <form method="get" className="flex flex-wrap items-center gap-2">
              <input
                name="assignmentSearch"
                type="search"
                maxLength={200}
                defaultValue={assignmentSearch}
                placeholder={serviceFeatures.searchAssignments}
                className="h-9 min-w-52 rounded-md border border-slate-300 bg-white px-3 text-sm"
              />
              <select
                name="assignmentStatus"
                defaultValue={assignmentStatus ?? ""}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="">{services.allStatuses}</option>
                {assignmentStatuses.map((selectedStatus) => (
                  <option key={selectedStatus} value={selectedStatus}>
                    {services.assignmentStatusLabels[selectedStatus]}
                  </option>
                ))}
              </select>
              {companies ? (
                <select
                  name="companyId"
                  defaultValue={assignmentCompanyId ?? ""}
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs"
                >
                  <option value="">{serviceFeatures.allCompanies}</option>
                  {companies.items.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <select
                name="serviceId"
                defaultValue={assignmentServiceId ?? ""}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="">{serviceFeatures.allServices}</option>
                {filterServices.items.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <input
                name="expiresFrom"
                type="date"
                dir="ltr"
                aria-label={serviceFeatures.expiresFrom}
                defaultValue={queryText(parameters.expiresFrom, 10)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs"
              />
              <input
                name="expiresTo"
                type="date"
                dir="ltr"
                aria-label={serviceFeatures.expiresTo}
                defaultValue={queryText(parameters.expiresTo, 10)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs"
              />
              <button
                type="submit"
                className="h-9 rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand-hover"
              >
                {serviceFeatures.search}
              </button>
            </form>
          }
          footer={assignmentFooter}
          empty={
            <EmptyState
              title={services.emptyAssignmentsTitle}
              description={services.emptyAssignmentsDescription}
              action={assignLink}
            />
          }
          minWidthClassName="min-w-[1280px]"
        />
      </section>
    </div>
  );
}
