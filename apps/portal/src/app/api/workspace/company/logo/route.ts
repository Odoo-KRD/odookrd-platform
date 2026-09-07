import { proxyAuthenticatedImage } from "@/lib/raw-api-proxy";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return proxyAuthenticatedImage("/workspace/company/logo");
}
