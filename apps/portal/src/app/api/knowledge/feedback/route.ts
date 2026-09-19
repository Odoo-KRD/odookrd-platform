import { getSessionToken } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Proxy for the feedback widget. The session token is http-only, so the browser
 * cannot post to the API directly.
 */
export async function POST(request: Request): Promise<Response> {
  const token = await getSessionToken();

  if (!token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiBaseUrl = process.env.ODOOKRD_API_URL;

  if (!apiBaseUrl) {
    return Response.json({ error: "unavailable" }, { status: 500 });
  }

  let payload: { slug?: unknown; helpful?: unknown; comment?: unknown };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const slug = typeof payload.slug === "string" ? payload.slug : null;

  if (!slug || typeof payload.helpful !== "boolean") {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const url = new URL(
    `/v1/knowledge/articles/${encodeURIComponent(slug)}/feedback`,
    apiBaseUrl,
  );

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        helpful: payload.helpful,
        ...(typeof payload.comment === "string" && payload.comment.trim()
          ? { comment: payload.comment.trim().slice(0, 2000) }
          : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return Response.json({ error: "upstream" }, { status: upstream.status });
    }

    return Response.json(await upstream.json());
  } catch {
    return Response.json({ error: "unreachable" }, { status: 503 });
  }
}
