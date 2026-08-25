import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const [form, legacyForm, actions, units, dictionary, attachment, assignment] =
  await Promise.all([
    read("src/components/services/feature-definition-form.tsx"),
    read("src/components/services/service-feature-form.tsx"),
    read("src/app/(protected)/admin/services/actions.ts"),
    read("src/lib/service-feature-units.ts"),
    read("src/lib/i18n/service-features.ts"),
    read("src/components/services/service-feature-attachment-form.tsx"),
    read("src/components/services/assignment-feature-form.tsx"),
  ]);

test("feature definitions offer Yes/No, Number, Storage, and Text", () => {
  assert.match(form, /"BOOLEAN",\s*"NUMBER",\s*"STORAGE",\s*"TEXT"/);
  assert.match(actions, /"BOOLEAN",\s*"NUMBER",\s*"STORAGE",\s*"TEXT"/);
  assert.match(dictionary, /BOOLEAN: "Yes \/ No"/);
  assert.match(dictionary, /NUMBER: "Number"/);
  assert.match(dictionary, /STORAGE: "Storage"/);
  assert.match(dictionary, /TEXT: "Text"/);
});

test("storage units are predefined and nullable while Number has optional presets", () => {
  assert.match(units, /STORAGE_FEATURE_UNITS = \["MB", "GB", "TB"\]/);
  assert.match(units, /NUMBER_FEATURE_UNITS = \[/);
  assert.match(form, /<option value="">\{features\.noUnit\}<\/option>/);
  assert.match(form, /valueType === "STORAGE"/);
  assert.match(form, /STORAGE_FEATURE_UNITS/);
  assert.match(form, /NUMBER_FEATURE_UNITS/);
  assert.doesNotMatch(form, /name="unit"[\s\S]{0,120}type="text"/);

  for (const editor of [form, legacyForm]) {
    assert.match(editor, /STORAGE_FEATURE_UNITS\.map\(\(unit\) =>/);
    assert.match(editor, /NUMBER_FEATURE_UNITS\.map\(\(unit\) =>/);
    assert.doesNotMatch(
      editor,
      /\?\s*STORAGE_FEATURE_UNITS\s*:\s*NUMBER_FEATURE_UNITS[\s\S]{0,60}\.map/,
    );
  }
});

test("storage values remain numeric in service and company override editors", () => {
  assert.match(actions, /valueType === "NUMBER" \|\| valueType === "STORAGE"/);
  assert.match(attachment, /type="number"/);
  assert.match(assignment, /type="number"/);
});

test("new unit and Storage labels exist in Kurdish, Arabic, and English", () => {
  assert.equal((dictionary.match(/noUnit:/g) ?? []).length, 4);
  assert.equal((dictionary.match(/STORAGE:/g) ?? []).length, 3);
  assert.equal((dictionary.match(/numberUnitLabels:/g) ?? []).length, 4);
});
