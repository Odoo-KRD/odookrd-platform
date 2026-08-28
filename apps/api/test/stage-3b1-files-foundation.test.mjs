import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');

test('Stage 3B.1 adds a generic scoped file asset model', () => {
  const schema = read('prisma/schema.prisma');
  assert.match(schema, /model FileAsset \{/);
  assert.match(schema, /enum FileAssetKind \{[\s\S]*IMAGE[\s\S]*DOCUMENT[\s\S]*ATTACHMENT/);
  assert.match(schema, /enum FileStorageProvider \{[\s\S]*LOCAL[\s\S]*AWS_S3/);
  assert.match(schema, /accountScope\s+AccountScope/);
  assert.match(schema, /companyId\s+String\?/);
  assert.match(schema, /sha256\s+String/);
});

test('Stage 3B.1 enforces file permissions and company isolation in the API', () => {
  const permissions = read('src/modules/authorization/permissions.ts');
  const controller = read('src/modules/files/files.controller.ts');
  const service = read('src/modules/files/files.service.ts');
  assert.match(permissions, /FILES_READ: 'files\.read'/);
  assert.match(permissions, /FILES_UPLOAD: 'files\.upload'/);
  assert.match(permissions, /FILES_MANAGE: 'files\.manage'/);
  assert.match(controller, /RequirePermissions\(PERMISSIONS\.FILES_UPLOAD\)/);
  assert.match(controller, /RequirePermissions\(PERMISSIONS\.FILES_READ\)/);
  assert.match(controller, /RequirePermissions\(PERMISSIONS\.FILES_MANAGE\)/);
  assert.match(service, /asset\.companyId !== principal\.companyId/);
  assert.match(service, /Cross-company file upload is not allowed/);
});

test('Stage 3B.1 validates real file signatures and deliberately excludes video', () => {
  const validator = read('src/modules/files/file-signature.validator.ts');
  assert.match(validator, /image\/jpeg/);
  assert.match(validator, /image\/png/);
  assert.match(validator, /image\/webp/);
  assert.match(validator, /image\/gif/);
  assert.match(validator, /application\/pdf/);
  assert.doesNotMatch(validator, /video\//);
});

test('Stage 3B.1 has local and private S3 storage adapters', () => {
  const local = read('src/modules/files/storage/local-file-storage.provider.ts');
  const s3 = read('src/modules/files/storage/s3-file-storage.provider.ts');
  const packageJson = read('package.json');
  assert.match(local, /FileStorageProvider\.LOCAL/);
  assert.match(local, /resolveStorageKey/);
  assert.match(s3, /FileStorageProvider\.AWS_S3/);
  assert.match(s3, /PutObjectCommand/);
  assert.match(s3, /GetObjectCommand/);
  assert.doesNotMatch(s3, /ACL:/);
  assert.match(packageJson, /@aws-sdk\/client-s3/);
});

test('Stage 3B.1 migration is atomic and supplies raw-SQL RBAC fields explicitly', () => {
  const migration = read(
    'prisma/migrations/20260826140000_022_shared_file_media_foundation/migration.sql',
  );
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;/);
  assert.match(migration, /\"id\", \"key\", \"name\", \"description\", \"created_at\", \"updated_at\"/);
  assert.match(migration, /gen_random_uuid\(\)/);
  assert.match(migration, /\"id\" UUID NOT NULL,/);
  assert.doesNotMatch(migration, /\"id\" UUID NOT NULL DEFAULT gen_random_uuid/);
});

test('Stage 3B.1 keeps video processing and course editor work outside this substage', () => {
  const module = read('src/modules/files/files.module.ts');
  assert.doesNotMatch(module, /MediaConvert|Transcod|Quiz|RichText|CourseEditor/);
});
