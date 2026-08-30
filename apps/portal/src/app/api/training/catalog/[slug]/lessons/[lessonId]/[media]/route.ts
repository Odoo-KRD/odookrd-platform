import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse } from "@/lib/security";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedMedia = new Set(["video", "slides", "hls", "hls-resource"]);

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ slug: string; lessonId: string; media: string }>;
  },
) {
  const { slug, lessonId, media } = await context.params;
  if (
    !slugPattern.test(slug) ||
    slug.length > 150 ||
    !uuid.test(lessonId) ||
    !allowedMedia.has(media)
  ) {
    return errorResponse(404, "Not found.");
  }
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return errorResponse(401, "Authentication is required.");
  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl)
    return errorResponse(500, "The portal API is not configured correctly.");

  const upstreamUrl = new URL(
    `/v1/training/catalog/${encodeURIComponent(slug)}/lessons/${lessonId}/${media}`,
    apiBaseUrl,
  );
  if (media === "hls-resource") {
    const resourceToken = request.nextUrl.searchParams.get("token");
    if (!resourceToken || resourceToken.length > 8192) {
      return errorResponse(404, "Not found.");
    }
    upstreamUrl.searchParams.set("token", resourceToken);
  }

  const headers: Record<string, string> = {
    Accept:
      media === "video"
        ? "video/mp4"
        : media === "slides"
          ? "application/pdf"
          : "*/*",
    Authorization: `Bearer ${token}`,
  };
  if (media === "video") {
    const range = request.headers.get("range");
    if (range) headers.Range = range;
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(media === "video" ? 120_000 : 30_000),
    });
  } catch {
    return errorResponse(
      502,
      "The protected training media is temporarily unavailable.",
    );
  }
  if (!upstream.ok || !upstream.body) {
    return errorResponse(
      upstream.status === 404 ? 404 : upstream.status === 416 ? 416 : 502,
      upstream.status === 404
        ? "Not found."
        : "The protected training media could not be loaded.",
    );
  }

  const responseHeaders = new Headers({
    "Content-Type":
      upstream.headers.get("content-type") ?? "application/octet-stream",
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  });
  for (const name of [
    "content-length",
    "content-range",
    "accept-ranges",
    "x-file-sha256",
  ]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
