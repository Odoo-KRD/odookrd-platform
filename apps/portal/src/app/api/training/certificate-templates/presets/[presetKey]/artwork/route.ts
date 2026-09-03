import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse } from "@/lib/security";

const presetPattern = /^style-[1-9][0-9]*$/;

type RouteContext = {
  params: Promise<{ presetKey: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { presetKey } = await context.params;
  if (!presetPattern.test(presetKey)) return errorResponse(404, "Not found.");

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return errorResponse(401, "Authentication is required.");

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  try {
    const upstream = await fetch(
      new URL(
        `/v1/training/certificate-templates/presets/${encodeURIComponent(presetKey)}/artwork`,
        apiBaseUrl,
      ),
      {
        headers: {
          Accept: "image/svg+xml",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!upstream.ok || !upstream.body) {
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

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch {
    return errorResponse(502, "The API service is temporarily unavailable.");
  }
}
