import { NextRequest, NextResponse } from "next/server";

import { ApiRequestError } from "@/lib/api";

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return false;
  }

  try {
    const protocol =
      request.headers
        .get("x-forwarded-proto")
        ?.split(",")[0]
        ?.trim()
        .toLowerCase() ?? request.nextUrl.protocol.replace(":", "");

    if (protocol !== "http" && protocol !== "https") {
      return false;
    }

    const expectedOrigin = new URL(`${protocol}://${host}`).origin;

    return new URL(origin).origin === expectedOrigin;
  } catch {
    return false;
  }
}

export function errorResponse(
  status: number,
  message: string,
): NextResponse {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiRequestError) {
    return errorResponse(error.status, error.message);
  }

  return errorResponse(502, "The service is temporarily unavailable.");
}
