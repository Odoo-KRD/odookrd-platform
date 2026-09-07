import { proxyAuthenticatedImage } from "@/lib/raw-api-proxy";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string; requestId: string }>;
  },
): Promise<Response> {
  const { id, requestId } = await context.params;

  return proxyAuthenticatedImage(
    `/companies/${encodeURIComponent(id)}/identity-requests/${encodeURIComponent(
      requestId,
    )}/logo`,
  );
}
