import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const formPath =
  "apps/portal/src/components/training/training-certificate-template-form.tsx";

test("certificate internal key pattern is valid for modern HTML pattern v-mode", async () => {
  const form = await readFile(formPath, "utf8");

  assert.ok(
    form.includes('pattern="[a-z](?:[a-z0-9_]|-){1,99}"'),
    "v-mode-safe Internal Key pattern should be present",
  );

  assert.ok(
    !form.includes('pattern="[a-z][a-z0-9_-]{1,99}"'),
    "legacy invalid character-class pattern should be absent",
  );
});
