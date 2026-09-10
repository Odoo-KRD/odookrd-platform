import {
  PERMISSIONS,
  type SubscriptionPipelineBucket,
  type SubscriptionPipelineReport,
} from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SubscriptionStatusBadge } from "@/components/services/subscription-meter";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getServicesDictionary } from "@/lib/i18n/services/server";
import { subscriptionsDictionaries } from "@/lib/i18n/services/subscriptions";

const BUCKET_ORDER: SubscriptionPipelineBucket[] = [
  "OVERDUE",
  "WITHIN_7",
  "WITHIN_30",
  "WITHIN_60",
  "WITHIN_90",
];

const bucketTone: Record<SubscriptionPipelineBucket, string> = {
  OVERDUE: "text-rose-700",
  WITHIN_7: "text-rose-600",
  WITHIN_30: "text-amber-700",
  WITHIN_60: "text-slate-700",
  WITHIN_90: "text-slate-500",
};

export default async function RenewalPipelinePage() {
  const [{ session, token }, { locale, services }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.SERVICES_MANAGE),
    getServicesDictionary(),
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  const labels = subscriptionsDictionaries[locale];

  const report = await apiRequest<SubscriptionPipelineReport>(
    "/subscription-reports/pipeline",
    { token },
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.pipeline}
        description={labels.pipelineDescription}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/services"
              className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {services.back}
            </Link>
          </div>
        }
      />

      <Panel className="p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {labels.needsAttention}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {report.summary.needsAttention}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {labels.autoRenewing}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {report.summary.autoRenewing}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {labels.totalUpcoming}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {report.summary.total}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-5">
          {BUCKET_ORDER.map((bucket) => (
            <div key={bucket}>
              <p className="text-xs font-medium text-slate-500">
                {labels.bucketLabels[bucket]}
              </p>
              <p className={`mt-1 text-lg font-semibold ${bucketTone[bucket]}`}>
                {report.summary.counts[bucket]}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
          {/* Plain links, not fetches: the browser streams the CSV straight to
              disk and the session cookie authenticates the proxied request. */}
          <a
            href="/api/subscription-reports/export?dataset=pipeline"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {labels.exportPipeline}
          </a>
          <a
            href="/api/subscription-reports/export?dataset=renewal-history"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {labels.exportHistory}
          </a>
        </div>
      </Panel>

      {report.items.length === 0 ? (
        <Panel className="p-6 sm:p-8">
          <EmptyState
            title={labels.pipeline}
            description={labels.pipelineEmpty}
          />
        </Panel>
      ) : (
        <Panel className="overflow-x-auto p-6 sm:p-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3">{labels.company}</th>
                <th className="pb-3">{labels.service}</th>
                <th className="pb-3">{labels.term}</th>
                <th className="pb-3">{labels.status}</th>
                <th className="pb-3">{labels.periodEnd}</th>
                <th className="pb-3">{labels.daysRemaining}</th>
                <th className="pb-3">{labels.autoRenew}</th>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item) => (
                <tr
                  key={item.subscriptionId}
                  className="border-t border-slate-100"
                >
                  <td className="py-3 font-medium text-slate-900">
                    {item.companyName}
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/admin/services/assignments/${item.assignmentId}`}
                      className="text-[#714b67] hover:underline"
                    >
                      {item.serviceName}
                    </Link>
                  </td>
                  <td className="py-3">{labels.termLabels[item.term]}</td>
                  <td className="py-3">
                    <SubscriptionStatusBadge
                      entitlement={item.entitlement}
                      labels={labels}
                    />
                  </td>
                  <td className="py-3">
                    {formatDate(item.currentPeriodEnd, locale)}
                  </td>
                  <td className={`py-3 font-medium ${bucketTone[item.bucket]}`}>
                    {item.entitlement.daysRemaining ?? "—"}
                  </td>
                  <td className="py-3">
                    {item.autoRenew ? labels.yes : labels.no}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
