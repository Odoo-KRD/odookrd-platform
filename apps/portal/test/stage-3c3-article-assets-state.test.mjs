import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (file) => readFile(path.join(root, file), "utf8");

const [editorPage, mediaPlayer, articleViewer, controller, service, bff] =
  await Promise.all([
    read(
      "apps/portal/src/app/(protected)/admin/training/courses/[id]/sections/[sectionId]/lessons/[lessonId]/editor/page.tsx",
    ),
    read("apps/portal/src/components/training/lesson-media-player.tsx"),
    read("apps/portal/src/components/training/lesson-article-viewer.tsx"),
    read("apps/api/src/modules/training/training-media.controller.ts"),
    read("apps/api/src/modules/training/training-media.service.ts"),
    read(
      "apps/portal/src/app/api/training/catalog/[slug]/lessons/[lessonId]/article-assets/[fileId]/route.ts",
    ),
  ]);

test("Article editor remounts cleanly for every lesson", () => {
  assert.match(editorPage, /<TrainingLessonEditor[\s\S]*key=\{lessonId\}/);
});

test("customer Article file URLs are rewritten to lesson-scoped asset URLs", () => {
  assert.match(articleViewer, /fileContentPath/);
  assert.match(articleViewer, /articleAssetBasePath/);
  assert.match(mediaPlayer, /\/article-assets/);
});

test("API only serves Article assets referenced by the entitled published lesson", () => {
  assert.match(controller, /article-assets\/:fileId/);
  assert.match(service, /customerLesson\(principal, slug, lessonId\)/);
  assert.match(service, /articleReferencesFile/);
  assert.match(service, /candidate === `\/api\/files\/\$\{fileId\}\/content`/);
});

test("Article asset delivery does not weaken generic file authorization", () => {
  assert.match(service, /FileAssetKind\.IMAGE/);
  assert.match(service, /FileAssetKind\.ATTACHMENT/);
  assert.match(bff, /Authorization: `Bearer \$\{token\}`/);
  assert.doesNotMatch(
    bff,
    /\/v1\/files\/\$\{encodeURIComponent\(fileId\)\}\/content/,
  );
});
