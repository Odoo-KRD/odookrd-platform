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

test("one reusable field owns the Odoo-style language button and popup", async () => {
  const editor = await source("src/components/i18n/localized-text-fields.tsx");

  assert.match(editor, /export function LocalizedTextField\(/u);
  assert.match(
    editor,
    /export const LocalizedTextFields = LocalizedTextField/u,
  );
  assert.match(editor, /activeLocale\.toUpperCase\(\)/u);
  assert.match(editor, /aria-haspopup="dialog"/u);
  assert.match(editor, /role="dialog"/u);
  assert.match(editor, /aria-modal="true"/u);
  assert.match(editor, /event\.key === "Escape"/u);
  assert.match(editor, /onMouseDown/u);
});

test("popup drafts save or discard without losing controlled form values", async () => {
  const editor = await source("src/components/i18n/localized-text-fields.tsx");

  assert.match(editor, /useState<LocalizedText>/u);
  assert.match(editor, /const \[draft, setDraft\]/u);
  assert.match(editor, /function saveDraft\(\)/u);
  assert.match(editor, /setValues\(draft\)/u);
  assert.match(editor, /function discardDraft\(\)/u);
  assert.match(editor, /value=\{value\}/u);
  assert.doesNotMatch(editor, /defaultValue=\{value\}/u);
});

test("all locales keep their established server-action field names", async () => {
  const editor = await source("src/components/i18n/localized-text-fields.tsx");

  assert.match(editor, /name=\{`\$\{field\}\.\$\{activeLocale\}`\}/u);
  assert.match(editor, /name=\{`\$\{field\}\.\$\{selectedLocale\}`\}/u);
  assert.match(editor, /SUPPORTED_LOCALES\.filter/u);
  assert.match(editor, /required=\{required && isDefault\}/u);
  assert.match(editor, /localeDirection\(selectedLocale\)/u);
});

test("the same component supports names, descriptions, and assignment labels", async () => {
  const files = {
    company: await source("src/components/companies/company-form.tsx"),
    service: await source("src/components/services/service-form.tsx"),
    assignment: await source(
      "src/components/services/service-assignment-form.tsx",
    ),
  };

  assert.match(files.company, /field="name"/u);
  assert.match(files.service, /field="name"/u);
  assert.match(files.service, /field="description"[\s\S]*multiline/u);
  assert.match(files.assignment, /field="displayName"/u);
});

test("every administration locale identifies itself and translates popup actions", async () => {
  for (const locale of ["ku", "ar", "en"]) {
    const text = await source(`src/lib/i18n/admin/${locale}.ts`);
    const javascript = stripTypeScriptTypes(text, { mode: "strip" });
    const loaded = await import(
      `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
    );
    const suffix = locale[0].toUpperCase() + locale.slice(1);
    const content = loaded[`admin${suffix}`].content;

    assert.equal(content.locale, locale);
    assert.ok(content.translations.trim());
    assert.ok(content.saveTranslations.trim());
    assert.ok(content.discardTranslations.trim());
    assert.deepEqual(Object.keys(content.languages).sort(), ["ar", "en", "ku"]);
  }
});
