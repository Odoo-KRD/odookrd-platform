import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workspaceRoot = new URL('../../../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, workspaceRoot), 'utf8');

test('3B.2R.1 repairs shared file delivery with integrity-checked buffering', () => {
  const files = read('apps/api/src/modules/files/files.service.ts');
  const controller = read('apps/api/src/modules/files/files.controller.ts');
  const bff = read('apps/portal/src/app/api/files/[fileId]/content/route.ts');
  const local = read(
    'apps/api/src/modules/files/storage/local-file-storage.provider.ts',
  );

  assert.match(files, /Buffer\.concat\(chunks\)/);
  assert.match(files, /sha256 !== asset\.sha256/);
  assert.match(controller, /new StreamableFile\(buffer\)/);
  assert.match(bff, /await upstream\.arrayBuffer\(\)/);
  assert.match(bff, /Content-Length/);
  assert.match(local, /await open\(target, 'r'\)/);
  assert.match(local, /stats\.isFile\(\)/);
});

test('3B.2R.1 upgrades RichTextEditor with images, attachments and fullscreen', () => {
  const editor = read('packages/ui/src/rich-text-editor.tsx');
  const localized = read(
    'apps/portal/src/components/training/localized-rich-text-editor.tsx',
  );

  assert.match(editor, /onUploadImage/);
  assert.match(editor, /onUploadFile/);
  assert.match(editor, /setFullscreen/);
  assert.match(editor, /@tiptap\/extension-link/);
  assert.match(localized, /kind: "IMAGE" \| "DOCUMENT" \| "ATTACHMENT"/);
  assert.match(localized, /uploadAsset\(file, "IMAGE"\)/);
  assert.match(localized, /uploadAsset\(file, "ATTACHMENT"\)/);
});

test('3B.2R.1 adds guarded section and lesson deletion while preserving archive lifecycle', () => {
  const controller = read(
    'apps/api/src/modules/training/training.controller.ts',
  );
  const service = read('apps/api/src/modules/training/training.service.ts');
  const editor = read(
    'apps/portal/src/components/training/course-structure-editor.tsx',
  );
  const bff = read('apps/portal/src/app/api/training/[...path]/route.ts');

  assert.match(
    controller,
    /@Delete\('courses\/:courseId\/sections\/:sectionId'\)/,
  );
  assert.match(
    controller,
    /@Delete\('courses\/:courseId\/sections\/:sectionId\/lessons\/:lessonId'\)/,
  );
  assert.match(service, /trainingLessonProgress\.count/);
  assert.match(service, /Archive it instead/);
  assert.match(editor, /training\.editor\.archive/);
  assert.match(editor, /training\.editor\.restore/);
  assert.match(editor, /training\.editor\.delete/);
  assert.match(bff, /export async function DELETE/);
});

test('3B.2R.1 exposes E-Learning and platform File Storage settings', () => {
  const registry = read('apps/api/src/modules/settings/settings.registry.ts');
  const types = read('packages/types/src/index.ts');
  const form = read('apps/portal/src/components/settings/settings-form.tsx');
  const navigation = read('apps/portal/src/lib/i18n/settings-navigation.ts');

  assert.match(registry, /files\.storage\.default_provider/);
  assert.match(registry, /files\.types\.pdf_enabled/);
  assert.match(registry, /files\.upload\.max_image_mb/);
  assert.match(types, /\| "files";/);
  assert.match(form, /"trainings",\s*"files"/s);
  assert.match(form, /trainingTabs/);
  assert.match(form, /fileTabs/);
  assert.match(navigation, /E-Learning settings/);
  assert.match(navigation, /File Storage settings/);
});

test('3B.2R.1 keeps storage provider assignment immutable per existing FileAsset', () => {
  const storage = read(
    'apps/api/src/modules/files/storage/file-storage.service.ts',
  );
  const files = read('apps/api/src/modules/files/files.service.ts');

  assert.match(storage, /getConfiguredProvider/);
  assert.match(
    files,
    /const storageProvider = await this\.storage\.getConfiguredProvider\(\)/,
  );
  assert.match(files, /asset\.storageProvider/);
});
