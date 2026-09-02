import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const localizedField = fs.readFileSync(
  path.join(root, "src/components/training/training-quiz-localized-field.tsx"),
  "utf8",
);

test("3C.4 Quiz translations never read SyntheticEvent.currentTarget inside a deferred state updater", () => {
  assert.match(
    localizedField,
    /function updateDraftTranslation\([\s\S]*?\[selectedLocale\]: nextValue/,
  );

  const unsafeDeferredRead =
    /setDraft\(\(previous\)\s*=>\s*\(\{[\s\S]{0,180}?event\.currentTarget\.value/;

  assert.doesNotMatch(localizedField, unsafeDeferredRead);
});

test("3C.4 both text and multiline translation inputs capture their value synchronously", () => {
  const safeHandlers = localizedField.match(
    /updateDraftTranslation\(\s*selectedLocale,\s*event\.currentTarget\.value,\s*\)/g,
  );

  assert.equal(safeHandlers?.length, 2);
});

test("3C.4 translation dialog still preserves explicit save and discard semantics", () => {
  assert.match(localizedField, /function saveTranslations\(\)/);
  assert.match(localizedField, /function cancelTranslations\(\)/);
  assert.match(localizedField, /setDraft\(asFormValue\(value\)\)/);
  assert.match(localizedField, /content\.saveTranslations/);
  assert.match(localizedField, /content\.discardTranslations/);
});
