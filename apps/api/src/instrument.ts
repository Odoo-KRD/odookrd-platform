// The .env file is read by ConfigModule, which initialises long after this
// module runs, and the systemd unit does not use EnvironmentFile. Loading it
// here is what makes SENTRY_DSN visible at init time.
import 'dotenv/config';

import * as Sentry from '@sentry/nestjs';

/**
 * Sentry initialisation.
 *
 * Imported first in main.ts, before any application module, because the SDK
 * has to patch Node's internals before the code it instruments is loaded.
 *
 * Doing nothing when SENTRY_DSN is unset is deliberate: development and CI run
 * without a DSN, and the application must behave identically either way.
 */
const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',

    // Set from the deployed commit so an issue points at the release that
    // introduced it. See SENTRY_RELEASE in .env.example.
    release: process.env.SENTRY_RELEASE?.trim() || undefined,

    // Low traffic, so capture everything rather than sampling. Revisit if the
    // event quota is ever a concern.
    tracesSampleRate: 0,

    // Never send request bodies or headers. Session tokens are live bearer
    // credentials, and the same reasoning applies here as to the logs.
    sendDefaultPii: false,

    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
        // The query string can carry identifiers and search terms.
        delete event.request.query_string;
      }

      return event;
    },
  });
}

export const sentryEnabled = Boolean(dsn);

// A one-line signal at boot, so a missing or malformed DSN is visible in the
// journal instead of failing silently.
console.log(
  JSON.stringify({
    level: 30,
    context: 'Sentry',
    msg: dsn ? 'Error reporting enabled' : 'Error reporting disabled (no DSN)',
  }),
);
