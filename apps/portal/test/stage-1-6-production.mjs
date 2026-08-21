import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const portalRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to allocate a smoke-test port."));
        return;
      }

      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function stopServer(server) {
  if (server.exitCode !== null || server.signalCode !== null) {
    return;
  }

  server.kill("SIGTERM");

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (server.exitCode !== null || server.signalCode !== null) {
      return;
    }

    await delay(100);
  }

  server.kill("SIGKILL");
}

async function waitUntilReady(baseUrl, server, logs) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(
        `Portal exited before becoming ready.\n${logs.join("").slice(-4000)}`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/login`);

      if (response.ok) {
        return;
      }
    } catch {
      // The production server is still starting.
    }

    await delay(250);
  }

  throw new Error(`Portal did not become ready.\n${logs.join("").slice(-4000)}`);
}

async function check(name, callback) {
  await callback();
  process.stdout.write(`✓ ${name}\n`);
}

const port = await freePort();
const baseUrl = `http://localhost:${port}`;
const nextBinary = path.join(portalRoot, "node_modules/next/dist/bin/next");
const logs = [];
const server = spawn(
  process.execPath,
  [nextBinary, "start", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    cwd: portalRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

server.stdout.on("data", (chunk) => logs.push(chunk.toString()));
server.stderr.on("data", (chunk) => logs.push(chunk.toString()));

try {
  await waitUntilReady(baseUrl, server, logs);

  await check("default Kurdish page renders RTL with security headers", async () => {
    const response = await fetch(`${baseUrl}/login`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<html[^>]+lang=["']ku["'][^>]+dir=["']rtl["']/);
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(
      response.headers.get("referrer-policy"),
      "strict-origin-when-cross-origin",
    );
  });

  await check("Arabic stays RTL and English switches to LTR", async () => {
    for (const [locale, direction] of [
      ["ar", "rtl"],
      ["en", "ltr"],
    ]) {
      const response = await fetch(`${baseUrl}/login`, {
        headers: { Cookie: `odookrd_locale=${locale}` },
      });
      const html = await response.text();

      assert.equal(response.status, 200);
      assert.match(html, new RegExp(`<html[^>]+lang=["']${locale}["'][^>]+dir=["']${direction}["']`));
    }
  });

  await check("unauthenticated administration redirects to login", async () => {
    const response = await fetch(`${baseUrl}/admin/users`, {
      redirect: "manual",
    });
    const location = response.headers.get("location");

    assert.ok([307, 308].includes(response.status));
    assert.ok(location);

    const redirectUrl = new URL(location, baseUrl);
    assert.equal(redirectUrl.pathname, "/login");
    assert.equal(redirectUrl.searchParams.get("next"), "/admin/users");
  });

  await check("cross-origin authentication and invitation posts are rejected", async () => {
    for (const endpoint of [
      "/api/auth/login",
      "/api/auth/invitations/accept",
      "/api/auth/logout",
      "/api/auth/logout-all",
      "/api/locale",
    ]) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://attacker.invalid",
        },
        body: "{}",
      });

      assert.equal(response.status, 403, endpoint);
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
  });

  await check("same-origin malformed credentials fail before reaching NestJS", async () => {
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
      body: "{}",
    });
    const invitation = await fetch(`${baseUrl}/api/auth/invitations/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
      body: JSON.stringify({ token: "short", password: "short" }),
    });

    assert.equal(login.status, 400);
    assert.equal(invitation.status, 400);
    assert.equal(login.headers.get("set-cookie"), null);
  });

  await check("locale cookie is hardened in production", async () => {
    const response = await fetch(`${baseUrl}/api/locale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
      body: JSON.stringify({ locale: "en" }),
    });
    const cookie = response.headers.get("set-cookie") ?? "";

    assert.equal(response.status, 200);
    assert.match(cookie, /^odookrd_locale=en;/i);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /Secure/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.match(cookie, /Path=\//i);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  await check("public invitation acceptance page renders", async () => {
    const response = await fetch(`${baseUrl}/invitation/accept`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /name=["']password["']/);
    assert.match(html, /autocomplete=["']new-password["']/i);
  });
} finally {
  await stopServer(server);
}

process.stdout.write("Stage 1.6 production smoke checks passed.\n");
