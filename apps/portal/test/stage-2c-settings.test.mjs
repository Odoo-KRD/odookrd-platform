import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const portalRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(path) {
  return readFileSync(join(portalRoot, path), "utf8");
}

const page = read("src/app/(protected)/admin/settings/page.tsx");
const action = read("src/app/(protected)/admin/settings/actions.ts");
const form = read("src/components/settings/settings-form.tsx");
const layout = read("src/app/layout.tsx");
const localeServer = read("src/lib/i18n/server.ts");
const publicSettings = read("src/lib/public-settings.ts");
const authorization = read("src/lib/authorization.ts");
const adminLayout = read("src/app/(protected)/admin/layout.tsx");
const customerLayout = read("src/app/(protected)/(customer)/layout.tsx");
const loginPage = read("src/app/(public)/login/page.tsx");
const dictionaries = ["ku", "ar", "en"]
  .map((locale) => read("src/lib/i18n/admin/" + locale + ".ts"))
  .join("\n");

test("settings administration requires explicit permissions and server API context", () => {
  assert.match(page, /getAdminApiContext\(PERMISSIONS\.SETTINGS_READ\)/);
  assert.match(action, /getAdminApiContext\(\s*PERMISSIONS\.SETTINGS_MANAGE/);
  assert.match(authorization, /PERMISSIONS\.SETTINGS_READ/);
  assert.match(
    adminLayout,
    /hasPermission\(session, PERMISSIONS\.SETTINGS_READ\)/,
  );
});

test("company administrators stay within their authenticated company scope", () => {
  assert.match(action, /session\.user\.accountScope === "COMPANY"/);
  assert.match(action, /companyId !== session\.user\.companyId/);
  assert.match(page, /session\.user\.companyId/);
  assert.match(action, /Access outside company scope is forbidden/);
});

test("active settings are generic category tabs with future categories reserved", () => {
  for (const category of ["general", "theme", "companies", "notifications"]) {
    assert.match(form, new RegExp('"' + category + '"'));
  }
  for (const category of ["helpdesk", "trainings"]) {
    assert.match(dictionaries, new RegExp(category + ":"));
  }
  assert.match(action, /SETTING_KEYS_BY_CATEGORY/);
});

test("secret credentials never receive a server-rendered value", () => {
  assert.match(form, /setting\.isSecret \? "password"/);
  assert.match(form, /setting\.isSecret \? "" : String\(setting\.value/);
  assert.match(form, /setting\.configured/);
  assert.match(form, /clear\./);
  assert.doesNotMatch(form, /encryptedValue|secret_access_key.*setting\.value/);
});

test("public settings apply only safe branding, locale, and font values", () => {
  assert.match(layout, /generateMetadata/);
  assert.match(layout, /settings\.siteTitle/);
  assert.match(layout, /fontStacks\[settings\.defaultFont\]/);
  assert.match(adminLayout, /publicSettings\.siteTitle/);
  assert.match(customerLayout, /publicSettings\.siteTitle/);
  assert.match(loginPage, /publicSettings\.siteTitle/);
  assert.match(localeServer, /publicSettings\.defaultLocale/);
  assert.match(publicSettings, /supportedFonts\.has/);
  assert.doesNotMatch(publicSettings, /access_key|accessToken|resolveSecret/i);
});

test("Kurdish, Arabic, and English settings copy stays complete", () => {
  for (const locale of ["ku", "ar", "en"]) {
    const translations = read("src/lib/i18n/admin/" + locale + ".ts");
    assert.match(translations, /settings:\s*\{/);
  }

  for (const key of [
    "general.site_title",
    "theme.default_font",
    "companies.max_users_per_company",
    "notifications.email.amazon_ses.secret_access_key",
    "notifications.whatsapp.access_token",
  ]) {
    const matches = dictionaries.match(
      new RegExp(key.replaceAll(".", "\\."), "g"),
    );

    assert.equal(matches?.length, 3, key + " must be translated three times");
  }
});
