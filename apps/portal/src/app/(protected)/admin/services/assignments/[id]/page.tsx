import {
  PERMISSIONS,
  type CompanyServiceAssignment,
  type CompanyServiceFeature,
  type CompanyServiceLifecycleEvent,
  type PaginatedResult,
  type ServiceSubscriptionDetails,
} from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AssignmentFeatureForm } from "@/components/services/assignment-feature-form";
import { ServiceAssignmentForm } from "@/components/services/service-assignment-form";
import { ServiceLifecycleForm } from "@/components/services/service-lifecycle-form";
import { AssignmentStatusBadge } from "@/components/services/service-status-badge";
import { SubscriptionPanel } from "@/components/services/subscription-panel";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getServicesDictionary } from "@/lib/i18n/services-server";
import { subscriptionsDictionaries } from "@/lib/i18n/subscriptions";

import {
  cancelSubscriptionAction,
  createSubscriptionAction,
  renewSubscriptionAction,
  syncAssignmentFeaturesAction,
  transitionAssignmentAction,
  updateAssignmentAction,
  updateAssignmentFeatureAction,
  updateSubscriptionAction,
} from "../../actions";

interface AssignmentDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssignmentDetailsPage({
  params,
}: AssignmentDetailsPageProps) {
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

  const [assignment, features, history, subscription] = await Promise.all([
    apiRequest<CompanyServiceAssignment>(
      `/service-assignments/${encodeURIComponent(id)}`,
      { token },
    ),
    apiRequest<PaginatedResult<CompanyServiceFeature>>(
      `/service-assignments/${encodeURIComponent(id)}/features?limit=100&offset=0`,
      { token },
    ),
    apiRequest<PaginatedResult<CompanyServiceLifecycleEvent>>(
      `/service-assignments/${encodeURIComponent(id)}/history?limit=50&offset=0`,
      { token },
    ),
    // Isolated from the rest of the page: a subscription lookup failure should
    // degrade this one panel, not blank the whole assignment screen.
    apiRequest<ServiceSubscriptionDetails>(
      `/service-assignments/${encodeURIComponent(id)}/subscription`,
      { token },
    ).catch((): ServiceSubscriptionDetails | null => null),
  ]);

  const subscriptionLabels = subscriptionsDictionaries[locale];

  return (
    <div className="grid gap-7">
      <PageHeading
        title={assignment.displayName ?? assignment.service.name}
        description={services.editAssignment}
        actions={
          <Link
            href="/admin/services"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {services.back}
          </Link>
        }
      />

      <Panel className="p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.company}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {assignment.company.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.status}
            </p>
            <div className="mt-2">
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
            <p className="mt-2 text-sm font-medium text-slate-900">
              {assignment.startsAt
                ? formatDate(assignment.startsAt, locale)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.expiresAt}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {assignment.expiresAt
                ? formatDate(assignment.expiresAt, locale)
                : "—"}
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="p-6 sm:p-8">
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          {subscriptionLabels.title}
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          {subscriptionLabels.description}
        </p>
        {subscription ? (
          <SubscriptionPanel
            details={subscription}
            billingModel={assignment.service.billingModel}
            labels={subscriptionLabels}
            createAction={createSubscriptionAction.bind(null, assignment.id)}
            updateAction={updateSubscriptionAction.bind(null, assignment.id)}
            renewAction={renewSubscriptionAction.bind(null, assignment.id)}
            cancelAction={cancelSubscriptionAction.bind(null, assignment.id)}
            locale={locale}
          />
        ) : (
          <p className="text-sm text-slate-500">
            {subscriptionLabels.noneDescription}
          </p>
        )}
      </Panel>

      <Panel className="p-6 sm:p-8">
        <h2 className="mb-6 text-base font-semibold text-slate-900">
          {services.editAssignment}
        </h2>
        <ServiceAssignmentForm
          action={updateAssignmentAction.bind(null, assignment.id)}
          labels={services}
          content={content}
          initial={assignment}
          cancelHref="/admin/services"
        />
      </Panel>

      <Panel className="p-6 sm:p-8">
        <h2 className="mb-6 text-base font-semibold text-slate-900">
          {serviceFeatures.changeStatus}
        </h2>
        <ServiceLifecycleForm
          action={transitionAssignmentAction.bind(null, assignment.id)}
          currentStatus={assignment.status}
          labels={services}
          features={serviceFeatures}
        />
      </Panel>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            {serviceFeatures.features}
          </h2>
          <form action={syncAssignmentFeaturesAction.bind(null, assignment.id)}>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {serviceFeatures.syncFeatures}
            </button>
          </form>
        </div>

        {features.items.length === 0 ? (
          <Panel className="p-6 text-sm text-slate-500">
            {serviceFeatures.emptyFeaturesDescription}
          </Panel>
        ) : (
          features.items.map((feature) => {
            const value =
              feature.feature.valueType === "BOOLEAN"
                ? feature.value
                  ? serviceFeatures.yes
                  : serviceFeatures.no
                : feature.feature.valueType === "TEXT"
                  ? (feature.valueTranslations[locale] ?? String(feature.value))
                  : `${String(feature.value)}${
                      feature.feature.unit ? ` ${feature.feature.unit}` : ""
                    }`;

            return (
              <Panel key={feature.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {feature.feature.name}
                    </p>
                    <p dir="ltr" className="text-xs text-slate-500">
                      {feature.feature.key}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                      {value}
                    </span>
                    <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
                      {serviceFeatures.featureSources[feature.source]}
                    </span>
                    <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
                      {feature.customerVisible
                        ? serviceFeatures.visibleToCustomer
                        : serviceFeatures.platformOnly}
                    </span>
                  </div>
                </div>

                <details className="mt-5 border-t border-slate-200 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-brand hover:text-brand-hover">
                    {serviceFeatures.editFeature}
                  </summary>
                  <div className="mt-5">
                    <AssignmentFeatureForm
                      action={updateAssignmentFeatureAction.bind(
                        null,
                        assignment.id,
                        feature.id,
                      )}
                      assignmentFeature={feature}
                      labels={services}
                      features={serviceFeatures}
                      content={content}
                    />
                  </div>
                </details>
              </Panel>
            );
          })
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-base font-semibold text-slate-900">
          {serviceFeatures.history}
        </h2>
        <Panel className="p-5 sm:p-6">
          {history.items.length === 0 ? (
            <p className="text-sm text-slate-500">
              {serviceFeatures.emptyHistory}
            </p>
          ) : (
            <ol className="grid gap-5">
              {history.items.map((event) => (
                <li key={event.id} className="border-s-2 border-brand/20 ps-4">
                  <p className="text-sm font-medium text-slate-900">
                    {event.fromStatus
                      ? services.assignmentStatusLabels[event.fromStatus]
                      : serviceFeatures.initialStatus}
                    {" → "}
                    {services.assignmentStatusLabels[event.toStatus]}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(event.effectiveAt, locale)}
                    {" · "}
                    {serviceFeatures.lifecycleSources[event.source]}
                    {event.actorEmailSnapshot
                      ? ` · ${event.actorEmailSnapshot}`
                      : ""}
                  </p>
                  {event.reason ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {event.reason}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </section>
    </div>
  );
}
