import { cookies } from "next/headers";

import { LOCALE_COOKIE_NAME } from "@/lib/constants";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n/config";
import { getRequestId } from "@/lib/request-id";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Correlates this failure with the API log line that produced it. */
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

interface ApiRequestOptions extends RequestInit {
  token?: string;
}

function getErrorMessage(value: unknown, fallback: string): string {
  if (typeof value !== "object" || value === null || !("message" in value)) {
    return fallback;
  }

  const message = value.message;

  if (typeof message === "string") {
    return message;
  }

  if (Array.isArray(message) && typeof message[0] === "string") {
    return message[0];
  }

  return fallback;
}

async function getRequestLocale(): Promise<string> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

export async function apiRequest<T>(
  path: string,
  { token, headers: requestedHeaders, ...options }: ApiRequestOptions = {},
): Promise<T> {
  const apiBaseUrl = process.env.ODOOKRD_API_URL;

  if (!apiBaseUrl || !path.startsWith("/")) {
    throw new ApiRequestError(
      500,
      "The portal API is not configured correctly.",
    );
  }

  const headers = new Headers(requestedHeaders);

  headers.set("Accept", "application/json");

  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", await getRequestLocale());
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Shared by every call in this render and echoed back by the API, so one
  // page failure traces to one identifier across both services.
  const requestId = await getRequestId();
  headers.set("x-request-id", requestId);

  let response: Response;

  try {
    response = await fetch(new URL(`/v1${path}`, apiBaseUrl), {
      ...options,
      headers,
      cache: "no-store",
      signal: options.signal ?? AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiRequestError(
      502,
      "The API service is temporarily unavailable.",
      requestId,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    if (response.ok) {
      throw new ApiRequestError(
        502,
        "The API returned an invalid response.",
        requestId,
      );
    }
  }

  if (!response.ok) {
    const fallback =
      response.status >= 500
        ? "The API service is temporarily unavailable."
        : "The request could not be completed.";

    // Prefer the id the API actually used; it will match its own log line.
    throw new ApiRequestError(
      response.status,
      response.status >= 500 ? fallback : getErrorMessage(body, fallback),
      response.headers.get("x-request-id") ?? requestId,
    );
  }

  return body as T;
}
