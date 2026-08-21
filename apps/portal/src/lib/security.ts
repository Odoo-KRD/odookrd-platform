import { NextRequest, NextResponse } from "next/server";

import { ApiRequestError } from "@/lib/api";

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === request.nextUrl.origin;
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
