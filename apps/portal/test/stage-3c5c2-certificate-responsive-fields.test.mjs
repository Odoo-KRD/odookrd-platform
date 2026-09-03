import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const formPath =
  "apps/portal/src/components/training/training-certificate-template-form.tsx";

function pairedBlock(source, first, second) {
  const start = source.lastIndexOf(
    '<div className="grid gap-4',
    source.indexOf(first),
  );
  assert.notEqual(start, -1);
  const end = source.indexOf("</div>", source.indexOf(second));
  assert.notEqual(end, -1);
  return source.slice(start, end + 6);
}

test("General key/name fields stack until a genuinely wide designer panel", async () => {
  const form = await readFile(formPath, "utf8");
  const block = pairedBlock(
    form,
    "{designer.internalKey}",
    "{designer.internalName}",
  );

  assert.match(block, /2xl:grid-cols-2/);
  assert.doesNotMatch(block, /sm:grid-cols-2/);
  assert.match(block, /min-w-0 grid gap-2/);
  assert.match(block, /w-full min-w-0/);
});

test("Content signatory fields stack until a genuinely wide designer panel", async () => {
  const form = await readFile(formPath, "utf8");
  const block = pairedBlock(
    form,
    "{designer.signatoryName}",
    "{designer.signatoryTitle}",
  );

  assert.match(block, /2xl:grid-cols-2/);
  assert.doesNotMatch(block, /sm:grid-cols-2/);
  assert.match(block, /min-w-0 grid gap-2/);
  assert.match(block, /w-full min-w-0/);
});
