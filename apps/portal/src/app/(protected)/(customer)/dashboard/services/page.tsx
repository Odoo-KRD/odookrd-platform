import {
  PERMISSIONS,
  type CustomerServiceAssignmentCard,
  type CustomerVisibleServiceFeature,
  type Locale,
  type PaginatedResult,
  type ServiceCategory,
} from "@odookrd/types";
import { EmptyState, Panel } from "@odookrd/ui";
import Link from "next/link";

import { AssignmentStatusBadge } from "@/components/services/service-status-badge";
import {
  SubscriptionMeter,
  SubscriptionStatusBadge,
} from "@/components/services/subscription-meter";
import { apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { customerPortalRefinementDictionaries } from "@/lib/i18n/portal/refinements";
import { getFrontendDictionary } from "@/lib/i18n/frontend/server";
import { serviceFeatureDictionaries } from "@/lib/i18n/services/features";
import { subscriptionsDictionaries } from "@/lib/i18n/services/subscriptions";

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

function localized(
  fallback: string,
  translations: Partial<Record<Locale, string>>,
  locale: Locale,
): string {
  return translations[locale]?.trim() || fallback;
}

function ServiceIcon({ category }: { category: ServiceCategory }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "size-6",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    "aria-hidden": true,
  } as const;

  if (category === "ODOO") {
    return (
      <svg {...common}>
        <path d="M12 3 4 7l8 4 8-4-8-4ZM4 12l8 4 8-4M4 17l8 4 8-4" />
      </svg>
    );
  }

  if (category === "HOSTING") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="6" rx="1.5" />
        <rect x="4" y="14" width="16" height="6" rx="1.5" />
        <path d="M8 7h.01M8 17h.01M12 7h5M12 17h5" />
      </svg>
    );
  }

  if (category === "DOMAIN") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3.5 9h17M3.5 15h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12s1.1 6.6 3.3 9" />
      </svg>
    );
  }

  if (category === "SUPPORT") {
    return (
      <svg {...common}>
        <path d="M4 13v-2a8 8 0 0 1 16 0v2M4 13h3v6H5a1 1 0 0 1-1-1v-5ZM20 13h-3v6h2a1 1 0 0 0 1-1v-5ZM17 19c0 1.1-1.8 2-4 2" />
      </svg>
    );
  }

  if (category === "TRAINING") {
    return (
      <svg {...common}>
        <path d="M4 5.5h11a3 3 0 0 1 3 3V20H7a3 3 0 0 1-3-3V5.5Z" />
        <path d="M7 5.5V20M10 9h5M10 13h5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z" />
    </svg>
  );
}

function featureValue(
  feature: CustomerVisibleServiceFeature,
  locale: Locale,
  yes: string,
  no: string,
): string {
  if (feature.feature.valueType === "BOOLEAN") {
    return feature.value ? yes : no;
  }

  if (feature.feature.valueType === "TEXT") {
    return feature.valueTranslations[locale]?.trim() || String(feature.value);
  }

  return `${String(feature.value)}${
    feature.feature.unit ? ` ${feature.feature.unit}` : ""
  }`;
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
  const result = await apiRequest<
    PaginatedResult<CustomerServiceAssignmentCard>
  >(`/service-assignments?limit=20&offset=${offset}`, { token });
  const labels = customerPortalRefinementDictionaries[locale].services;
  const featureLabels = serviceFeatureDictionaries[locale];
  const subscriptionLabels = subscriptionsDictionaries[locale];

  return (
    <div className="grid gap-6 sm:gap-7">
      <section className="rounded-xl border border-line bg-surface-panel px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              {labels.eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-content sm:text-3xl">
              {services.customerTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              {services.customerDescription}
            </p>
          </div>
          <div className="rounded-lg bg-surface-subtle px-4 py-3 text-start">
            <p className="text-xs font-medium text-muted">
              {labels.totalServices}
            </p>
            <p className="mt-1 text-2xl font-semibold text-content">
              {result.pagination.total}
            </p>
          </div>
        </div>
      </section>

      {result.items.length === 0 ? (
        <Panel>
          <EmptyState
            title={services.customerEmptyTitle}
            description={services.customerEmptyDescription}
          />
        </Panel>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {result.items.map((assignment) => {
            const name = localized(
              assignment.displayName ?? assignment.service.name,
              assignment.displayName
                ? assignment.displayNameTranslations
                : assignment.service.nameTranslations,
              locale,
            );
            const description = assignment.service.description
              ? localized(
                  assignment.service.description,
                  assignment.service.descriptionTranslations,
                  locale,
                )
              : null;

            return (
              <article
                key={assignment.id}
                className="flex min-h-full flex-col overflow-hidden rounded-xl border border-line bg-surface-panel shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <ServiceIcon category={assignment.service.category} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                            {
                              services.categoryLabels[
                                assignment.service.category
                              ]
                            }
                          </p>
                          <h2 className="mt-1.5 line-clamp-2 text-lg font-semibold text-content">
                            {name}
                          </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <AssignmentStatusBadge
                            status={assignment.status}
                            labels={services}
                          />
                          {assignment.entitlement.state !== "PERPETUAL" ? (
                            <SubscriptionStatusBadge
                              entitlement={assignment.entitlement}
                              labels={subscriptionLabels}
                            />
                          ) : null}
                        </div>
                      </div>

                      {description ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
                          {description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {assignment.entitlement.state !== "PERPETUAL" ? (
                    <SubscriptionMeter
                      entitlement={assignment.entitlement}
                      labels={subscriptionLabels}
                      locale={locale}
                    />
                  ) : assignment.expiresAt ? (
                    <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
                      {services.expiresAt}:{" "}
                      <span className="font-medium text-content">
                        {formatDate(assignment.expiresAt, locale)}
                      </span>
                    </p>
                  ) : null}

                  <div className="mt-5 rounded-lg bg-surface-subtle p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-content">
                        {labels.features}
                      </h3>
                      {assignment.visibleFeatureCount >
                      assignment.featurePreview.length ? (
                        <span className="text-[11px] font-medium text-brand">
                          {labels.moreFeatures.replace(
                            "{count}",
                            String(
                              assignment.visibleFeatureCount -
                                assignment.featurePreview.length,
                            ),
                          )}
                        </span>
                      ) : null}
                    </div>

                    {assignment.featurePreview.length > 0 ? (
                      <dl className="mt-3 grid gap-2.5">
                        {assignment.featurePreview.map((feature) => {
                          const featureName = localized(
                            feature.feature.name,
                            feature.feature.nameTranslations,
                            locale,
                          );
                          const value = featureValue(
                            feature,
                            locale,
                            featureLabels.yes,
                            featureLabels.no,
                          );

                          return (
                            <div
                              key={feature.id}
                              className="flex items-center justify-between gap-4 text-sm"
                            >
                              <dt className="flex min-w-0 items-center gap-2 text-muted">
                                <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                                  <svg
                                    aria-hidden="true"
                                    viewBox="0 0 16 16"
                                    className="size-3"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="m4 8 2.4 2.4L12 5" />
                                  </svg>
                                </span>
                                <span className="truncate">{featureName}</span>
                              </dt>
                              <dd
                                dir={
                                  feature.feature.valueType === "TEXT"
                                    ? undefined
                                    : "ltr"
                                }
                                className="shrink-0 font-semibold text-content"
                              >
                                {value}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    ) : (
                      <p className="mt-3 text-xs leading-5 text-muted">
                        {labels.featurePreviewEmpty}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 border-t border-line bg-white px-5 py-4 sm:px-6">
                  {assignment.serviceUrl ? (
                    <a
                      href={assignment.serviceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
                    >
                      {labels.accessService}
                      <span
                        aria-hidden="true"
                        className="ms-2 rtl:-scale-x-100"
                      >
                        →
                      </span>
                    </a>
                  ) : null}

                  <Link
                    href={`/dashboard/services/${assignment.id}`}
                    className={`inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-content transition hover:bg-surface-subtle ${
                      assignment.serviceUrl ? "" : "flex-1"
                    }`}
                  >
                    {labels.viewDetails}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {result.pagination.total > result.pagination.limit ? (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between gap-4 border-t border-line pt-4"
        >
          <p className="text-xs text-muted">
            {result.pagination.total} {services.records}
          </p>
          <div className="flex gap-2">
            {result.pagination.offset > 0 ? (
              <Link
                href={`/dashboard/services?offset=${Math.max(
                  0,
                  result.pagination.offset - result.pagination.limit,
                )}`}
                className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-medium text-content hover:bg-surface-subtle"
              >
                {services.previous}
              </Link>
            ) : null}
            {result.pagination.offset + result.items.length <
            result.pagination.total ? (
              <Link
                href={`/dashboard/services?offset=${
                  result.pagination.offset + result.pagination.limit
                }`}
                className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-medium text-content hover:bg-surface-subtle"
              >
                {services.next}
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
