/**
 * Next.js instrumentation hook.
 *
 * Loads the Sentry server config once per runtime. The edge runtime gets its
 * own config because it cannot use Node APIs.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
