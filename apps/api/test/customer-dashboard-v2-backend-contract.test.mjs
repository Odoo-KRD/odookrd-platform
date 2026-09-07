import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(path, 'utf8');

test('Customer Dashboard V2 profile endpoints are authenticated and self-scoped without directory permission coupling', () => {
  const controller = read(
    'apps/api/src/modules/workspace/workspace.controller.ts',
  );
  const service = read('apps/api/src/modules/workspace/workspace.service.ts');

  assert.match(controller, /@Patch\('profile'\)/);
  assert.match(controller, /@Put\('profile\/avatar'\)/);
  assert.match(controller, /@Delete\('profile\/avatar'\)/);
  assert.match(controller, /@Get\('profile\/avatar'\)/);

  const profileBlock = controller.slice(
    controller.indexOf("@Get('profile')"),
    controller.indexOf("@Patch('profile')"),
  );
  assert.doesNotMatch(profileBlock, /COMPANIES_READ/);

  assert.match(
    service,
    /id: principal\.userId,[\s\S]*companyId,[\s\S]*accountScope: AccountScope\.COMPANY/,
  );
  assert.match(service, /AVATAR_MIME_TYPES/);
  assert.match(service, /detectSupportedFile\(file\.buffer\)/);
  assert.match(service, /\.resize\(512, 512,/);
});

test('Customer Dashboard V2 training summary remains permission and entitlement scoped', () => {
  const controller = read(
    'apps/api/src/modules/training/training-dashboard.controller.ts',
  );
  const service = read(
    'apps/api/src/modules/training/training-dashboard.service.ts',
  );

  assert.match(controller, /@Get\('dashboard-summary'\)/);
  assert.match(
    controller,
    /@RequirePermissions\(PERMISSIONS\.TRAINING_READ\)/,
  );
  assert.match(service, /resolveCustomerContext\(principal\)/);
  assert.match(service, /customerCourseWhere\(context\)/);
  assert.match(service, /getCourseForContext/);
  assert.match(service, /trainingCourseCompletion\.findMany/);
});

test('Customer Dashboard V2 migration is additive and links avatars to FileAsset', () => {
  const schema = read('apps/api/prisma/schema.prisma');
  const migration = read(
    'apps/api/prisma/migrations/20260905150000_034_customer_dashboard_v2_profile/migration.sql',
  );

  assert.match(schema, /displayName\s+String\?/);
  assert.match(schema, /avatarFileAssetId\s+String\?/);
  assert.match(schema, /@relation\("UserAvatarFileAsset"/);
  assert.match(migration, /ADD COLUMN "display_name"/);
  assert.match(migration, /ADD COLUMN "avatar_file_asset_id"/);
  assert.match(migration, /ON DELETE SET NULL/);
});
