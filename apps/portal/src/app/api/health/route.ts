import { NextResponse } from "next/server";

/**
 * Portal health, for external uptime monitoring.
 *
 * Monitoring the API alone would miss a portal outage, and the portal is what
 * customers actually reach. A portal that cannot reach the API is unusable
 * even though its own process is fine, so this reports unhealthy in that case
 * too — the question being answered is "can a customer use the portal", not
 * "is this process running".
 *
 * The body carries no version, dependency or error detail: it is polled from
 * the public internet, and an outage is not an invitation to map the estate.
 */
const UPSTREAM_TIMEOUT_MS = 4_000;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const apiBaseUrl = process.env.ODOOKRD_API_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const upstream = await fetch(new URL("/health/ready", apiBaseUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { status: "error" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch {
    return NextResponse.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { status: "ok" },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
