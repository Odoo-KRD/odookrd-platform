import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

const form = read(
  "apps/portal/src/components/training/training-certificate-template-form.tsx",
);
const dictionary = read(
  "apps/portal/src/lib/i18n/training-certificate-designer.ts",
);
const listPage = read(
  "apps/portal/src/app/(protected)/admin/training/certificate-templates/page.tsx",
);
const newPage = read(
  "apps/portal/src/app/(protected)/admin/training/certificate-templates/new/page.tsx",
);
const editPage = read(
  "apps/portal/src/app/(protected)/admin/training/certificate-templates/[id]/page.tsx",
);

test("3C.5C.2 exposes a split-view enterprise certificate designer", () => {
  assert.match(form, /livePreview/);
  assert.match(
    form,
    /xl:grid-cols-\[minmax\(340px,0\.72fr\)_minmax\(0,1\.28fr\)\]/,
  );
  assert.match(form, /generalTab/);
  assert.match(form, /backgroundTab/);
  assert.match(form, /layoutTab/);
});

test("3C.5C.2 renders professional intro-name-body hierarchy", () => {
  assert.match(form, /introTranslations/);
  assert.match(form, /previewNode\("intro"/);
  assert.match(form, /previewNode\("learnerName"/);
  assert.match(form, /previewNode\("body"/);
  assert.match(dictionary, /This certificate is proudly presented to/);
});

test("3C.5C.2 supports vector presets and custom SVG artwork", () => {
  assert.match(form, /certificate-templates\/presets/);
  assert.match(form, /image\/svg\+xml/);
  assert.match(form, /backgroundPresetKey/);
  assert.match(form, /customBackground/);
});

test("3C.5C.2 provides exact non-issuing PDF preview", () => {
  assert.match(form, /certificate-templates\/preview/);
  assert.match(form, /sampleLearnerName/);
  assert.match(form, /sampleCourseTitle/);
  assert.doesNotMatch(form, /certificates\/courses\/.*\/issue/);
});

test("3C.5C.2 provides precise element controls and direct dragging", () => {
  assert.match(form, /handlePointerDown/);
  assert.match(form, /handlePointerMove/);
  assert.match(form, /fontFamily/);
  assert.match(form, /fontWeight/);
  assert.match(form, /resetLayout/);
  assert.match(form, /safeArea/);
});

test("3C.5C.2 exposes lifecycle, default and duplication controls", () => {
  assert.match(form, /statusDraft/);
  assert.match(form, /statusActive/);
  assert.match(form, /statusArchived/);
  assert.match(form, /isDefault/);
  assert.match(form, /\/duplicate/);
});

test("3C.5C.2 loads presets server-side for create and edit designer pages", () => {
  assert.match(newPage, /certificate-templates\/presets/);
  assert.match(editPage, /certificate-templates\/presets/);
  assert.match(newPage, /designer=\{designer\}/);
  assert.match(editPage, /designer=\{designer\}/);
});

test("3C.5C.2 upgrades the template list into a visual gallery", () => {
  assert.match(listPage, /templateGallery/);
  assert.match(listPage, /aspect-\[1600\/1131\]/);
  assert.match(listPage, /backgroundPresetKey/);
  assert.match(listPage, /isDefault/);
  assert.match(listPage, /editDesigner/);
});
