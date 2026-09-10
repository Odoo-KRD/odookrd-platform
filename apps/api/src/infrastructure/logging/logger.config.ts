import { randomUUID } from 'node:crypto';

import type { Params } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Structured logging.
 *
 * Every line is JSON on stdout, which systemd captures into journald. Nothing
 * is written to a file, so there is no rotation to configure.
 *
 * Redaction is the important part rather than an afterthought. Session tokens
 * are live bearer credentials: anything that logged one would be handing out a
 * working login to whoever can read the logs. The paths below are removed
 * before a line is ever written.
 */
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.token',
  'req.body.invitationToken',
  'req.body.secret',
  'req.body.accessKeyId',
  'req.body.secretAccessKey',
];

/** Requests that would otherwise fill the log with no information. */
const SILENT_PATHS = new Set(['/health/live', '/health/ready']);

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function buildLoggerOptions(nodeEnv: string): Params {
  const isProduction = nodeEnv === 'production';

  return {
    pinoHttp: {
      level: isProduction ? 'info' : 'debug',
      redact: { paths: REDACTED_PATHS, remove: true },

      /**
       * Honours an inbound x-request-id so a portal request and the API calls
       * it triggers share one identifier, then generates one when absent.
       */
      genReqId: (request: IncomingMessage, response: ServerResponse) => {
        const existing = headerValue(request.headers['x-request-id']);
        const id = existing?.trim() || randomUUID();

        response.setHeader('x-request-id', id);

        return id;
      },

      autoLogging: {
        ignore: (request: IncomingMessage) =>
          SILENT_PATHS.has((request.url ?? '').split('?')[0]),
      },

      customLogLevel: (_request, response, error) => {
        if (error || response.statusCode >= 500) {
          return 'error';
        }

        // Rejected credentials and forbidden access are normal traffic, not
        // faults. Logging them at warn keeps genuine errors findable.
        if (response.statusCode >= 400) {
          return 'warn';
        }

        return 'info';
      },

      // Only what is useful for tracing a request; no bodies, no headers beyond
      // the few named here.
      serializers: {
        req: (request: IncomingMessage & { id?: string }) => ({
          id: request.id,
          method: request.method,
          url: (request.url ?? '').split('?')[0],
        }),
        res: (response: ServerResponse) => ({
          statusCode: response.statusCode,
        }),
      },

      transport: isProduction
        ? undefined
        : { target: 'pino-pretty', options: { singleLine: true } },
    },
  };
}
