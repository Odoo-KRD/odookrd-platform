import {
  PERMISSIONS,
  type PaginatedResult,
  type ServiceCategory,
  type ServiceFeatureDefinition,
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
import { adminLifecycleDictionaries } from "@/lib/i18n/admin-lifecycle";
import { adminTableDictionaries } from "@/lib/i18n/admin-table";
import { getServicesDictionary } from "@/lib/i18n/services-server";

import {
  archiveFeatureDefinitionRowAction,
  deleteFeatureDefinitionRowAction,
  restoreFeatureDefinitionRowAction,
} from "../actions";

interface FeatureDefinitionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const categories: readonly ServiceCategory[] = [
  "ODOO",
  "HOSTING",
  "DOMAIN",
  "SUPPORT",
  "TRAINING",
  "OTHER",
];

export default async function FeatureDefinitionsPage({
  searchParams,
}: FeatureDefinitionsPageProps) {
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

  const category =
    typeof parameters.category === "string" &&
    categories.includes(parameters.category as ServiceCategory)
      ? (parameters.category as ServiceCategory)
      : null;
  const status =
    parameters.status === "ACTIVE" || parameters.status === "INACTIVE"
      ? parameters.status
      : null;
  const query = new URLSearchParams({ limit: "100", offset: "0" });

  if (category) query.set("category", category);
  if (status) query.set("status", status);

  const lifecycle = adminLifecycleDictionaries[locale];

  const definitions = await apiRequest<
    PaginatedResult<ServiceFeatureDefinition>
  >(`/service-feature-definitions?${query.toString()}`, { token });

  const rows: AdminDataTableRow[] = definitions.items.map((definition) => ({
    id: definition.id,
    searchText: `${definition.name} ${definition.key} ${definition.parameterLabel}`,
    cells: {
      name: { type: "text", value: definition.name, emphasis: true },
      key: {
        type: "text",
        value: definition.key,
        dir: "ltr",
        muted: true,
      },
      category: {
        type: "text",
        value: services.categoryLabels[definition.category],
      },
      parameter: { type: "text", value: definition.parameterLabel },
      type: {
        type: "text",
        value: serviceFeatures.valueTypes[definition.valueType],
      },
      value: {
        type: "text",
        value:
          definition.valueType === "BOOLEAN"
            ? definition.defaultValue
              ? serviceFeatures.yes
              : serviceFeatures.no
            : definition.valueType === "TEXT"
              ? (definition.valueTranslations[locale] ??
                String(definition.defaultValue))
              : `${String(definition.defaultValue)}${
                  definition.unit ? ` ${definition.unit}` : ""
                }`,
      },
      status: {
        type: "badge",
        label: services.catalogStatusLabels[definition.status],
        tone: definition.status === "ACTIVE" ? "success" : "neutral",
      },
      serviceCount: { type: "text", value: String(definition.serviceCount) },
      actions: {
        type: "node",
        value: (
          <AdminLifecycleRowActions
            id={definition.id}
            name={definition.name}
            status={definition.status}
            editHref={`/admin/services/features/${definition.id}`}
            labels={lifecycle}
            archiveAction={archiveFeatureDefinitionRowAction}
            restoreAction={restoreFeatureDefinitionRowAction}
            deleteAction={deleteFeatureDefinitionRowAction}
          />
        ),
      },
    },
  }));

  return (
    <div className="grid gap-7">
      <PageHeading
        title={serviceFeatures.featureDefinitions}
        description={serviceFeatures.featureDefinitionsDescription}
        actions={
          <Link
            href="/admin/services/features/new"
            className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
          >
            {serviceFeatures.newFeatureDefinition}
          </Link>
        }
      />

      <AdminDataTable
        labels={adminTableDictionaries[locale]}
        columns={[
          { key: "name", label: serviceFeatures.featureName },
          { key: "key", label: serviceFeatures.featureKey },
          { key: "category", label: serviceFeatures.applicableCategory },
          { key: "parameter", label: serviceFeatures.parameterLabel },
          { key: "type", label: serviceFeatures.valueType },
          { key: "value", label: serviceFeatures.defaultValue },
          { key: "status", label: services.status },
          { key: "serviceCount", label: serviceFeatures.serviceCount },
          { key: "actions", label: services.actions },
        ]}
        rows={rows}
        minWidthClassName="min-w-[1040px]"
        toolbar={
          <form method="get" className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center">
              <span className="sr-only">
                {serviceFeatures.applicableCategory}
              </span>
              <select
                name="category"
                defaultValue={category ?? ""}
                className="h-9 rounded-md border border-line bg-white px-3 text-sm text-content"
              >
                <option value="">{serviceFeatures.allCategories}</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {services.categoryLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center">
              <span className="sr-only">{services.status}</span>
              <select
                name="status"
                defaultValue={status ?? ""}
                className="h-9 rounded-md border border-line bg-white px-3 text-sm text-content"
              >
                <option value="">{services.allStatuses}</option>
                <option value="ACTIVE">
                  {services.catalogStatusLabels.ACTIVE}
                </option>
                <option value="INACTIVE">
                  {services.catalogStatusLabels.INACTIVE}
                </option>
              </select>
            </label>
            <button
              type="submit"
              className="h-9 rounded-md border border-line px-3 text-xs font-medium text-content hover:bg-slate-50"
            >
              {serviceFeatures.search}
            </button>
          </form>
        }
        empty={
          <EmptyState
            title={serviceFeatures.emptyFeaturesTitle}
            description={serviceFeatures.featureDefinitionsDescription}
          />
        }
        footer={
          <p className="text-xs text-muted">
            {definitions.pagination.total} {services.records}
          </p>
        }
      />
    </div>
  );
}
