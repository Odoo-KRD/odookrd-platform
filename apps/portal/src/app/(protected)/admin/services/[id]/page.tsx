import {
  PERMISSIONS,
  type ManagedService,
  type ManagedServiceFeature,
  type PaginatedResult,
  type ServiceFeatureDefinition,
} from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ServiceForm } from "@/components/services/service-form";
import { ServiceFeaturesManager } from "@/components/services/service-features-manager";
import { CatalogStatusBadge } from "@/components/services/service-status-badge";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getServicesDictionary } from "@/lib/i18n/services/server";
import { subscriptionsDictionaries } from "@/lib/i18n/services/subscriptions";

import {
  attachServiceFeatureDefinitionAction,
  moveServiceFeatureAction,
  reorderServiceFeaturesAction,
  updateAttachedServiceFeatureAction,
  updateServiceAction,
} from "../actions";

interface ServiceDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ServiceDetailsPage({
  params,
}: ServiceDetailsPageProps) {
  const [
    { session, token },
    { locale, services, serviceFeatures, content },
    { id },
  ] = await Promise.all([
    getAdminApiContext(PERMISSIONS.SERVICES_MANAGE),
    getServicesDictionary(),
    params,
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  const [service, features, definitions] = await Promise.all([
    apiRequest<ManagedService>(`/services/${encodeURIComponent(id)}`, {
      token,
    }),
    apiRequest<PaginatedResult<ManagedServiceFeature>>(
      `/services/${encodeURIComponent(id)}/features?limit=100&offset=0`,
      { token },
    ),
    apiRequest<PaginatedResult<ServiceFeatureDefinition>>(
      "/service-feature-definitions?status=ACTIVE&limit=100&offset=0",
      { token },
    ),
  ]);

  const attachedDefinitions = new Set(
    features.items.flatMap((feature) =>
      feature.definitionId
        ? [feature.definitionId, feature.key]
        : [feature.key],
    ),
  );
  const availableDefinitions = definitions.items.filter(
    (definition) =>
      definition.category === service.category &&
      !attachedDefinitions.has(definition.id) &&
      !attachedDefinitions.has(definition.key),
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={service.name}
        description={services.editService}
        actions={
          <Link
            href="/admin/services"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {services.back}
          </Link>
        }
      />

      <Panel className="p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.status}
            </p>
            <div className="mt-2">
              <CatalogStatusBadge status={service.status} labels={services} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.category}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {services.categoryLabels[service.category]}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.assignmentCount}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {service.assignmentCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.created}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {formatDate(service.createdAt, locale)}
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="p-6 sm:p-8">
        <h2 className="mb-6 text-base font-semibold text-slate-900">
          {serviceFeatures.overview}
        </h2>
        <ServiceForm
          billingLabels={subscriptionsDictionaries[locale]}
          action={updateServiceAction.bind(null, service.id)}
          labels={services}
          content={content}
          initial={service}
          cancelHref="/admin/services"
        />
      </Panel>

      <ServiceFeaturesManager
        locale={locale}
        items={features.items}
        total={features.pagination.total}
        definitions={availableDefinitions}
        services={services}
        labels={serviceFeatures}
        content={content}
        attachAction={attachServiceFeatureDefinitionAction.bind(
          null,
          service.id,
        )}
        updateAction={updateAttachedServiceFeatureAction.bind(null, service.id)}
        moveAction={moveServiceFeatureAction.bind(null, service.id)}
        reorderAction={reorderServiceFeaturesAction.bind(null, service.id)}
      />
    </div>
  );
}
