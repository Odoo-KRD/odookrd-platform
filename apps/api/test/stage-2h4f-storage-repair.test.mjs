import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(`${root}/${path}`, 'utf8');

const [schema, enumMigration, constraintMigration, service] = await Promise.all(
  [
    read('prisma/schema.prisma'),
    read(
      'prisma/migrations/20260825143000_018_storage_feature_value_type/migration.sql',
    ),
    read(
      'prisma/migrations/20260825143100_019_storage_feature_constraints/migration.sql',
    ),
    read('src/modules/services/services.service.ts'),
  ],
);

test('Storage is a committed enum value before constraints use it', () => {
  assert.match(
    schema,
    /enum ServiceFeatureValueType\s*\{[\s\S]*?BOOLEAN[\s\S]*?NUMBER[\s\S]*?STORAGE[\s\S]*?TEXT/,
  );
  assert.match(enumMigration, /ADD VALUE IF NOT EXISTS 'STORAGE'/);
  assert.doesNotMatch(enumMigration, /ALTER TABLE|DROP CONSTRAINT/);
  assert.match(constraintMigration, /"value_type" = 'STORAGE'/g);
});

test('Storage remains numeric and accepts only null, MB, GB, or TB units', () => {
  const storageChecks = constraintMigration.match(
    /"value_type" = 'STORAGE'[\s\S]*?"unit" IS NULL OR "unit" IN \('MB', 'GB', 'TB'\)/g,
  );
  assert.equal(storageChecks?.length, 2);
  assert.match(service, /const storageUnits = new Set\(\['MB', 'GB', 'TB'\]\)/);
  assert.match(service, /ServiceFeatureValueType\.STORAGE/);
  assert.match(service, /Storage feature units must be MB, GB, TB, or empty/);
});

test('empty translated DTO fields no longer reject numeric feature values', () => {
  assert.match(
    service,
    /Object\.values\(translations\)\.some\([\s\S]*?typeof translation === 'string'[\s\S]*?translation\.trim\(\)\.length > 0/,
  );
  assert.doesNotMatch(service, /Object\.keys\(translations\)\.length > 0/);
});

test('storage migrations remain non-commercial and preserve all feature rows', () => {
  const migrations = `${enumMigration}\n${constraintMigration}`;
  assert.doesNotMatch(
    migrations,
    /DELETE FROM|TRUNCATE|DROP TABLE|DROP COLUMN/i,
  );
  assert.doesNotMatch(
    migrations,
    /CREATE TABLE "(?:prices|payments|subscriptions|invoices|orders)"/i,
  );
});
