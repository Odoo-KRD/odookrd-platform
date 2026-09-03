import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse, isSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return errorResponse(403, "Cross-origin requests are not allowed.");
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return errorResponse(415, "A JSON request body is required.");
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return errorResponse(401, "Authentication is required.");

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > 100_000) {
    return errorResponse(413, "The request body is too large.");
  }

  try {
    const upstream = await fetch(
      new URL("/v1/training/certificate-templates", apiBaseUrl),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
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
  } catch {
    return errorResponse(502, "The API service is temporarily unavailable.");
  }
}
