import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const formPath =
  "apps/portal/src/components/training/training-certificate-template-form.tsx";
const layoutPath = "apps/portal/src/app/(protected)/admin/layout.tsx";

test("font selector maps all four choices to distinct live-preview families", async () => {
  const form = await readFile(formPath, "utf8");

  assert.match(form, /case "SERIF":[\s\S]*?"Noto Serif"/);
  assert.match(form, /case "ARABIC_SANS":[\s\S]*?"Noto Sans Arabic"/);
  assert.match(form, /case "ARABIC_NASKH":[\s\S]*?"Noto Naskh Arabic"/);
  assert.match(form, /case "SANS":[\s\S]*?"Noto Sans"/);
});

test("admin designer self-hosts the Noto families used by the font selector", async () => {
  const layout = await readFile(layoutPath, "utf8");

  for (const family of [
    "noto-sans",
    "noto-serif",
    "noto-sans-arabic",
    "noto-naskh-arabic",
  ]) {
    assert.ok(layout.includes(`@fontsource/${family}/400.css`));
    assert.ok(layout.includes(`@fontsource/${family}/700.css`));
  }
});
