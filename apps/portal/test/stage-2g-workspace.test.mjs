import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const portalRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function source(relativePath) {
  return readFile(path.join(portalRoot, relativePath), "utf8");
}

test("dashboard and account routes use authenticated, company-scoped API requests", async () => {
  const files = await Promise.all([
    source("src/app/(protected)/(customer)/dashboard/page.tsx"),
    source("src/app/(protected)/(customer)/dashboard/company/page.tsx"),
    source("src/app/(protected)/(customer)/dashboard/profile/page.tsx"),
  ]);

  for (const file of files) {
    assert.match(file, /getCustomerApiContext\(PERMISSIONS\./u);
    assert.doesNotMatch(file, /searchParams\.companyId|params\.companyId/u);
  }

  assert.match(files[0], /["']\/workspace\/overview["']/u);
  assert.match(files[1], /company\.id !== companyId/u);
  assert.match(files[2], /profile\.id !== session\.user\.id/u);
  assert.match(files[2], /profile\.companyId !== session\.user\.companyId/u);
});

test("company profile edits require management permission and never trust form company IDs", async () => {
  const [action, companyPage] = await Promise.all([
    source("src/app/(protected)/(customer)/dashboard/company/actions.ts"),
    source("src/app/(protected)/(customer)/dashboard/company/page.tsx"),
  ]);

  assert.match(action, /^["']use server["'];/u);
  assert.match(
    action,
    /getCustomerApiContext\(\s*PERMISSIONS\.COMPANIES_MANAGE/u,
  );
  assert.match(action, /const companyId = session\.user\.companyId/u);
  assert.match(action, /localizedFormValues\(formData, ["']name["'], 200\)/u);
  assert.doesNotMatch(action, /formData\.get\(["']companyId["']\)/u);
  assert.match(
    companyPage,
    /hasPermission\(session, PERMISSIONS\.COMPANIES_MANAGE\)/u,
  );
});

test("customer company editing reuses the existing Odoo-style translation popup", async () => {
  const form = await source("src/components/customer/company-profile-form.tsx");

  assert.match(form, /LocalizedTextField/u);
  assert.match(form, /field=["']name["']/u);
  assert.match(form, /content=\{content\}/u);
  assert.match(form, /translations=\{initialTranslations\}/u);
  assert.doesNotMatch(form, /<dialog|role=["']dialog["']/u);
});

test("customer navigation exposes dashboard, company, and personal profile", async () => {
  const layout = await source("src/app/(protected)/(customer)/layout.tsx");

  assert.match(layout, /href: ["']\/dashboard["']/u);
  assert.match(layout, /href: ["']\/dashboard\/company["']/u);
  assert.match(layout, /href: ["']\/dashboard\/profile["']/u);
  assert.match(layout, /if \(hasAdminAccess\(session\)\)/u);
});

test("all customer dashboards, company profiles, and translation popups are localized", async () => {
  for (const locale of ["ku", "ar", "en"]) {
    const text = await source(`src/lib/i18n/frontend/${locale}.ts`);
    const javascript = stripTypeScriptTypes(text, { mode: "strip" });
    const loaded = await import(
      `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
    );
    const suffix = locale[0].toUpperCase() + locale.slice(1);
    const dictionary = loaded[`frontend${suffix}`];

    assert.equal(dictionary.content.locale, locale);
    assert.ok(dictionary.workspace.dashboard.recentActivity.trim());
    assert.ok(dictionary.workspace.company.editTitle.trim());
    assert.ok(dictionary.workspace.profile.title.trim());
    assert.ok(
      dictionary.workspace.activity.labels["service.assignment.created"],
    );
    assert.deepEqual(Object.keys(dictionary.content.languages).sort(), [
      "ar",
      "en",
      "ku",
    ]);
  }
});
