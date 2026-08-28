import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workspaceRoot = new URL('../../../', import.meta.url);
const apiRoot = new URL('apps/api/', workspaceRoot);
const portalRoot = new URL('apps/portal/', workspaceRoot);
const uiRoot = new URL('packages/ui/', workspaceRoot);
const typesRoot = new URL('packages/types/', workspaceRoot);

const read = (root, path) => fs.readFileSync(new URL(path, root), 'utf8');

test('3B.2R adds atomic course structure endpoints and backend validation', () => {
  const controller = read(
    apiRoot,
    'src/modules/training/training.controller.ts',
  );
  const service = read(apiRoot, 'src/modules/training/training.service.ts');
  assert.match(controller, /courses\/:courseId\/structure/);
  assert.match(controller, /UpdateTrainingCourseStructureDto/);
  assert.match(service, /async updateCourseStructure/);
  assert.match(service, /Duplicate section identifiers/);
  assert.match(service, /every lesson belonging to the course exactly once/);
  assert.match(service, /\$transaction\(async \(transaction\)/);
  assert.match(service, /sectionId: section\.id/);
  assert.match(service, /sortOrder: lessonIndex/);
});

test('3B.2R stores localized structured rich descriptions without deleting legacy text', () => {
  const schema = read(apiRoot, 'prisma/schema.prisma');
  const dto = read(apiRoot, 'src/modules/training/dto/training-content.dto.ts');
  const types = read(typesRoot, 'src/index.ts');
  assert.match(schema, /richDescriptionTranslations\s+Json/);
  assert.match(schema, /rich_description_translations/);
  assert.match(dto, /richDescriptionTranslations/);
  assert.match(types, /LocalizedRichText/);
  assert.match(types, /richDescriptionTranslations/);
  assert.match(schema, /descriptionTranslations\s+Json/);
});

test('3B.2R provides reusable Tiptap RichTextEditor in the UI package', () => {
  const editor = read(uiRoot, 'src/rich-text-editor.tsx');
  const index = read(uiRoot, 'src/index.ts');
  assert.match(editor, /useEditor/);
  assert.match(editor, /StarterKit/);
  assert.match(editor, /immediatelyRender: false/);
  assert.match(editor, /onUploadImage/);
  assert.match(index, /RichTextEditor/);
});

test('3B.2R Course Editor is nested, modal and drag-and-drop based', () => {
  const page = read(
    portalRoot,
    'src/app/(protected)/admin/training/courses/[id]/editor/page.tsx',
  );
  const editor = read(
    portalRoot,
    'src/components/training/course-structure-editor.tsx',
  );
  assert.match(page, /CourseStructureEditor/);
  assert.doesNotMatch(page, /AdminDataTable/);
  assert.match(editor, /DragDropProvider/);
  assert.match(editor, /useSortable/);
  assert.match(editor, /useDroppable/);
  assert.match(editor, /move\(/);
  assert.match(editor, /section-edit/);
  assert.match(editor, /lesson-edit/);
  assert.match(editor, /LocalizedRichTextEditor/);
  assert.match(editor, /persistOrder/);
});

test('3B.2R legacy section and lesson authoring pages route back to the single editor', () => {
  const paths = [
    'src/app/(protected)/admin/training/courses/[id]/sections/new/page.tsx',
    'src/app/(protected)/admin/training/courses/[id]/sections/[sectionId]/page.tsx',
    'src/app/(protected)/admin/training/courses/[id]/sections/[sectionId]/lessons/new/page.tsx',
    'src/app/(protected)/admin/training/courses/[id]/sections/[sectionId]/lessons/[lessonId]/page.tsx',
  ];
  for (const path of paths) {
    const source = read(portalRoot, path);
    assert.match(
      source,
      /redirect\(`\/admin\/training\/courses\/\$\{id\}\/editor`\)/,
    );
  }
});

test('3B.2R fixes private cover delivery and verifies uploaded images', () => {
  const content = read(
    portalRoot,
    'src/app/api/files/[fileId]/content/route.ts',
  );
  const cover = read(
    portalRoot,
    'src/components/training/course-cover-field.tsx',
  );
  assert.match(content, /request\.cookies\.get\(SESSION_COOKIE_NAME\)/);
  assert.doesNotMatch(content, /content-length/);
  assert.match(content, /Authorization: `Bearer \$\{token\}`/);
  assert.match(cover, /const verification = await fetch/);
  assert.match(cover, /verifiedType\.startsWith\("image\/"\)/);
});

test('3B.2R interactive training BFF rejects cross-origin mutations', () => {
  const bff = read(portalRoot, 'src/app/api/training/[...path]/route.ts');
  assert.match(bff, /if \(!isSameOrigin\(request\)\)/);
  assert.match(bff, /SESSION_COOKIE_NAME/);
  assert.match(bff, /\/v1\/training\/\$\{path\}/);
  assert.match(bff, /allowedPath/);
});
