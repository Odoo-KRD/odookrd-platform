import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");

test("3B.2R.2C allows creation from the active Arabic or English locale", () => {
  const content = read("apps/portal/src/lib/i18n/content.ts");
  const fields = read(
    "apps/portal/src/components/i18n/localized-text-fields.tsx",
  );
  const companies = read(
    "apps/portal/src/app/(protected)/admin/companies/actions.ts",
  );
  const training = read(
    "apps/portal/src/app/(protected)/admin/training/actions.ts",
  );

  assert.match(fields, /__activeLocale/);
  assert.match(fields, /required=\{required\}/);
  assert.match(content, /preferredLocalizedValue/);
  assert.match(content, /translations\.ku = fallback/);
  assert.match(companies, /localizedFormValues/);
  assert.match(training, /preferredLocalizedFallback/);
  assert.match(training, /translations\.ku = fallback/);
});

test("3B.2R.2C keeps section and lesson titles compatible with active-locale fallback", () => {
  const editor = read(
    "apps/portal/src/components/training/course-structure-editor.tsx",
  );
  assert.match(editor, /title\.__activeLocale/);
  assert.match(editor, /localized\.ku = title/);
});

test("3B.2R.2C provides a professional resizable editor and image-row selection", () => {
  const editor = read("packages/ui/src/rich-text-editor.tsx");

  assert.match(editor, /resize-y/);
  assert.match(editor, /max-h-\[70vh\]/);
  assert.match(editor, /NodeViewWrapper[\s\S]*onClick/);
  assert.match(editor, /ReactMouseEvent<HTMLElement>/);
  assert.match(editor, /selectImageNode/);
  assert.match(editor, /grid-cols-\[minmax\(0,1fr\)_auto\]/);
});

test("3B.2R.2C replaces browser prompts with localized command dialogs", () => {
  const editor = read("packages/ui/src/rich-text-editor.tsx");
  const dictionary = read("apps/portal/src/lib/i18n/training.ts");

  assert.doesNotMatch(editor, /window\.prompt/);
  assert.match(editor, /role="dialog"/);
  assert.match(editor, /commandDialog/);
  assert.match(editor, /applyCommandDialog/);
  assert.match(editor, /dialogApply/);
  assert.match(editor, /dialogCancel/);
  assert.match(dictionary, /dialogApply: "Apply"/);
  assert.match(dictionary, /dialogCancel: "Cancel"/);
});
