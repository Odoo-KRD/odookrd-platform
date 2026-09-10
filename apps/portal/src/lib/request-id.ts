import { randomUUID } from "node:crypto";
import { cache } from "react";

import { headers } from "next/headers";

/**
 * One identifier per server render, forwarded to the API.
 *
 * `cache` is scoped to a single request in the App Router, so every API call
 * made while rendering a page shares an id. A customer reporting "the services
 * page failed" then maps to one identifier covering the assignment fetch, the
 * features fetch and the subscription lookup together, rather than three
 * unrelated log lines.
 *
 * An inbound x-request-id is honoured when present, so a chain that starts at a
 * load balancer or a browser keeps its identity end to end.
 */
export const getRequestId = cache(async (): Promise<string> => {
  try {
    const inbound = (await headers()).get("x-request-id")?.trim();

    if (inbound) {
      // Bounded: an identifier is for correlation, not for carrying payloads.
      return inbound.slice(0, 200);
    }
  } catch {
    // headers() throws outside a request scope. Falling through to a fresh id
    // keeps this usable from background contexts.
  }

  return randomUUID();
});
