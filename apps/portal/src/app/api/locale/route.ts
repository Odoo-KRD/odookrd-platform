import { NextRequest, NextResponse } from "next/server";

import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from "@/lib/constants";
import { isSupportedLocale } from "@/lib/i18n/config";
import { errorResponse, isSameOrigin } from "@/lib/security";

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
    !("locale" in body) ||
    !isSupportedLocale(body.locale)
  ) {
    return errorResponse(400, "The selected language is not supported.");
  }

  const response = NextResponse.json(
    { locale: body.locale },
    { headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set({
    name: LOCALE_COOKIE_NAME,
    value: body.locale,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });

  return response;
}
