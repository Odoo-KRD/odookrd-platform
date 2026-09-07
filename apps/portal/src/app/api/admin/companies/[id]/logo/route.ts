import { proxyAuthenticatedImage } from "@/lib/raw-api-proxy";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return proxyAuthenticatedImage(
    `/companies/${encodeURIComponent(id)}/logo`,
  );
}
