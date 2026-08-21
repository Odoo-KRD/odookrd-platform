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
const apiRoot = path.resolve(portalRoot, "../api");
const locales = ["ku", "ar", "en"];

async function portalSource(relativePath) {
  return readFile(path.join(portalRoot, relativePath), "utf8");
}

async function apiSource(relativePath) {
  return readFile(path.join(apiRoot, relativePath), "utf8");
}

async function localeModule(source, name) {
  const javascript = stripTypeScriptTypes(source, { mode: "strip" });
  const loadedModule = await import(
    "data:text/javascript;base64," + Buffer.from(javascript).toString("base64")
  );

  assert.equal(
    typeof loadedModule[name],
    "object",
    name + " must export its locale",
  );
  return loadedModule[name];
}

function translationPaths(value, prefix = "") {
  return Object.entries(value)
    .flatMap(([key, nested]) => {
      const current = prefix ? prefix + "." + key : key;

      if (typeof nested === "string") {
        assert.ok(nested.trim().length > 0, current + " cannot be empty");
        return [current];
      }

      assert.equal(typeof nested, "object", current + " must be a translation");
      assert.notEqual(nested, null, current + " cannot be null");
      assert.ok(!Array.isArray(nested), current + " cannot be an array");
      return translationPaths(nested, current);
    })
    .sort();
}

test("common, administration, customer, and API translations each own one file per locale", async () => {
  for (const area of ["common", "admin", "frontend"]) {
    const translations = [];

    for (const locale of locales) {
      const source = await portalSource(
        "src/lib/i18n/" + area + "/" + locale + ".ts",
      );
      const suffix = locale[0].toUpperCase() + locale.slice(1);

      assert.match(
        source,
        /satisfies\s+(Dictionary|AdminTranslations|FrontendTranslations)/,
      );
      translations.push(await localeModule(source, area + suffix));
    }

    const expected = translationPaths(translations[0]);

    for (const translation of translations.slice(1)) {
      assert.deepEqual(translationPaths(translation), expected);
    }
  }

  for (const locale of locales) {
    const source = await apiSource("src/i18n/" + locale + ".ts");
    const suffix = locale[0].toUpperCase() + locale.slice(1);
    const translation = await localeModule(source, "api" + suffix);

    assert.match(source, /satisfies\s+ApiTranslations/);
    assert.ok(Object.keys(translation.errors).length >= 9);
    assert.ok(Object.keys(translation.notifications).length >= 5);
  }
});

test("customer translations exclude administrator secrets, internal notes, and management copy", async () => {
  for (const locale of locales) {
    const source = await portalSource(
      "src/lib/i18n/frontend/" + locale + ".ts",
    );

    assert.doesNotMatch(source, /internalNotes|internalNotesHint/);
    assert.doesNotMatch(source, /secret_access_key|webhook_verify_token/);
    assert.doesNotMatch(source, /settings:\s*\{|administration:\s*\{/);
    assert.match(source, /invitations:\s*\{/);
    assert.match(source, /services:\s*\{/);
  }
});

test("legacy dictionary imports remain typed adapters without inline translation objects", async () => {
  for (const file of [
    "dictionaries",
    "admin",
    "users",
    "settings",
    "services",
    "portal",
  ]) {
    const source = await portalSource("src/lib/i18n/" + file + ".ts");

    assert.match(source, /Record<Locale,/);
    assert.match(source, /Translations\.(ku|ar|en)/);
    assert.doesNotMatch(source, /\b(ku|ar|en):\s*\{/);
  }
});

test("language switching, date formatting, text direction, and metadata share one typed registry", async () => {
  const [config, switcher, format, layout] = await Promise.all([
    portalSource("src/lib/i18n/config.ts"),
    portalSource("src/components/preferences/language-switcher.tsx"),
    portalSource("src/lib/format.ts"),
    portalSource("src/app/layout.tsx"),
  ]);

  assert.match(config, /DEFAULT_LOCALE:\s*Locale\s*=\s*["']ku["']/);
  assert.match(config, /LOCALE_METADATA\[locale\]\.direction/);
  assert.match(switcher, /SUPPORTED_LOCALES\.map/);
  assert.match(switcher, /LOCALE_METADATA\[value\]\.label/);
  assert.match(format, /LOCALE_METADATA\[locale\]\.dateLocale/);
  assert.match(layout, /dictionary\.common\.platform/);
  assert.match(layout, /dictionary\.common\.secureAccess/);
});

test("selected locale is forwarded server-side while the API negotiates language safely", async () => {
  const [portalApi, setup, api] = await Promise.all([
    portalSource("src/lib/api.ts"),
    apiSource("src/app.setup.ts"),
    apiSource("src/i18n/index.ts"),
  ]);

  assert.match(portalApi, /cookies\(\)/);
  assert.match(portalApi, /headers\.set\(["']Accept-Language["']/);
  assert.match(portalApi, /DEFAULT_LOCALE/);
  assert.match(setup, /app\.use\(apiLocaleMiddleware\)/);
  assert.match(api, /response\.setHeader\(["']Content-Language["']/);
  assert.match(api, /normalized\s*===\s*["']ckb["']/);
});

test("invitations and customer services consume frontend-only translation surfaces", async () => {
  const [login, invitation, invitationForm, customer, details] =
    await Promise.all([
      portalSource("src/app/(public)/login/page.tsx"),
      portalSource("src/app/(public)/invitation/accept/page.tsx"),
      portalSource("src/components/invitations/accept-invitation-form.tsx"),
      portalSource(
        "src/app/(protected)/(customer)/dashboard/services/page.tsx",
      ),
      portalSource(
        "src/app/(protected)/(customer)/dashboard/services/[id]/page.tsx",
      ),
    ]);

  assert.match(login, /frontendTranslations\[locale\]\.invitations/);
  assert.match(invitation, /frontendTranslations\[locale\]\.invitations/);
  assert.match(invitationForm, /labels:\s*InvitationDictionary/);
  assert.match(customer, /getFrontendDictionary\(\)/);
  assert.match(details, /getFrontendDictionary\(\)/);
  assert.doesNotMatch(customer + details, /internalNotes/);
});
