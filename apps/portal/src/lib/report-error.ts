import * as Sentry from "@sentry/nextjs";

import { ApiRequestError } from "@/lib/api";

/**
 * Reports a server-side portal failure.
 *
 * The valuable case is an ApiRequestError: it already carries the request id
 * the API used, so the Sentry event links directly to the API log line that
 * recorded the same failure. That is the whole point of the correlation added
 * in 7B.
 *
 * Errors raised before any API call have no id to attach, which is correct —
 * inventing one here would tag the event with an identifier matching nothing.
 */
export function reportPortalError(
  error: unknown,
  context?: { route?: string },
): void {
  Sentry.withScope((scope) => {
    if (context?.route) {
      scope.setTag("route", context.route);
    }

    if (error instanceof ApiRequestError) {
      if (error.requestId) {
        scope.setTag("request_id", error.requestId);
      }

      scope.setTag("api_status", String(error.status));

      // A 502 means the API was unreachable, which is an infrastructure fault
      // rather than a portal bug. Tagging it separately keeps the two apart.
      scope.setTag(
        "failure_kind",
        error.status >= 500 ? "api_unavailable" : "api_rejected",
      );
    }

    Sentry.captureException(error);
  });
}
