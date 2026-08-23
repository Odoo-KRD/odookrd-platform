import type {
  UpdateUserUiPreferencesRequest,
  UserUiPreferences,
} from "@odookrd/types";
import { NextRequest, NextResponse } from "next/server";

import { apiRequest } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { apiErrorResponse, errorResponse, isSameOrigin } from "@/lib/security";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return errorResponse(403, "Cross-origin requests are not allowed.");
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return errorResponse(415, "A JSON request body is required.");
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return errorResponse(401, "Authentication is required.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "The request body is invalid.");
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("sidebarCollapsed" in body) ||
    typeof body.sidebarCollapsed !== "boolean" ||
    Object.keys(body).some((key) => key !== "sidebarCollapsed")
  ) {
    return errorResponse(400, "The request body is invalid.");
  }

  const payload: UpdateUserUiPreferencesRequest = {
    sidebarCollapsed: body.sidebarCollapsed,
  };

  try {
    const preferences = await apiRequest<UserUiPreferences>("/me/preferences", {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });

    return NextResponse.json(preferences, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
