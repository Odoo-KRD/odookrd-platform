import type { ApiLoginResponse } from "@odookrd/types";
import { NextRequest, NextResponse } from "next/server";

import { apiRequest } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
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
    !("email" in body) ||
    !("password" in body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    body.email.length > 320 ||
    body.password.length > 128 ||
    ("rememberMe" in body && typeof body.rememberMe !== "boolean")
  ) {
    return errorResponse(400, "Valid login credentials are required.");
  }

  const rememberMe =
    "rememberMe" in body && typeof body.rememberMe === "boolean"
      ? body.rememberMe
      : false;

  try {
    const result = await apiRequest<ApiLoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        rememberMe,
      }),
    });

    const expires = new Date(result.session.absoluteExpiresAt);

    if (Number.isNaN(expires.getTime())) {
      return errorResponse(502, "The API returned an invalid session.");
    }

    const response = NextResponse.json(
      { user: result.user },
      { headers: { "Cache-Control": "no-store" } },
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(rememberMe ? { expires } : {}),
      priority: "high",
    });

    return response;
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
