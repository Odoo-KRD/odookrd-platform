import {
  PERMISSIONS,
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
} from "@/components/admin/admin-data-table";
import { AdminLifecycleRowActions } from "@/components/admin/admin-lifecycle-row-actions";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { adminLifecycleDictionaries } from "@/lib/i18n/companies/lifecycle";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { getServicesDictionary } from "@/lib/i18n/services/server";

import {
  archiveServiceRowAction,
  batchServiceStatusAction,
  deleteServiceRowAction,
  restoreServiceRowAction,
} from "./actions";
import { plural } from "@/lib/i18n/plural";
import { recordsPhrase } from "@/lib/i18n/shared/plurals";

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

  const lifecycle = adminLifecycleDictionaries[locale];

  const catalog = await apiRequest<PaginatedResult<ManagedService>>(
    `/services?${catalogQuery}`,
    { token },
  );

  const createLink = (
    <Link
      href="/admin/services/new"
      className="inline-flex h-10 items-center rounded-md bg-[#714b67] px-4 text-sm font-medium text-white hover:bg-[#62405a]"
    >
      {services.addService}
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
          type: "node",
          value: (
            <AdminLifecycleRowActions
              id={service.id}
              name={service.name}
              status={service.status}
              editHref={`/admin/services/${service.id}`}
              labels={lifecycle}
              archiveAction={archiveServiceRowAction}
              restoreAction={restoreServiceRowAction}
              deleteAction={deleteServiceRowAction}
            />
          ),
        },
      },
    }),
  );

  const catalogFooter =
    catalog.pagination.total > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {plural(recordsPhrase, locale, catalog.pagination.total)}
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

  return (
    <div className="grid gap-8">
      <PageHeading
        title={services.title}
        description={services.description}
        actions={createLink}
      />

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            {services.catalog}
          </h2>
        </div>

        <AdminDataTable
          locale={locale}
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
    </div>
  );
}
