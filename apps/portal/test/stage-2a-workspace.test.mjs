import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const portalRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const projectRoot = path.resolve(portalRoot, "../..");

async function portalSource(relativePath) {
  return readFile(path.join(portalRoot, relativePath), "utf8");
}

test("authenticated accounts are routed into their own scoped workspace", async () => {
  const [authorization, homePage, loginPage] = await Promise.all([
    portalSource("src/lib/authorization.ts"),
    portalSource("src/app/page.tsx"),
    portalSource("src/app/(public)/login/page.tsx"),
  ]);

  assert.match(
    authorization,
    /session\.user\.accountScope\s*===\s*["']PLATFORM["']\s*\?\s*["']\/admin["']\s*:\s*["']\/dashboard["']/,
  );
  assert.match(homePage, /redirect\(getDefaultAuthenticatedPath\(session\)\)/);
  assert.match(loginPage, /value\s*===\s*["']\/dashboard["']/);
  assert.match(loginPage, /value\.startsWith\(["']\/dashboard\/["']\)/);
  assert.match(loginPage, /:\s*["']\/["']/);
});

test("customer routes require authentication and reject platform-only access", async () => {
  const [proxy, customerLayout, adminLayout, dashboard] = await Promise.all([
    portalSource("src/proxy.ts"),
    portalSource("src/app/(protected)/(customer)/layout.tsx"),
    portalSource("src/app/(protected)/admin/layout.tsx"),
    portalSource("src/app/(protected)/(customer)/dashboard/page.tsx"),
  ]);

  assert.match(proxy, /["']\/dashboard\/:path\*["']/);
  assert.match(proxy, /request\.cookies\.has\(SESSION_COOKIE_NAME\)/);
  assert.match(customerLayout, /requireSession\(\)/);
  assert.match(
    customerLayout,
    /session\.user\.accountScope\s*!==\s*["']COMPANY["']/,
  );
  assert.match(customerLayout, /redirect\(["']\/admin["']\)/);
  assert.match(customerLayout, /if\s*\(hasAdminAccess\(session\)\)/);
  assert.match(adminLayout, /redirect\(["']\/dashboard["']\)/);
  assert.match(dashboard, /hasAdminAccess\(session\)/);
});

test("reverse-proxy origin validation preserves HTTPS and strict host matching", async () => {
  const security = await portalSource("src/lib/security.ts");

  assert.match(security, /\.get\(["']origin["']\)/);
  assert.match(security, /\.get\(["']host["']\)/);
  assert.match(security, /\.get\(["']x-forwarded-proto["']\)/);
  assert.match(security, /new URL\(origin\)\.origin\s*===\s*expectedOrigin/);
});

test("customer workspace remains translated in Kurdish, Arabic, and English", async () => {
  const adapter = await portalSource("src/lib/i18n/portal.ts");

  for (const locale of ["ku", "ar", "en"]) {
    const dictionary = await portalSource(
      "src/lib/i18n/frontend/" + locale + ".ts",
    );

    assert.match(
      adapter,
      new RegExp("\\b" + locale + ":\\s*frontendTranslations\\."),
    );
    assert.match(dictionary, /portal:\s*\{/);
    assert.match(dictionary, /companyAdministrator:/);
    assert.match(dictionary, /companyUser:/);
  }
});

test("systemd services use production processes and start automatically", async () => {
  const [apiService, portalService, apiMain] = await Promise.all([
    readFile(
      path.join(projectRoot, "deploy/systemd/odookrd-api.service"),
      "utf8",
    ),
    readFile(
      path.join(projectRoot, "deploy/systemd/odookrd-portal.service"),
      "utf8",
    ),
    readFile(path.join(projectRoot, "apps/api/src/main.ts"), "utf8"),
  ]);

  assert.match(apiMain, /app\.listen\(\s*port\s*,\s*["']0\.0\.0\.0["']\s*\)/);

  for (const unit of [apiService, portalService]) {
    assert.match(unit, /^User=.+$/m);
    assert.match(unit, /^Environment=NODE_ENV=production$/m);
    assert.match(unit, /^Restart=on-failure$/m);
    assert.match(unit, /^WantedBy=multi-user\.target$/m);
    assert.match(unit, /^NoNewPrivileges=true$/m);
  }

  assert.match(apiService, /^ExecStart=.+\/dist\/src\/main\.js$/m);
  assert.match(
    portalService,
    /^ExecStart=.+\/next\/dist\/bin\/next start --hostname 0\.0\.0\.0 --port \d+$/m,
  );
  assert.doesNotMatch(portalService, /\bnext dev\b/);
});
