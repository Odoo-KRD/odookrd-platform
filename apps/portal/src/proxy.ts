import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";

export function proxy(request: NextRequest): NextResponse {
  if (request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);

  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/services/:path*",
    "/company/:path*",
    "/profile/:path*",
    "/notifications/:path*",
  ],
};
