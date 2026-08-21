import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const portalRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

async function source(relativePath) {
  return readFile(path.join(portalRoot, relativePath), "utf8");
}

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await filesBelow(absolutePath)));
    } else {
      files.push(absolutePath);
    }
  }

  return files;
}

test("session credentials remain in the server-only HttpOnly cookie", async () => {
  const [loginRoute, apiClient] = await Promise.all([
    source("src/app/api/auth/login/route.ts"),
    source("src/lib/api.ts"),
  ]);

  assert.match(loginRoute, /response\.cookies\.set\(\{/);
  assert.match(loginRoute, /httpOnly:\s*true/);
  assert.match(loginRoute, /secure:\s*process\.env\.NODE_ENV\s*===\s*["']production["']/);
  assert.match(loginRoute, /sameSite:\s*["']lax["']/);
  assert.match(loginRoute, /priority:\s*["']high["']/);
  assert.match(loginRoute, /NextResponse\.json\(\s*\{\s*user:\s*result\.user\s*\}/s);
  assert.match(apiClient, /headers\.set\(["']Authorization["'],\s*`Bearer \$\{token\}`\)/);

  const clientFiles = (await filesBelow(path.join(portalRoot, "src"))).filter(
    (file) => /\.(?:ts|tsx)$/.test(file),
  );
  const clientSources = [];

  for (const file of clientFiles) {
    const content = await readFile(file, "utf8");

    if (/^["']use client["'];/m.test(content)) {
      clientSources.push(content);
    }
  }

  const browserCode = clientSources.join("\n");

  assert.doesNotMatch(browserCode, /localStorage|sessionStorage/);
  assert.doesNotMatch(browserCode, /Authorization\s*:/i);
  assert.doesNotMatch(browserCode, /Bearer\s+/i);
});

test("every state-changing public BFF endpoint rejects cross-origin requests", async () => {
  const routes = [
    "src/app/api/auth/login/route.ts",
    "src/app/api/auth/logout/route.ts",
    "src/app/api/auth/logout-all/route.ts",
    "src/app/api/auth/invitations/accept/route.ts",
    "src/app/api/locale/route.ts",
  ];

  for (const route of routes) {
    const content = await source(route);
    const originGuard = content.indexOf("if (!isSameOrigin(request))");

    assert.notEqual(originGuard, -1, `${route} must enforce same-origin requests`);

    const firstMutation = [
      content.indexOf("apiRequest<"),
      content.indexOf("response.cookies.set"),
      content.indexOf("response.cookies.delete"),
    ].filter((position) => position >= 0);

    if (firstMutation.length > 0) {
      assert.ok(
        originGuard < Math.min(...firstMutation),
        `${route} must check origin before changing state`,
      );
    }
  }
});

test("invitation secrets use the URL fragment and are cleared after acceptance", async () => {
  const [inviteForm, acceptanceForm] = await Promise.all([
    source("src/components/users/invite-user-form.tsx"),
    source("src/components/invitations/accept-invitation-form.tsx"),
  ]);

  assert.match(inviteForm, /\/invitation\/accept#/);
  assert.doesNotMatch(inviteForm, /\/invitation\/accept\?[^"'`]*token/);
  assert.match(acceptanceForm, /window\.location\.hash\.slice\(1\)/);
  assert.match(
    acceptanceForm,
    /window\.history\.replaceState\(\{\},\s*["']{2},\s*["']\/invitation\/accept["']\)/,
  );
});

test("redirects, permissions, and company scope remain server constrained", async () => {
  const [loginPage, authorization, adminLayout, userActions, companyActions] =
    await Promise.all([
      source("src/app/(public)/login/page.tsx"),
      source("src/lib/authorization.ts"),
      source("src/app/(protected)/admin/layout.tsx"),
      source("src/app/(protected)/admin/users/actions.ts"),
      source("src/app/(protected)/admin/companies/actions.ts"),
    ]);

  assert.match(loginPage, /value\s*===\s*["']\/admin["']/);
  assert.match(loginPage, /value\.startsWith\(["']\/admin\/["']\)/);
  assert.match(loginPage, /:\s*["']\/admin["']/);
  assert.match(authorization, /requireSession\(\)/);
  assert.match(authorization, /session\.authorization\.permissions\.includes\(permission\)/);
  assert.match(adminLayout, /if\s*\(!hasAdminAccess\(session\)\)/);
  assert.match(adminLayout, /<CustomerWorkspace/);
  assert.match(userActions, /getAdminApiContext\(PERMISSIONS\.USERS_MANAGE\)/);
  assert.match(userActions, /session\.user\.accountScope\s*===\s*["']COMPANY["']/);
  assert.match(userActions, /selectedCompanyId\s*!==\s*session\.user\.companyId/);
  assert.match(companyActions, /getAdminApiContext\(PERMISSIONS\.COMPANIES_MANAGE\)/);
});

test("Kurdish default, Arabic RTL, and English LTR contracts remain intact", async () => {
  const [config, layout, dictionaries, usersDictionaries] = await Promise.all([
    source("src/lib/i18n/config.ts"),
    source("src/app/layout.tsx"),
    source("src/lib/i18n/dictionaries.ts"),
    source("src/lib/i18n/users.ts"),
  ]);

  assert.match(config, /DEFAULT_LOCALE:\s*Locale\s*=\s*["']ku["']/);
  assert.match(config, /SUPPORTED_LOCALES\s*=\s*\[["']ku["'],\s*["']ar["'],\s*["']en["']\]/);
  assert.match(config, /locale\s*===\s*["']en["']\s*\?\s*["']ltr["']\s*:\s*["']rtl["']/);
  assert.match(layout, /<html\s+lang=\{locale\}\s+dir=\{getTextDirection\(locale\)\}/);

  for (const locale of ["ku", "ar", "en"]) {
    assert.match(dictionaries, new RegExp(`\\n\\s*${locale}:\\s*\\{`));
    assert.match(usersDictionaries, new RegExp(`\\n\\s*${locale}:\\s*\\{`));
  }
});

test("baseline browser hardening headers remain configured", async () => {
  const nextConfig = await source("next.config.ts");

  assert.match(nextConfig, /poweredByHeader:\s*false/);
  assert.match(nextConfig, /Referrer-Policy["'],\s*value:\s*["']strict-origin-when-cross-origin/);
  assert.match(nextConfig, /X-Content-Type-Options["'],\s*value:\s*["']nosniff/);
  assert.match(nextConfig, /X-Frame-Options["'],\s*value:\s*["']DENY/);
  assert.match(nextConfig, /Permissions-Policy/);
});
