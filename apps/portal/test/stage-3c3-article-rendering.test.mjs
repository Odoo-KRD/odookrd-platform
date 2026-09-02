import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (file) => readFile(path.join(root, file), "utf8");

const [mediaPlayer, articleViewer] = await Promise.all([
  read("apps/portal/src/components/training/lesson-media-player.tsx"),
  read("apps/portal/src/components/training/lesson-article-viewer.tsx"),
]);

test("3C.3 Article falls back past empty localized documents", () => {
  assert.match(mediaPlayer, /hasRenderableArticleNode/);
  assert.match(mediaPlayer, /fallbackOrder/);
  assert.match(
    mediaPlayer,
    /if \(hasRenderableArticleNode\(document\)\) return document/,
  );
});

test("3C.3 Article viewer supports the rich editor block presentation", () => {
  assert.match(articleViewer, /attrs\.textAlign/);
  assert.match(articleViewer, /attrs\.dir/);
  assert.match(articleViewer, /style=\{style\}/);
});

test("3C.3 Article viewer renders uploaded images and separators", () => {
  assert.match(articleViewer, /type === "image"/);
  assert.match(articleViewer, /type === "separator"/);
  assert.match(articleViewer, /max-h-\[42rem\]/);
});

test("3C.3 Article viewer preserves safe links and RTL defaults", () => {
  assert.match(articleViewer, /mailto:/);
  assert.match(articleViewer, /noopener noreferrer/);
  assert.match(mediaPlayer, /dir=\{locale === "en" \? "ltr" : "rtl"\}/);
});
