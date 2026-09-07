import { getSessionToken } from "@/lib/session";

function apiUrl(path: string): URL | null {
  const apiBaseUrl = process.env.ODOOKRD_API_URL;
  if (!apiBaseUrl || !path.startsWith("/")) {
    return null;
  }

  return new URL(`/v1${path}`, apiBaseUrl);
}

export async function proxyAuthenticatedImage(
  path: string,
): Promise<Response> {
  const token = await getSessionToken();
  if (!token) {
    return new Response("Authentication is required.", { status: 401 });
  }

  const url = apiUrl(path);
  if (!url) {
    return new Response("The portal API is not configured correctly.", {
      status: 500,
    });
  }

  let upstream: Response;

  try {
    upstream = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "image/jpeg,image/png,image/webp,image/*;q=0.8",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return new Response("The API service is temporarily unavailable.", {
      status: 502,
    });
  }

  if (!upstream.ok) {
    return new Response("The requested image is unavailable.", {
      status: upstream.status,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return new Response("The API returned an invalid image response.", {
      status: 502,
    });
  }

  const buffer = await upstream.arrayBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
