import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse } from "@/lib/security";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ slug: string; lessonId: string; resourceId: string }>;
  },
) {
  const { slug, lessonId, resourceId } = await context.params;
  if (
    !slugPattern.test(slug) ||
    !uuid.test(lessonId) ||
    !uuid.test(resourceId)
  ) {
    return errorResponse(404, "Resource not found.");
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
        `/v1/training/catalog/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonId)}/resources/${encodeURIComponent(resourceId)}`,
        apiBaseUrl,
      ),
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );
  } catch {
    return errorResponse(502, "The API service is temporarily unavailable.");
  }

  const headers = new Headers();
  for (const name of [
    "content-type",
    "content-length",
    "content-disposition",
    "x-file-sha256",
    "x-content-type-options",
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Cache-Control", "private, no-store, max-age=0");
  return new Response(upstream.body, { status: upstream.status, headers });
}
