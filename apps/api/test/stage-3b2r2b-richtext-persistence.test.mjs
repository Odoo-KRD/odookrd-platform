import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../../../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');

test('3B.2R.2B uses one StarterKit link extension and persists links safely', () => {
  const editor = read('packages/ui/src/rich-text-editor.tsx');
  const service = read('apps/api/src/modules/training/training.service.ts');

  assert.doesNotMatch(editor, /import Link from "@tiptap\/extension-link"/);
  assert.match(editor, /StarterKit\.configure\(\{/);
  assert.match(editor, /link:\s*\{/);
  assert.match(service, /isAllowedRichTextMark/);
  assert.match(service, /isAllowedRichTextHref/);
  assert.match(service, /mark\.type !== 'link'/);
  assert.match(service, /http:/);
  assert.match(service, /https:/);
  assert.match(service, /mailto:/);
  assert.match(service, /api.*files/);
  assert.match(service, /separator/);
});

test('3B.2R.2B makes resize cursors explicit and keeps four square grips', () => {
  const editor = read('packages/ui/src/rich-text-editor.tsx');

  assert.match(editor, /cornerCursor/);
  assert.match(editor, /nwse-resize/);
  assert.match(editor, /nesw-resize/);
  assert.match(editor, /touchAction: "none"/);
  assert.match(editor, /rounded-none/);
  for (const corner of [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ]) {
    assert.match(editor, new RegExp(corner));
  }
});

test('3B.2R.2B keeps normal editor height fixed and scrolls long content', () => {
  const editor = read('packages/ui/src/rich-text-editor.tsx');

  assert.match(editor, /"h-64 overflow-y-auto"/);
  assert.match(editor, /"min-h-0 flex-1 overflow-y-auto"/);
  assert.doesNotMatch(editor, /minHeightClassName/);
});
