import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse } from "@/lib/security";

const datasets = new Set(["courses", "learners", "quizzes", "certificates"]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return errorResponse(401, "Authentication is required.");

  const dataset = request.nextUrl.searchParams.get("dataset");
  if (!dataset || !datasets.has(dataset)) {
    return errorResponse(400, "A valid reporting dataset is required.");
  }

  const upstreamQuery = new URLSearchParams({ dataset });

  for (const key of ["companyId", "courseId", "categoryId"] as const) {
    const value = request.nextUrl.searchParams.get(key);
    if (!value) continue;
    if (!uuidPattern.test(value)) {
      return errorResponse(400, `Invalid ${key}.`);
    }
    upstreamQuery.set(key, value);
  }

  for (const key of ["dateFrom", "dateTo"] as const) {
    const value = request.nextUrl.searchParams.get(key);
    if (!value) continue;
    if (!datePattern.test(value)) {
      return errorResponse(400, `Invalid ${key}.`);
    }
    upstreamQuery.set(key, value);
  }

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      new URL(
        `/v1/training/reports/export?${upstreamQuery.toString()}`,
        apiBaseUrl,
      ),
      {
        headers: {
          Accept: "text/csv",
          "Accept-Language": request.headers.get("accept-language") ?? "ku",
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
    let message = "The training report could not be exported.";
    try {
      const body = (await upstream.json()) as { message?: unknown };
      if (typeof body.message === "string") message = body.message;
    } catch {}
    return errorResponse(upstream.status, message);
  }

  if (!upstream.body) {
    return errorResponse(502, "The training report response was empty.");
  }

  const headers = new Headers({
    "Content-Type":
      upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
    "Content-Disposition":
      upstream.headers.get("content-disposition") ??
      `attachment; filename="odookrd-training-${dataset}.csv"`,
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  });
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
