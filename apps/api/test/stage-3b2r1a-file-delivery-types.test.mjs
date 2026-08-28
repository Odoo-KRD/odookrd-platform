import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workspaceRoot = new URL('../../../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, workspaceRoot), 'utf8');

test('3B.2R.1A serves exact binary bytes instead of StreamableFile wrappers', () => {
  const controller = read('apps/api/src/modules/files/files.controller.ts');
  const bff = read('apps/portal/src/app/api/files/[fileId]/content/route.ts');

  assert.match(controller, /response\.end\(buffer\)/);
  assert.doesNotMatch(controller, /StreamableFile/);
  assert.match(controller, /X-File-SHA256/);
  assert.match(bff, /createHash\("sha256"\)/);
  assert.match(bff, /new Uint8Array\(body\)/);
  assert.match(bff, /failed its integrity check/);
});

test('3B.2R.1A expands the hard file policy without trusting extensions', () => {
  const validator = read(
    'apps/api/src/modules/files/file-signature.validator.ts',
  );
  const service = read('apps/api/src/modules/files/files.service.ts');

  assert.doesNotMatch(validator, /file-type|fileTypeFromBuffer/);
  assert.match(validator, /word\/document\.xml/);
  assert.match(validator, /ppt\/presentation\.xml/);
  assert.match(validator, /xl\/workbook\.xml/);
  assert.match(validator, /image\/svg\+xml/);
  assert.match(validator, /wordprocessingml\.document/);
  assert.match(validator, /presentationml\.presentation/);
  assert.match(validator, /spreadsheetml\.sheet/);
  assert.match(validator, /application\/zip/);
  assert.match(validator, /SVG external references are not permitted/);
  assert.match(service, /files\.types\.svg_enabled/);
  assert.match(service, /files\.types\.docx_enabled/);
  assert.match(service, /files\.types\.pptx_enabled/);
  assert.match(service, /files\.types\.xlsx_enabled/);
  assert.match(service, /files\.types\.zip_enabled/);
  assert.doesNotMatch(validator, /export async function detectSupportedFile/);
  assert.match(validator, /buffer: Buffer/);
  assert.match(service, /stream as AsyncIterable<unknown>/);
  assert.doesNotMatch(
    service,
    /chunks\.push\(Buffer\.isBuffer\(chunk\) \? chunk : Buffer\.from\(chunk\)\)/,
  );
});

test('3B.2R.1A exposes SVG and Office/resource formats in both editors and settings', () => {
  const editor = read('packages/ui/src/rich-text-editor.tsx');
  const cover = read(
    'apps/portal/src/components/training/course-cover-field.tsx',
  );
  const settings = read(
    'apps/portal/src/app/(protected)/admin/settings/actions.ts',
  );

  assert.match(editor, /image\/svg\+xml/);
  assert.match(editor, /\.docx/);
  assert.match(editor, /\.pptx/);
  assert.match(editor, /\.xlsx/);
  assert.match(editor, /\.zip/);
  assert.match(cover, /image\/svg\+xml/);
  assert.match(settings, /files\.types\.svg_enabled/);
  assert.match(settings, /files\.types\.docx_enabled/);
  assert.match(settings, /files\.types\.pptx_enabled/);
  assert.match(settings, /files\.types\.xlsx_enabled/);
  assert.match(settings, /files\.types\.zip_enabled/);
  const navigation = read('apps/portal/src/lib/i18n/settings-navigation.ts');
  assert.match(
    navigation,
    /fieldCopy: Record<string, \{ label: string; description: string \}>/,
  );
  for (const key of [
    'files.types.svg_enabled',
    'files.types.docx_enabled',
    'files.types.pptx_enabled',
    'files.types.xlsx_enabled',
    'files.types.zip_enabled',
  ]) {
    assert.equal(
      navigation.split(`"${key}"`).length - 1,
      3,
      `${key} must appear once per locale and never be nested under another field`,
    );
  }
});
