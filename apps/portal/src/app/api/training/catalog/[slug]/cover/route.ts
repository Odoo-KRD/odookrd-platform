import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  if (slug.length > 150 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return errorResponse(404, "Not found.");
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse(401, "Authentication is required.");
  }

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      new URL(
        `/v1/training/catalog/${encodeURIComponent(slug)}/cover`,
        apiBaseUrl,
      ),
      {
        method: "GET",
        headers: {
          Accept: "image/*",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    return errorResponse(502, "The API service is temporarily unavailable.");
  }

  if (!upstream.ok || !upstream.body) {
    return errorResponse(
      upstream.status === 404 ? 404 : 502,
      upstream.status === 404
        ? "Not found."
        : "The course cover could not be loaded.",
    );
  }

  const headers = new Headers({
    "Content-Type":
      upstream.headers.get("content-type") ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store, max-age=0",
  });

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  const contentSecurityPolicy = upstream.headers.get("content-security-policy");
  if (contentSecurityPolicy) {
    headers.set("Content-Security-Policy", contentSecurityPolicy);
  }

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
