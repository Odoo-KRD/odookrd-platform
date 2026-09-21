import { NotificationProviderError } from '../notification-provider.error';

const TWILIO_API = 'https://api.twilio.com/2010-04-01';

/** Twilio error codes that are about the recipient, not the sender. */
const DESTINATION_ERRORS = new Set([21211, 21614, 63003]);

/**
 * Outside the 24-hour customer-service window WhatsApp refuses free text
 * (63016). A second sender has no open window either, so falling back is
 * pointless; the fix is an approved template.
 */
const WINDOW_CLOSED = 63016;

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
}

export interface TwilioMessage {
  /** E.164 digits, with or without the leading +. */
  destination: string;
  /** Free text, used when no approved template applies. */
  body: string;
  /** Approved Content Template (HX…) and its numbered variables. */
  contentSid?: string | null;
  contentVariables?: Record<string, string>;
}

interface TwilioErrorPayload {
  code?: number;
  message?: string;
}

/**
 * Sends one WhatsApp message through Twilio's Messages API.
 *
 * Tries the primary sender first. When that fails for a reason a different
 * number could fix (a sender problem, an outage), it retries once from the
 * fallback sender. Recipient problems and a closed service window are not
 * retried on the other number.
 */
export async function sendTwilioWhatsApp(
  credentials: TwilioCredentials,
  senders: { primary: string; fallback: string | null },
  message: TwilioMessage,
): Promise<string | null> {
  try {
    return await sendFrom(credentials, senders.primary, message);
  } catch (error: unknown) {
    if (
      !senders.fallback ||
      !(error instanceof TwilioSendError) ||
      !error.fallbackWorthwhile
    ) {
      throw unwrap(error);
    }
  }

  try {
    return await sendFrom(credentials, senders.fallback, message);
  } catch (error: unknown) {
    // The dispatcher only understands NotificationProviderError, including
    // its retryable flag; the internal wrapper must never escape.
    throw unwrap(error);
  }
}

function unwrap(error: unknown): unknown {
  return error instanceof TwilioSendError ? error.providerError : error;
}

class TwilioSendError extends Error {
  constructor(
    readonly providerError: NotificationProviderError,
    readonly fallbackWorthwhile: boolean,
  ) {
    super(providerError.message);
  }
}

async function sendFrom(
  credentials: TwilioCredentials,
  sender: string,
  message: TwilioMessage,
): Promise<string | null> {
  const to = normalizeNumber(message.destination);
  const from = normalizeNumber(sender);

  if (!to) {
    throw new NotificationProviderError(
      'WHATSAPP_DESTINATION_INVALID',
      false,
      'Notification destination is invalid.',
    );
  }

  if (!from) {
    throw new TwilioSendError(
      new NotificationProviderError(
        'WHATSAPP_SENDER_INVALID',
        false,
        'Notification delivery configuration is incomplete.',
      ),
      true,
    );
  }

  const form = new URLSearchParams({
    To: `whatsapp:+${to}`,
    From: `whatsapp:+${from}`,
  });

  if (message.contentSid) {
    form.set('ContentSid', message.contentSid);
    form.set(
      'ContentVariables',
      JSON.stringify(message.contentVariables ?? {}),
    );
  } else {
    form.set('Body', message.body);
  }

  const endpoint = `${TWILIO_API}/Accounts/${encodeURIComponent(
    credentials.accountSid,
  )}/Messages.json`;
  const authorization = Buffer.from(
    `${credentials.accountSid}:${credentials.authToken}`,
  ).toString('base64');

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authorization}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // The request may or may not have reached Twilio: no retry and no
    // fallback, so the customer never receives the same message twice.
    throw new NotificationProviderError('WHATSAPP_REQUEST_UNCERTAIN', false);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = (payload ?? {}) as TwilioErrorPayload;
    const code = typeof detail.code === 'number' ? detail.code : null;
    const retryable = response.status === 429 || response.status >= 500;
    const providerError = new NotificationProviderError(
      code
        ? `TWILIO_${String(code)}`
        : `WHATSAPP_HTTP_${String(response.status)}`,
      retryable,
    );
    const fallbackWorthwhile =
      code === null ||
      (!DESTINATION_ERRORS.has(code) &&
        code !== WINDOW_CLOSED &&
        response.status !== 401);

    throw new TwilioSendError(providerError, fallbackWorthwhile);
  }

  const sid = (payload as { sid?: unknown } | null)?.sid;
  return typeof sid === 'string' && sid.length <= 255 ? sid : null;
}

/** Digits only; a WhatsApp number is 8 to 15 digits in E.164. */
export function normalizeNumber(value: string): string | null {
  const digits = value.replace(/^whatsapp:/u, '').replace(/[\s()+-]/gu, '');
  return /^\d{8,15}$/u.test(digits) ? digits : null;
}

export interface ContentTemplateEntry {
  /** Variable names, in the order of the template's {{1}}, {{2}}, … */
  variables: string[];
  [locale: string]: string | string[] | undefined;
}

/**
 * Resolves a notification to an approved Twilio Content Template.
 *
 * The map is stored as JSON in settings, for example:
 *   { "helpdesk.ticket.replied": { "variables": ["reference", "subject"],
 *       "ku": "HX…", "ar": "HX…", "en": "HX…", "default": "HX…" } }
 * Returns null when the notification type has no template, in which case the
 * message is sent as free text (only delivered inside the 24-hour window).
 */
export function resolveContentTemplate(
  mapJson: string | null,
  templateKey: string,
  locale: string,
  values: Record<string, string>,
): { contentSid: string; contentVariables: Record<string, string> } | null {
  if (!mapJson?.trim()) {
    return null;
  }

  let map: unknown;
  try {
    map = JSON.parse(mapJson);
  } catch {
    throw new NotificationProviderError(
      'WHATSAPP_TEMPLATE_MAP_INVALID',
      false,
      'Notification delivery configuration is incomplete.',
    );
  }

  const entry = (map as Record<string, ContentTemplateEntry | undefined>)[
    templateKey
  ];

  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const contentSid = entry[locale] ?? entry.default;

  if (
    typeof contentSid !== 'string' ||
    !/^HX[0-9a-f]{32}$/iu.test(contentSid)
  ) {
    return null;
  }

  const names = Array.isArray(entry.variables) ? entry.variables : [];
  const contentVariables: Record<string, string> = {};

  names.forEach((name, index) => {
    // WhatsApp rejects empty template parameters, so a missing value is
    // sent as a dash rather than an empty string.
    contentVariables[String(index + 1)] = values[name]?.trim() || '-';
  });

  return { contentSid, contentVariables };
}
