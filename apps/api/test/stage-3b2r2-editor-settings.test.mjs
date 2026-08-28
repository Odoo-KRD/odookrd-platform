import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../../../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');

test('3B.2R.2 provides enterprise image interaction and editor formatting', () => {
  const editor = read('packages/ui/src/rich-text-editor.tsx');
  assert.doesNotMatch(editor, /selectNode/);
  assert.match(editor, /getPos/);
  assert.match(editor, /setNodeSelection/);
  assert.match(editor, /top-left/);
  assert.match(editor, /top-right/);
  assert.match(editor, /bottom-left/);
  assert.match(editor, /bottom-right/);
  assert.match(editor, /data-drag-handle/);
  assert.match(editor, /textAlign/);
  assert.match(editor, /directionRtl/);
  assert.match(editor, /directionLtr/);
  assert.match(editor, /name: "separator"/);
  assert.match(editor, /separatorPrompt/);
  assert.match(editor, /align: "center"/);
});

test('3B.2R.2 groups file types and keeps video generic upload deferred', () => {
  const settings = read(
    'apps/portal/src/components/settings/settings-form.tsx',
  );
  const navigation = read('apps/portal/src/lib/i18n/settings-navigation.ts');
  assert.match(settings, /fileTypeGroups\.images/);
  assert.match(settings, /fileTypeGroups\.documents/);
  assert.match(settings, /fileTypeGroups\.video/);
  assert.match(settings, /Stage 3C\.2/);
  assert.match(navigation, /videoComingSoon/);
  assert.doesNotMatch(settings, /files\.types\.mp4_enabled/);
});

test('3B.2R.2 supports encrypted S3 credentials and a protected connection test', () => {
  const registry = read('apps/api/src/modules/settings/settings.registry.ts');
  const s3 = read(
    'apps/api/src/modules/files/storage/s3-file-storage.provider.ts',
  );
  const controller = read('apps/api/src/modules/files/files.controller.ts');
  const bff = read('apps/portal/src/app/api/files/storage/s3/test/route.ts');
  const actions = read(
    'apps/portal/src/app/(protected)/admin/settings/actions.ts',
  );
  assert.match(registry, /files\.aws_s3\.credential_source/);
  assert.match(registry, /files\.aws_s3\.access_key_id/);
  assert.match(registry, /valueType: 'SECRET'/);
  assert.match(s3, /resolveSecret\('files\.aws_s3\.secret_access_key'\)/);
  assert.match(s3, /connection-tests/);
  assert.match(s3, /PutObjectCommand/);
  assert.match(s3, /GetObjectCommand/);
  assert.match(s3, /DeleteObjectCommand/);
  assert.match(controller, /storage\/s3\/test/);
  assert.match(controller, /PERMISSIONS\.SETTINGS_MANAGE/);
  assert.match(bff, /isSameOrigin\(request\)/);
  assert.match(actions, /files\.aws_s3\.session_token/);
});

test('3B.2R.2 deliberately leaves course attendee management to Stage 3D', () => {
  const editor = read(
    'apps/portal/src/app/(protected)/admin/training/courses/[id]/editor/page.tsx',
  );
  assert.doesNotMatch(editor, /Manage Attendees|manage-attendees|attendees/);
});
