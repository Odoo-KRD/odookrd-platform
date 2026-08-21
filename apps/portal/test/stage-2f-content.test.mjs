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

test("company and service editors expose all three typed languages with correct direction", async () => {
  const [fields, company, service, assignment] = await Promise.all([
    source("src/components/i18n/localized-text-fields.tsx"),
    source("src/components/companies/company-form.tsx"),
    source("src/components/services/service-form.tsx"),
    source("src/components/services/service-assignment-form.tsx"),
  ]);

  assert.match(fields, /SUPPORTED_LOCALES\.map/);
  assert.match(fields, /getTextDirection\(locale\)/);
  assert.match(fields, /required=\{required && isDefault\}/);
  assert.match(company, /field=['"]name['"]/);
  assert.match(service, /field=['"]name['"]/);
  assert.match(service, /field=['"]description['"]/);
  assert.match(assignment, /field=['"]displayName['"]/);
  assert.match(assignment, /name=['"]internalNotes['"]/);
});

test("translation writes remain server-side and preserve company permission boundaries", async () => {
  const [companies, services] = await Promise.all([
    source("src/app/(protected)/admin/companies/actions.ts"),
    source("src/app/(protected)/admin/services/actions.ts"),
  ]);

  for (const actions of [companies, services]) {
    assert.match(actions, /^['"]use server['"];/);
    assert.match(actions, /localizedFormValues/);
    assert.match(actions, /getAdminApiContext\(/);
    assert.match(actions, /nameTranslations/);
  }

  assert.match(companies, /session\.user\.companyId\s*!==\s*companyId/);
  assert.match(services, /PERMISSIONS\.SERVICES_MANAGE/);
  assert.match(services, /descriptionTranslations/);
  assert.match(services, /displayNameTranslations/);
});

test("administration labels stay complete in Kurdish, Arabic, and English", async () => {
  for (const locale of ["ku", "ar", "en"]) {
    const text = await source("src/lib/i18n/admin/" + locale + ".ts");
    const javascript = stripTypeScriptTypes(text, { mode: "strip" });
    const loaded = await import(
      "data:text/javascript;base64," +
        Buffer.from(javascript).toString("base64")
    );
    const suffix = locale[0].toUpperCase() + locale.slice(1);
    const content = loaded["admin" + suffix].content;

    assert.ok(content.translations.trim());
    assert.ok(content.defaultLanguage.trim());
    assert.ok(content.optionalLanguage.trim());
    assert.deepEqual(Object.keys(content.languages).sort(), ["ar", "en", "ku"]);
  }
});

test("customer descriptions remain translated without leaking internal operator notes", async () => {
  for (const relativePath of [
    "src/app/(protected)/(customer)/dashboard/services/page.tsx",
    "src/app/(protected)/(customer)/dashboard/services/[id]/page.tsx",
  ]) {
    const text = await source(relativePath);

    assert.match(text, /assignment\.service\.description/);
    assert.match(text, /getFrontendDictionary\(\)/);
    assert.doesNotMatch(text, /internalNotes/);
  }
});
