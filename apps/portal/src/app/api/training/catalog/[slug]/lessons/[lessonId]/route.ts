import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse } from "@/lib/security";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; lessonId: string }> },
) {
  const { slug, lessonId } = await context.params;
  if (!slugPattern.test(slug) || slug.length > 150 || !uuid.test(lessonId)) {
    return errorResponse(404, "Not found.");
  }
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return errorResponse(401, "Authentication is required.");
  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl)
    return errorResponse(500, "The portal API is not configured correctly.");

  let upstream: Response;
  try {
    upstream = await fetch(
      new URL(
        `/v1/training/catalog/${encodeURIComponent(slug)}/lessons/${lessonId}`,
        apiBaseUrl,
      ),
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    return errorResponse(502, "The API service is temporarily unavailable.");
  }
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ??
        "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
