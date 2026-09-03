import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const formPath =
  "apps/portal/src/components/training/training-certificate-template-form.tsx";

test("3C.5C.2 omits empty optional certificate translations from API payloads", async () => {
  const form = await readFile(formPath, "utf8");

  assert.match(
    form,
    /function compactTranslations\(value: LocalizedText\): LocalizedText/,
  );
  assert.match(
    form,
    /const candidate = value\[locale\]\?\.trim\(\);[\s\S]*if \(candidate\) compacted\[locale\] = candidate;/,
  );
  assert.match(
    form,
    /titleTranslations: compactTranslations\(titleTranslations\)/,
  );
  assert.match(
    form,
    /introTranslations: compactTranslations\(introTranslations\)/,
  );
  assert.match(
    form,
    /bodyTranslations: compactTranslations\(bodyTranslations\)/,
  );
});

test("3C.5C.2 still requires only one authored title and body language", async () => {
  const form = await readFile(formPath, "utf8");

  assert.match(form, /const hasTitle = \["ku", "ar", "en"\]\.some/);
  assert.match(form, /const hasBody = \["ku", "ar", "en"\]\.some/);
});
