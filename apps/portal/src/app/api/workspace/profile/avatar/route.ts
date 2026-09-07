import { NextRequest, NextResponse } from "next/server";

import { proxyAuthenticatedImage } from "@/lib/raw-api-proxy";
import { getSessionToken } from "@/lib/session";
import { errorResponse, isSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

function upstreamUrl(): URL | null {
  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  return apiBaseUrl
    ? new URL("/v1/workspace/profile/avatar", apiBaseUrl)
    : null;
}

export async function GET(): Promise<Response> {
  return proxyAuthenticatedImage("/workspace/profile/avatar");
}

async function mutation(
  request: NextRequest,
  method: "PUT" | "DELETE",
): Promise<Response> {
  if (!isSameOrigin(request)) {
    return errorResponse(403, "Cross-origin requests are not allowed.");
  }

  const token = await getSessionToken();
  if (!token) {
    return errorResponse(401, "Authentication is required.");
  }

  const url = upstreamUrl();
  if (!url) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  let body: FormData | undefined;

  if (method === "PUT") {
    try {
      body = await request.formData();
    } catch {
      return errorResponse(400, "The avatar upload is invalid.");
    }
  }

  let upstream: Response;

  try {
    upstream = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return errorResponse(502, "The API service is temporarily unavailable.");
  }

  const responseBody = await upstream.text();

  return new NextResponse(responseBody || null, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function PUT(request: NextRequest): Promise<Response> {
  return mutation(request, "PUT");
}

export async function DELETE(request: NextRequest): Promise<Response> {
  return mutation(request, "DELETE");
}
