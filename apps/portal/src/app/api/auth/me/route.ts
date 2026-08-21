import type { CurrentSession } from "@odookrd/types";
import { NextRequest, NextResponse } from "next/server";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { apiErrorResponse, errorResponse } from "@/lib/security";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return errorResponse(401, "Authentication required.");
  }

  try {
    const session = await apiRequest<CurrentSession>("/auth/me", { token });

    return NextResponse.json(session, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    const response = apiErrorResponse(error);

    if (error instanceof ApiRequestError && error.status === 401) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }

    return response;
  }
}
