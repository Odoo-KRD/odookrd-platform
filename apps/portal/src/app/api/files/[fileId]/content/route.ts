import { createHash } from "node:crypto";

import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { errorResponse } from "@/lib/security";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return errorResponse(401, "Authentication is required.");
  if (!uuidPattern.test(fileId)) {
    return errorResponse(400, "Invalid file identifier.");
  }

  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl) {
    return errorResponse(500, "The portal API is not configured correctly.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      new URL(`/v1/files/${encodeURIComponent(fileId)}/content`, apiBaseUrl),
      {
        headers: {
          Accept: request.headers.get("accept") ?? "*/*",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );
  } catch {
    return errorResponse(502, "The API service is temporarily unavailable.");
  }

  if (!upstream.ok) {
    let message = "The file could not be loaded.";
    try {
      const body = (await upstream.json()) as { message?: unknown };
      if (typeof body.message === "string") message = body.message;
    } catch {}
    return errorResponse(upstream.status, message);
  }

  let body: ArrayBuffer;
  try {
    body = await upstream.arrayBuffer();
  } catch {
    return errorResponse(502, "The file response could not be read.");
  }

  if (body.byteLength <= 0) {
    return errorResponse(502, "The file response was empty.");
  }

  const bytes = new Uint8Array(body);
  const upstreamLength = upstream.headers.get("content-length");
  if (upstreamLength && Number(upstreamLength) !== bytes.byteLength) {
    return errorResponse(502, "The file response was incomplete.");
  }

  const expectedSha256 = upstream.headers.get("x-file-sha256");
  if (expectedSha256) {
    const actualSha256 = createHash("sha256").update(bytes).digest("hex");
    if (actualSha256 !== expectedSha256) {
      return errorResponse(
        502,
        "The file response failed its integrity check.",
      );
    }
  }

  const headers = new Headers();
  for (const name of [
    "content-type",
    "content-disposition",
    "content-security-policy",
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  headers.set("Content-Length", String(bytes.byteLength));
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("X-Content-Type-Options", "nosniff");
  if (expectedSha256) headers.set("X-File-SHA256", expectedSha256);

  return new Response(bytes, { status: 200, headers });
}
