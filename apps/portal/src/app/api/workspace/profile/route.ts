import type { CustomerAccountProfile } from "@odookrd/types";
import { NextRequest, NextResponse } from "next/server";

import { apiRequest, ApiRequestError } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse } from "@/lib/security";

export const runtime = "nodejs";

function tokenFrom(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function GET(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token) return errorResponse(401, "Authentication is required.");

  try {
    const profile = await apiRequest<CustomerAccountProfile>(
      "/workspace/profile",
      { token },
    );
    return NextResponse.json(profile, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return errorResponse(error.status, error.message);
    }
    return errorResponse(502, "The account profile could not be loaded.");
  }
}

export async function PATCH(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token) return errorResponse(401, "Authentication is required.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "The profile request is invalid.");
  }

  try {
    const profile = await apiRequest<CustomerAccountProfile>(
      "/workspace/profile",
      {
        token,
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );
    return NextResponse.json(profile, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return errorResponse(error.status, error.message);
    }
    return errorResponse(502, "The account profile could not be updated.");
  }
}
