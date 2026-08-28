import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workspaceRoot = new URL('../../../', import.meta.url);
const apiRoot = new URL('apps/api/', workspaceRoot);
const portalRoot = new URL('apps/portal/', workspaceRoot);
const readApi = (path) => fs.readFileSync(new URL(path, apiRoot), 'utf8');
const readPortal = (path) => fs.readFileSync(new URL(path, portalRoot), 'utf8');

test('3B.2R-A contract resolves both workspaces from the monorepo root', () => {
  assert.equal(new URL('.', apiRoot).pathname.endsWith('/apps/api/'), true);
  assert.equal(
    new URL('.', portalRoot).pathname.endsWith('/apps/portal/'),
    true,
  );
});

test('3B.2R-A activates real AdminDataTable multi-selection and batch actions', () => {
  for (const path of [
    'src/app/(protected)/admin/training/categories/page.tsx',
    'src/app/(protected)/admin/training/courses/page.tsx',
  ]) {
    const page = readPortal(path);
    assert.match(page, /AdminDataTable/);
    assert.match(page, /\bselectable\b/);
    assert.match(page, /batchAction=/);
    assert.match(page, /batchActions=/);
    assert.match(page, /searchEnabled=\{false\}/);
  }
});

test('3B.2R-A adds transactional batch lifecycle API endpoints', () => {
  const controller = readApi('src/modules/training/training.controller.ts');
  const service = readApi('src/modules/training/training.service.ts');
  assert.match(controller, /categories\/batch-status/);
  assert.match(controller, /courses\/batch-status/);
  assert.match(service, /batchCategoryStatus/);
  assert.match(service, /batchCourseStatus/);
  assert.match(service, /\$transaction/);
  assert.match(service, /changedIds/);
  assert.match(service, /Duplicate identifiers are not allowed/);
});

test('3B.2R-A integrates course covers with the shared FileAsset foundation', () => {
  const schema = readApi('prisma/schema.prisma');
  const migration = readApi(
    'prisma/migrations/20260826213000_023_training_enterprise_admin/migration.sql',
  );
  const service = readApi('src/modules/training/training.service.ts');
  const actions = readPortal('src/app/(protected)/admin/training/actions.ts');
  const form = readPortal('src/components/training/training-forms.tsx');

  assert.match(schema, /coverImageAssetId\s+String\?/);
  assert.match(schema, /TrainingCourseCoverImage/);
  assert.match(migration, /cover_image_asset_id/);
  assert.match(service, /FileAssetKind\.IMAGE/);
  assert.match(service, /FileAssetStatus\.READY/);
  assert.match(actions, /coverImageAssetId/);
  assert.match(form, /CourseCoverField/);
  assert.doesNotMatch(form, /name="thumbnailUrl"/);
});

test('3B.2R-A keeps binary uploads out of Server Actions and behind authenticated BFF routes', () => {
  const actions = readPortal('src/app/(protected)/admin/training/actions.ts');
  const cover = readPortal('src/components/training/course-cover-field.tsx');
  const upload = readPortal('src/app/api/files/upload/route.ts');
  const content = readPortal('src/app/api/files/[fileId]/content/route.ts');

  assert.doesNotMatch(actions, /instanceof File/);
  assert.match(cover, /fetch\("\/api\/files\/upload"/);
  assert.match(cover, /name="coverImageAssetId"/);
  assert.match(upload, /if \(!isSameOrigin\(request\)\)/);
  assert.match(upload, /SESSION_COOKIE_NAME/);
  assert.match(upload, /new URL\("\/v1\/files"/);
  assert.match(content, /getSessionToken/);
  assert.match(
    content,
    /\/v1\/files\/\$\{encodeURIComponent\(fileId\)\}\/content/,
  );
});

test('3B.2R-A preserves the dedicated Course Editor boundary for repair batch B', () => {
  const editor = readPortal(
    'src/app/(protected)/admin/training/courses/[id]/editor/page.tsx',
  );
  const packageJson = readPortal('package.json');
  assert.match(editor, /AdminDataTable/);
  assert.doesNotMatch(packageJson, /@dnd-kit\/react/);
});
