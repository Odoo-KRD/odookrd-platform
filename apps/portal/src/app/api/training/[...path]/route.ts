import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse, isSameOrigin } from "@/lib/security";

const uuid =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const courseSlug = "[a-z0-9]+(?:-[a-z0-9]+)*";
const allowed = [
  new RegExp(`^courses/${uuid}/structure$`),
  new RegExp(`^courses/${uuid}/sections$`),
  new RegExp(`^courses/${uuid}/sections/${uuid}$`),
  new RegExp(`^courses/${uuid}/sections/${uuid}/lessons$`),
  new RegExp(`^courses/${uuid}/sections/${uuid}/lessons/${uuid}$`),
  new RegExp(`^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media$`),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/aws-automated/init$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/aws-automated/complete$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/aws-manual$`,
  ),
  new RegExp(`^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/local$`),
  new RegExp(`^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/slides$`),
  new RegExp(`^courses/${uuid}/sections/${uuid}/lessons/${uuid}/editor$`),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/editor/general$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/editor/content-type$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/editor/content$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/editor/article$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/editor/document$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/editor/review$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/editor/resources$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/editor/resources/reorder$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/editor/resources/${uuid}$`,
  ),

  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/thumbnail$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/aws-automated/retry$`,
  ),
  new RegExp(`^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/video$`),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/enrichment$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/enrichment/captions$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/enrichment/captions/${uuid}$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/enrichment/chapters$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/enrichment/chapters/${uuid}$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/enrichment/preview$`,
  ),
  new RegExp(
    `^courses/${uuid}/sections/${uuid}/lessons/${uuid}/media/enrichment/preview-resource$`,
  ),
  new RegExp(`^progress/continue$`),
  new RegExp(`^progress/courses/${courseSlug}$`),
  new RegExp(`^progress/courses/${courseSlug}/lessons/${uuid}$`),
  new RegExp(`^progress/courses/${courseSlug}/lessons/${uuid}/start$`),
  new RegExp(`^progress/courses/${courseSlug}/lessons/${uuid}/complete$`),
];

export const runtime = "nodejs";

function allowedPath(path: string): boolean {
  return allowed.some((pattern) => pattern.test(path));
}

async function proxy(
  request: NextRequest,
  pathSegments: string[],
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
) {
  const path = pathSegments.join("/");
  if (!allowedPath(path)) {
    return errorResponse(404, "Not found.");
  }

  const localUpload = method === "PUT" && path.endsWith("/media/local");
  const captionUpload =
    method === "POST" && path.endsWith("/media/enrichment/captions");
  const previewGet =
    method === "GET" &&
    (path.endsWith("/media/enrichment/preview") ||
      path.endsWith("/media/enrichment/preview-resource"));

  if (method !== "GET") {
    if (!isSameOrigin(request)) {
      return errorResponse(403, "Cross-origin requests are not allowed.");
    }
    if (localUpload) {
      if (request.headers.get("content-type") !== "video/mp4") {
        return errorResponse(415, "An MP4 request body is required.");
      }
    } else if (captionUpload) {
      if (!request.headers.get("content-type")?.startsWith("text/vtt")) {
        return errorResponse(415, "A WebVTT request body is required.");
      }
    } else if (
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

  let body: string | ReadableStream<Uint8Array> | undefined;
  if (localUpload || captionUpload) {
    body = request.body ?? undefined;
  } else if (method !== "GET" && method !== "DELETE") {
    const jsonBody = await request.text();
    if (Buffer.byteLength(jsonBody, "utf8") > 300_000) {
      return errorResponse(413, "The request body is too large.");
    }
    body = jsonBody;
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (previewGet) {
    const range = request.headers.get("range");
    if (range) headers.Range = range;
  }

  if (localUpload) {
    headers["Content-Type"] = "video/mp4";
    for (const name of [
      "x-odookrd-filename",
      "x-odookrd-size",
      "x-odookrd-duration",
      "x-odookrd-width",
      "x-odookrd-height",
    ]) {
      const value = request.headers.get(name);
      if (value) headers[name] = value;
    }
  } else if (captionUpload) {
    headers["Content-Type"] = "text/vtt; charset=utf-8";
    for (const name of [
      "x-odookrd-filename",
      "x-odookrd-size",
      "x-odookrd-caption-language",
      "x-odookrd-caption-label",
      "x-odookrd-caption-default",
    ]) {
      const value = request.headers.get(name);
      if (value) headers[name] = value;
    }
  } else if (method !== "GET" && method !== "DELETE") {
    headers["Content-Type"] = "application/json";
  }

  let upstream: Response;
  try {
    const init: RequestInit & { duplex?: "half" } = {
      method,
      headers,
      ...(body === undefined ? {} : { body }),
      ...(localUpload || captionUpload ? { duplex: "half" } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(
        localUpload
          ? 1_800_000
          : captionUpload || previewGet
            ? 120_000
            : 15_000,
      ),
    };
    const upstreamUrl = new URL(`/v1/training/${path}`, apiBaseUrl);
    if (previewGet) {
      request.nextUrl.searchParams.forEach((value, key) => {
        upstreamUrl.searchParams.set(key, value);
      });
    }
    upstream = await fetch(upstreamUrl, init);
  } catch {
    return errorResponse(502, "The API service is temporarily unavailable.");
  }

  if (previewGet && upstream.body) {
    const responseHeaders = new Headers({
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
    });
    for (const name of ["content-length", "content-range", "accept-ranges"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
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
  const joined = path.join("/");
  const editorGet =
    joined.endsWith("/editor") || joined.endsWith("/editor/review");
  if (
    !joined.endsWith("/structure") &&
    !joined.endsWith("/media") &&
    !joined.endsWith("/media/enrichment") &&
    !joined.endsWith("/media/enrichment/preview") &&
    !joined.endsWith("/media/enrichment/preview-resource") &&
    !joined.startsWith("progress/") &&
    !editorGet
  ) {
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

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path, "PUT");
}
