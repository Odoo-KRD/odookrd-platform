import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

export const runtime = "nodejs";

export async function GET() {
  const require = createRequire(import.meta.url);
  const workerPath = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
  const worker = await readFile(workerPath);
  return new Response(worker, {
    status: 200,
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
