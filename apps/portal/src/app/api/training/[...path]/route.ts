import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse, isSameOrigin } from "@/lib/security";

const uuid =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const allowed = [
  new RegExp(`^courses/${uuid}/structure$`),
  new RegExp(`^courses/${uuid}/sections$`),
  new RegExp(`^courses/${uuid}/sections/${uuid}$`),
  new RegExp(`^courses/${uuid}/sections/${uuid}/lessons$`),
  new RegExp(`^courses/${uuid}/sections/${uuid}/lessons/${uuid}$`),
];

export const runtime = "nodejs";

function allowedPath(path: string): boolean {
  return allowed.some((pattern) => pattern.test(path));
}

async function proxy(
  request: NextRequest,
  pathSegments: string[],
  method: "GET" | "POST" | "PATCH" | "DELETE",
) {
  const path = pathSegments.join("/");
  if (!allowedPath(path)) {
    return errorResponse(404, "Not found.");
  }

  if (method !== "GET") {
    if (!isSameOrigin(request)) {
      return errorResponse(403, "Cross-origin requests are not allowed.");
    }
    if (
      method !== "DELETE" &&
      !request.headers.get("content-type")?.startsWith("application/json")
    ) {
      return errorResponse(415, "A JSON request body is required.");
    }
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse(401, "Authentication is required.");
  }

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  let body: string | undefined;
  if (method !== "GET" && method !== "DELETE") {
    body = await request.text();
    if (Buffer.byteLength(body, "utf8") > 300_000) {
      return errorResponse(413, "The request body is too large.");
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(new URL(`/v1/training/${path}`, apiBaseUrl), {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(method === "GET" || method === "DELETE"
          ? {}
          : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return errorResponse(502, "The API service is temporarily unavailable.");
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ??
        "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  if (!path.join("/").endsWith("/structure")) {
    return errorResponse(405, "Method not allowed.");
  }
  return proxy(request, path, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path, "POST");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path, "PATCH");
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path, "DELETE");
}
