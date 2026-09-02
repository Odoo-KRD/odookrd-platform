import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const builder = read(
  "apps/portal/src/components/training/training-quiz-builder.tsx",
);
const field = read(
  "apps/portal/src/components/training/training-quiz-localized-field.tsx",
);
const lessonEditor = read(
  "apps/portal/src/components/training/training-lesson-editor.tsx",
);
const finalPage = read(
  "apps/portal/src/app/(protected)/admin/training/courses/[id]/final-quiz/page.tsx",
);
const dictionary = read("apps/portal/src/lib/i18n/training-quiz.ts");

test("3C.4 quiz fields use the established field-translation interaction", () => {
  assert.match(builder, /TrainingQuizLocalizedField/);
  assert.doesNotMatch(builder, /function LocaleTabs|<LocaleTabs/);
  assert.match(field, /content\.translations/);
  assert.match(field, /\{locale\.toUpperCase\(\)\}/);
  assert.match(field, /SUPPORTED_LOCALES\.map/);
  assert.match(field, /z-\[1200\]/);
});

test("3C.4 optional translations are compacted before API validation", () => {
  assert.match(builder, /function compactLocalized/);
  assert.match(
    builder,
    /titleTranslations:\s*compactLocalized\(configuration\.title\)/,
  );
  assert.match(
    builder,
    /promptTranslations:\s*compactLocalized\(question\.prompt\)/,
  );
  assert.match(builder, /textTranslations:\s*compactLocalized\(option\.text\)/);
});

test("3C.4 accepts one authored language while retaining fallback", () => {
  assert.match(builder, /firstText\(configuration\.title, locale\)/);
  assert.match(builder, /firstText\(question\.prompt, locale\)/);
  assert.match(builder, /value\[preferred\]\.trim\(\)/);
});

test("3C.4 question validation errors stay inside the question modal", () => {
  assert.match(builder, /questionError/);
  assert.match(builder, /setQuestionError\(labels\.errors\.prompt\)/);
  assert.match(builder, /setQuestionError\(labels\.errors\.options\)/);
  assert.match(builder, /failQuestion/);
});

test("3C.4 translation controls receive the platform content dictionary", () => {
  assert.match(lessonEditor, /contentDictionary=\{contentDictionary\}/);
  assert.match(finalPage, /contentDictionary=\{content\}/);
});

test("3C.4 question dialog uses a question-specific save label", () => {
  assert.match(dictionary, /saveQuestion: string/);
  assert.match(builder, /\{labels\.saveQuestion\}/);
});
