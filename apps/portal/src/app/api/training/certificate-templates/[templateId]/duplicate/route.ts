import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse, isSameOrigin } from "@/lib/security";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ templateId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return errorResponse(403, "Cross-origin requests are not allowed.");
  }

  const { templateId } = await context.params;
  if (!uuidPattern.test(templateId)) return errorResponse(404, "Not found.");

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return errorResponse(401, "Authentication is required.");

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  try {
    const upstream = await fetch(
      new URL(
        `/v1/training/certificate-templates/${encodeURIComponent(templateId)}/duplicate`,
        apiBaseUrl,
      ),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
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
