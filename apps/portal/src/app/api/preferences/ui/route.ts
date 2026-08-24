import type {
  DashboardSectionKey,
  DashboardUiPreferences,
  UpdateUserUiPreferencesRequest,
  UserUiPreferences,
} from "@odookrd/types";
import { NextRequest, NextResponse } from "next/server";

import { apiRequest } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { apiErrorResponse, errorResponse, isSameOrigin } from "@/lib/security";

const dashboardSectionKeys = new Set<DashboardSectionKey>([
  "companies",
  "users",
  "roles",
  "services",
  "notifications",
  "settings",
]);

function validSectionList(value: unknown): value is DashboardSectionKey[] {
  return (
    Array.isArray(value) &&
    value.length <= dashboardSectionKeys.size &&
    value.every(
      (item) =>
        typeof item === "string" &&
        dashboardSectionKeys.has(item as DashboardSectionKey),
    ) &&
    new Set(value).size === value.length
  );
}

function parseDashboardPreferences(
  value: unknown,
): DashboardUiPreferences | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).some(
      (key) => !["order", "hidden", "collapsed"].includes(key),
    ) ||
    !("order" in value) ||
    !("hidden" in value) ||
    !("collapsed" in value) ||
    !validSectionList(value.order) ||
    !validSectionList(value.hidden) ||
    !validSectionList(value.collapsed)
  ) {
    return null;
  }

  return {
    order: value.order,
    hidden: value.hidden,
    collapsed: value.collapsed,
  };
}

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
    Array.isArray(body) ||
    Object.keys(body).length === 0 ||
    Object.keys(body).some(
      (key) => !["sidebarCollapsed", "dashboardPreferences"].includes(key),
    )
  ) {
    return errorResponse(400, "The request body is invalid.");
  }

  const payload: UpdateUserUiPreferencesRequest = {};

  if ("sidebarCollapsed" in body) {
    if (typeof body.sidebarCollapsed !== "boolean") {
      return errorResponse(400, "The request body is invalid.");
    }

    payload.sidebarCollapsed = body.sidebarCollapsed;
  }

  if ("dashboardPreferences" in body) {
    const preferences = parseDashboardPreferences(body.dashboardPreferences);

    if (!preferences) {
      return errorResponse(400, "The request body is invalid.");
    }

    payload.dashboardPreferences = preferences;
  }

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
