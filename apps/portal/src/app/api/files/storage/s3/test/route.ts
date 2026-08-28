import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { apiErrorResponse, errorResponse, isSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return errorResponse(403, "Cross-origin requests are not allowed.");
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse(401, "Authentication is required.");
  }

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  try {
    const response = await fetch(
      new URL("/v1/files/storage/s3/test", apiBaseUrl),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );

    const body = (await response.json()) as unknown;
    if (!response.ok) {
      const message =
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
          ? body.message
          : "AWS S3 connection test failed.";
      return errorResponse(response.status, message);
    }

    if (typeof body !== "object" || body === null) {
      return errorResponse(502, "AWS S3 returned an invalid response.");
    }

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
