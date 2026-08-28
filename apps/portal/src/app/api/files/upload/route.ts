import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse, isSameOrigin } from "@/lib/security";

const allowedKinds = new Set(["IMAGE", "DOCUMENT", "ATTACHMENT"]);
const maximumProxyBytes = 104_857_600;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return errorResponse(403, "Cross-origin requests are not allowed.");
  }

  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return errorResponse(415, "A multipart file upload is required.");
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse(401, "Authentication is required.");
  }

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return errorResponse(400, "Invalid multipart upload.");
  }

  const kind = incoming.get("kind");
  const file = incoming.get("file");
  if (
    typeof kind !== "string" ||
    !allowedKinds.has(kind) ||
    !(file instanceof File) ||
    file.size <= 0 ||
    file.size > maximumProxyBytes
  ) {
    return errorResponse(400, "Invalid file upload.");
  }

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  const payload = new FormData();
  payload.set("kind", kind);
  payload.set("file", file, file.name || "upload");

  let upstream: Response;
  try {
    upstream = await fetch(new URL("/v1/files", apiBaseUrl), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: payload,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
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
