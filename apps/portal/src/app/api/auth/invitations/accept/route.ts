import { NextRequest, NextResponse } from "next/server";

import { apiRequest } from "@/lib/api";
import { apiErrorResponse, errorResponse, isSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return errorResponse(403, "Cross-origin requests are not allowed.");
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return errorResponse(415, "A JSON request body is required.");
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
    !("token" in body) ||
    !("password" in body) ||
    typeof body.token !== "string" ||
    typeof body.password !== "string" ||
    body.token.length < 20 ||
    body.token.length > 512 ||
    body.password.length < 1 ||
    body.password.length > 128
  ) {
    return errorResponse(400, "The invitation request is invalid.");
  }

  try {
    await apiRequest<unknown>("/auth/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token: body.token, password: body.password }),
    });

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
