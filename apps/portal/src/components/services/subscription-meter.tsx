import type { Locale, ServiceEntitlement } from "@odookrd/types";

import { formatDate } from "@/lib/format";

import type { SubscriptionsDictionary } from "@/lib/i18n/subscriptions";

/**
 * How urgent the remaining period is. Drives colour on both the badge and the
 * meter so a customer can read the state at a glance without parsing a date.
 */
type Tone = "neutral" | "healthy" | "warning" | "critical";

const WARNING_DAYS = 30;

function toneFor(entitlement: ServiceEntitlement): Tone {
  if (!entitlement.available) {
    return "critical";
  }

  if (entitlement.inGrace) {
    return "warning";
  }

  if (entitlement.state === "PERPETUAL") {
    return "neutral";
  }

  return entitlement.daysRemaining !== null &&
    entitlement.daysRemaining <= WARNING_DAYS
    ? "warning"
    : "healthy";
}

const badgeTones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  healthy: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  critical: "bg-rose-50 text-rose-700",
};

const barTones: Record<Tone, string> = {
  neutral: "bg-slate-400",
  healthy: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-rose-500",
};

export function SubscriptionStatusBadge({
  entitlement,
  labels,
}: {
  entitlement: ServiceEntitlement;
  labels: SubscriptionsDictionary;
}) {
  const tone = toneFor(entitlement);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeTones[tone]}`}
    >
      {labels.statusLabels[entitlement.state] ?? entitlement.state}
    </span>
  );
}

/**
 * Remaining-period meter.
 *
 * Perpetual services render nothing: there is no period to run down, and an
 * empty bar would read as "expired" rather than "not applicable".
 */
export function SubscriptionMeter({
  entitlement,
  labels,
  locale,
}: {
  entitlement: ServiceEntitlement;
  labels: SubscriptionsDictionary;
  locale: Locale;
}) {
  if (entitlement.state === "PERPETUAL" || entitlement.periodEnd === null) {
    return null;
  }

  const tone = toneFor(entitlement);
  const elapsed = entitlement.elapsedRatio ?? 1;
  const remaining = Math.round(Math.min(1, Math.max(0, 1 - elapsed)) * 100);
  const days = entitlement.daysRemaining;

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted">
          {entitlement.available ? labels.accessEndsAt : labels.expired}
        </span>
        <span className="text-xs font-medium text-content">
          {entitlement.accessEndsAt
            ? formatDate(entitlement.accessEndsAt, locale)
            : "—"}
        </span>
      </div>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={remaining}
        aria-label={labels.daysRemaining}
      >
        <div
          className={`h-full rounded-full transition-all ${barTones[tone]}`}
          style={{ width: `${remaining}%` }}
        />
      </div>

      {entitlement.available && days !== null && days >= 0 ? (
        <p className="mt-2 text-xs text-muted">
          {labels.daysRemaining}:{" "}
          <span className="font-medium text-content">{days}</span>
          {entitlement.inGrace ? ` · ${labels.inGrace}` : ""}
          {entitlement.autoRenew ? ` · ${labels.autoRenew}` : ""}
        </p>
      ) : null}
    </div>
  );
}
