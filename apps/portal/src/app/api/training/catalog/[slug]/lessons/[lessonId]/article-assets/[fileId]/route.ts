import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse } from "@/lib/security";

export const runtime = "nodejs";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      slug: string;
      lessonId: string;
      fileId: string;
    }>;
  },
) {
  const { slug, lessonId, fileId } = await context.params;

  if (
    !slugPattern.test(slug) ||
    slug.length > 150 ||
    !uuid.test(lessonId) ||
    !uuid.test(fileId)
  ) {
    return errorResponse(404, "Not found.");
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return errorResponse(401, "Authentication is required.");

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      new URL(
        `/v1/training/catalog/${encodeURIComponent(slug)}/lessons/${lessonId}/article-assets/${fileId}`,
        apiBaseUrl,
      ),
      {
        headers: {
          Accept: request.headers.get("accept") ?? "*/*",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );
  } catch {
    return errorResponse(
      502,
      "The protected Article asset is temporarily unavailable.",
    );
  }

  if (!upstream.ok || !upstream.body) {
    return errorResponse(
      upstream.status === 404 ? 404 : 502,
      upstream.status === 404
        ? "Not found."
        : "The protected Article asset could not be loaded.",
    );
  }

  const headers = new Headers({
    "Content-Type":
      upstream.headers.get("content-type") ?? "application/octet-stream",
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  });

  for (const name of [
    "content-length",
    "content-disposition",
    "content-security-policy",
    "x-file-sha256",
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
