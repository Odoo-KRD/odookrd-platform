import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const workerRelativePath = [
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.mjs",
] as const;

async function readPdfWorker(): Promise<string> {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, ...workerRelativePath),
    path.join(cwd, "apps", "portal", ...workerRelativePath),
    path.resolve(cwd, "..", "..", ...workerRelativePath),
  ];

  let lastError: unknown = null;

  for (const candidate of [...new Set(candidates)]) {
    try {
      return await readFile(candidate, "utf8");
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error("The PDF.js worker file could not be resolved.", {
    cause: lastError,
  });
}

export async function GET() {
  const worker = await readPdfWorker();

  return new Response(worker, {
    status: 200,
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
