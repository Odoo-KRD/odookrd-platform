import * as Sentry from "@sentry/nextjs";

/**
 * Server-side Sentry for the portal.
 *
 * No DSN means no initialisation, so development and CI behave exactly as they
 * do today.
 */
const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE?.trim() || undefined,
    tracesSampleRate: 0,

    // Never send request bodies, headers or cookies: the session cookie is a
    // live credential.
    sendDefaultPii: false,

    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.query_string;
      }

      return event;
    },
  });
}
