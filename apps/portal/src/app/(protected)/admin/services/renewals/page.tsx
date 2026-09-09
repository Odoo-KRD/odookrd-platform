import {
  PERMISSIONS,
  type PaginatedResult,
  type SubscriptionRenewalRequest,
} from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RenewalReviewActions } from "@/components/services/renewal-review-actions";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getServicesDictionary } from "@/lib/i18n/services/server";
import { subscriptionsDictionaries } from "@/lib/i18n/services/subscriptions";

import {
  approveRenewalRequestAction,
  rejectRenewalRequestAction,
} from "../actions";

export default async function RenewalRequestsPage() {
  const [{ session, token }, { locale, services }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.SERVICES_MANAGE),
    getServicesDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  const labels = subscriptionsDictionaries[locale];

  const requests = await apiRequest<
    PaginatedResult<SubscriptionRenewalRequest>
  >("/subscription-renewal-requests?limit=50&offset=0&status=PENDING", {
    token,
  });

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.renewalQueue}
        description={labels.renewalQueueDescription}
        actions={
          <Link
            href="/admin/services"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {services.back}
          </Link>
        }
      />

      {requests.items.length === 0 ? (
        <Panel className="p-6 sm:p-8">
          <EmptyState
            title={labels.renewalQueue}
            description={labels.renewalQueueEmpty}
          />
        </Panel>
      ) : (
        <div className="grid gap-4">
          {requests.items.map((request) => (
            <Panel key={request.id} className="p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {labels.company}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {request.subscription.companyService.company.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {labels.service}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {request.subscription.companyService.displayName ??
                      request.subscription.companyService.service.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {labels.term}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {labels.termLabels[request.requestedTerm]}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {labels.periodEnd}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatDate(request.subscription.currentPeriodEnd, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {labels.requestedBy}
                  </p>
                  <p className="mt-2 text-sm text-slate-900">
                    {request.requestedBy.displayName ??
                      request.requestedBy.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {labels.requestedAt}
                  </p>
                  <p className="mt-2 text-sm text-slate-900">
                    {formatDate(request.createdAt, locale)}
                  </p>
                </div>
              </div>

              {request.note ? (
                <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {request.note}
                </p>
              ) : null}

              <div className="mt-5 border-t border-slate-200 pt-5">
                <RenewalReviewActions
                  labels={labels}
                  approveAction={approveRenewalRequestAction.bind(
                    null,
                    request.id,
                  )}
                  rejectAction={rejectRenewalRequestAction.bind(
                    null,
                    request.id,
                  )}
                />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
