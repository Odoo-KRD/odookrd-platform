import { NextRequest, NextResponse } from "next/server";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { apiErrorResponse, errorResponse, isSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return errorResponse(403, "Cross-origin requests are not allowed.");
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST", token });
    } catch (error: unknown) {
      if (!(error instanceof ApiRequestError) || error.status !== 401) {
        return apiErrorResponse(error);
      }
    }
  }

  const response = new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });

  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}
