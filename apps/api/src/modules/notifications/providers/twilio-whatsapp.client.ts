import { NotificationProviderError } from '../notification-provider.error';
import {
  WHATSAPP_TEMPLATE_NAME_PREFIX,
  catalogVariables,
} from './whatsapp-template-catalog';

const TWILIO_API = 'https://api.twilio.com/2010-04-01';
const TWILIO_CONTENT_API = 'https://content.twilio.com/v1';

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

  // The platform's own order wins over the stored map, so an old or
  // hand-edited map cannot shift values into the wrong {{n}}.
  const names =
    catalogVariables(templateKey) ??
    (Array.isArray(entry.variables) ? entry.variables : []);
  const contentVariables: Record<string, string> = {};

  names.forEach((name, index) => {
    // WhatsApp rejects empty template parameters, so a missing value is
    // sent as a dash rather than an empty string.
    contentVariables[String(index + 1)] =
      templateParameter(values[name]) || '-';
  });

  return { contentSid, contentVariables };
}

/**
 * WhatsApp rejects template parameters with new lines, tabs or more than
 * four spaces in a row, and long ones. Free text (a broadcast body, a
 * feedback comment) is folded onto one line and shortened.
 */
export function templateParameter(value: string | undefined): string {
  if (!value) return '';
  const single = value
    .replace(/[\r\n\t]+/gu, ' ')
    .replace(/ {2,}/gu, ' ')
    .trim();
  return single.length > 900 ? `${single.slice(0, 899)}…` : single;
}

/** One Twilio Content Template, as offered in the template mapping tab. */
export interface TwilioContentTemplate {
  sid: string;
  friendlyName: string;
  language: string | null;
  /** Number of {{n}} variables across the body and buttons. */
  variableCount: number;
  /** Content types, for example twilio/call-to-action. */
  types: string[];
  /** URLs of the template's "Visit website" buttons, {{n}} included. */
  buttonUrls: string[];
  /** WhatsApp approval status (approved, pending, rejected, …) or null. */
  approvalStatus: string | null;
  rejectionReason: string | null;
}

const CONTENT_PAGE_LIMIT = 10;

/**
 * Lists the account's Content Templates whose name starts with "odookrd",
 * with their WhatsApp approval status, following Twilio's paging.
 */
export async function listTwilioContentTemplates(
  credentials: TwilioCredentials,
): Promise<TwilioContentTemplate[]> {
  const authorization = Buffer.from(
    `${credentials.accountSid}:${credentials.authToken}`,
  ).toString('base64');
  const templates: TwilioContentTemplate[] = [];
  let url: string | null =
    `${TWILIO_CONTENT_API}/ContentAndApprovals?PageSize=100`;

  for (let page = 0; url && page < CONTENT_PAGE_LIMIT; page += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Basic ${authorization}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new NotificationProviderError('TWILIO_CONTENT_UNREACHABLE', true);
    }

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const code = (payload as TwilioErrorPayload | null)?.code;
      throw new NotificationProviderError(
        response.status === 401
          ? 'TWILIO_AUTH_FAILED'
          : typeof code === 'number'
            ? `TWILIO_${String(code)}`
            : `WHATSAPP_HTTP_${String(response.status)}`,
        response.status === 429 || response.status >= 500,
      );
    }

    const body = (payload ?? {}) as {
      contents?: unknown;
      meta?: { next_page_url?: unknown };
    };

    if (Array.isArray(body.contents)) {
      for (const item of body.contents) {
        const template = contentTemplate(item);
        if (
          template &&
          template.friendlyName
            .toLowerCase()
            .startsWith(WHATSAPP_TEMPLATE_NAME_PREFIX)
        ) {
          templates.push(template);
        }
      }
    }

    const next = body.meta?.next_page_url;
    // Only ever follow paging links back to Twilio's own Content API.
    url =
      typeof next === 'string' && next.startsWith(`${TWILIO_CONTENT_API}/`)
        ? next
        : null;
  }

  return templates.sort((left, right) =>
    left.friendlyName.localeCompare(right.friendlyName),
  );
}

function contentTemplate(item: unknown): TwilioContentTemplate | null {
  if (typeof item !== 'object' || item === null) {
    return null;
  }

  const record = item as Record<string, unknown>;
  const sid = record.sid;
  const friendlyName = record.friendly_name;

  if (
    typeof sid !== 'string' ||
    !/^HX[0-9a-f]{32}$/iu.test(sid) ||
    typeof friendlyName !== 'string'
  ) {
    return null;
  }

  const variables = record.variables;
  const types = record.types;
  // Returned as one object for WhatsApp; tolerate a list as well.
  const approvals: unknown[] = Array.isArray(record.approval_requests)
    ? record.approval_requests
    : [record.approval_requests];
  const whatsapp = approvals.find(
    (approval): approval is Record<string, unknown> =>
      typeof approval === 'object' &&
      approval !== null &&
      ((approval as Record<string, unknown>).type === undefined ||
        (approval as Record<string, unknown>).type === 'whatsapp'),
  );
  const buttonUrls: string[] = [];
  if (typeof types === 'object' && types !== null) {
    for (const content of Object.values(types as Record<string, unknown>)) {
      const actions =
        typeof content === 'object' && content !== null
          ? (content as { actions?: unknown }).actions
          : undefined;
      if (!Array.isArray(actions)) continue;
      for (const action of actions) {
        const url = (action as { url?: unknown } | null)?.url;
        if (typeof url === 'string' && url.length > 0) {
          buttonUrls.push(url.slice(0, 500));
        }
      }
    }
  }
  const status = whatsapp?.status;
  const rejection = whatsapp?.rejection_reason;

  return {
    sid,
    friendlyName: friendlyName.slice(0, 200),
    language:
      typeof record.language === 'string' ? record.language.slice(0, 20) : null,
    variableCount:
      typeof variables === 'object' && variables !== null
        ? Object.keys(variables).length
        : 0,
    types:
      typeof types === 'object' && types !== null ? Object.keys(types) : [],
    buttonUrls,
    approvalStatus:
      typeof status === 'string' && status.length > 0
        ? status.toLowerCase().slice(0, 40)
        : null,
    rejectionReason:
      typeof rejection === 'string' && rejection.length > 0
        ? rejection.slice(0, 300)
        : null,
  };
}
