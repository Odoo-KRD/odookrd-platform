import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse } from "@/lib/security";

/**
 * Streams a subscription report CSV from the API.
 *
 * Mirrors the training report export: the session cookie is exchanged for a
 * bearer token server-side, and the upstream body is streamed straight through
 * rather than buffered.
 */
const datasets = new Map([
  ["pipeline", "/v1/subscription-reports/pipeline/export"],
  ["renewal-history", "/v1/subscription-reports/renewal-history/export"],
]);

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return errorResponse(401, "Authentication is required.");

  const dataset = request.nextUrl.searchParams.get("dataset");
  const upstreamPath = dataset ? datasets.get(dataset) : undefined;

  if (!upstreamPath) {
    return errorResponse(400, "A valid reporting dataset is required.");
  }

  const upstreamQuery = new URLSearchParams();
  const companyId = request.nextUrl.searchParams.get("companyId");

  if (companyId) {
    if (!uuidPattern.test(companyId)) {
      return errorResponse(400, "Invalid companyId.");
    }
    upstreamQuery.set("companyId", companyId);
  }

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  const query = upstreamQuery.toString();

  let upstream: Response;
  try {
    upstream = await fetch(
      new URL(query ? `${upstreamPath}?${query}` : upstreamPath, apiBaseUrl),
      {
        headers: {
          Accept: "text/csv",
          "Accept-Language": request.headers.get("accept-language") ?? "ku",
          "x-request-id":
            request.headers.get("x-request-id") ?? crypto.randomUUID(),
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );
  } catch {
    return errorResponse(502, "The API service is temporarily unavailable.");
  }

  if (!upstream.ok) {
    let message = "The subscription report could not be exported.";
    try {
      const body = (await upstream.json()) as { message?: unknown };
      if (typeof body.message === "string") message = body.message;
    } catch {}
    return errorResponse(upstream.status, message);
  }

  if (!upstream.body) {
    return errorResponse(502, "The subscription report response was empty.");
  }

  const headers = new Headers({
    "Content-Type":
      upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
    "Content-Disposition":
      upstream.headers.get("content-disposition") ??
      `attachment; filename="odookrd-subscriptions-${dataset}.csv"`,
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  });

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new Response(upstream.body, { status: 200, headers });
}
