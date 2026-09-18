import { getSessionToken } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Client-side proxy for the live search dropdown. The session token is
 * http-only, so the browser cannot call the API directly.
 */
export async function GET(request: Request): Promise<Response> {
  const token = await getSessionToken();

  if (!token) {
    return Response.json({ items: [] }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return Response.json({ items: [] });
  }

  const apiBaseUrl = process.env.ODOOKRD_API_URL;

  if (!apiBaseUrl) {
    return Response.json({ items: [] }, { status: 500 });
  }

  const url = new URL("/v1/knowledge/search", apiBaseUrl);
  url.searchParams.set("q", query.slice(0, 250));
  url.searchParams.set("limit", "8");

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Accept-Language":
          request.headers.get("accept-language") ?? "ku",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return Response.json({ items: [] }, { status: upstream.status });
    }

    return Response.json(await upstream.json());
  } catch {
    return Response.json({ items: [] }, { status: 503 });
  }
}
