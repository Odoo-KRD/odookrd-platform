import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const schema = await readFile(`${root}/prisma/schema.prisma`, 'utf8');
const featureMigration = await readFile(
  `${root}/prisma/migrations/20260824143000_014_service_features/migration.sql`,
  'utf8',
);
const assignmentMigration = await readFile(
  `${root}/prisma/migrations/20260824143100_015_company_service_features/migration.sql`,
  'utf8',
);
const lifecycleMigration = await readFile(
  `${root}/prisma/migrations/20260824143200_016_company_service_lifecycle/migration.sql`,
  'utf8',
);

test('service capabilities use typed multilingual catalog definitions', () => {
  assert.match(
    schema,
    /enum ServiceFeatureValueType\s*\{[\s\S]*?BOOLEAN[\s\S]*?NUMBER[\s\S]*?TEXT/,
  );
  assert.match(
    schema,
    /model ServiceFeature\s*\{[\s\S]*?serviceId[\s\S]*?defaultValue[\s\S]*?customerVisible/,
  );
  assert.match(
    featureMigration,
    /UNIQUE INDEX "service_features_service_id_key_unique"/,
  );
  assert.match(
    featureMigration,
    /odookrd_valid_localized_text\("name_translations", 200\)/,
  );
  assert.match(featureMigration, /jsonb_typeof\("default_value"\) = 'boolean'/);
  assert.match(featureMigration, /jsonb_typeof\("default_value"\) = 'number'/);
  assert.match(featureMigration, /jsonb_typeof\("default_value"\) = 'string'/);
});

test('assignment feature snapshots preserve ownership and non-destructive references', () => {
  assert.match(
    schema,
    /model CompanyServiceFeature\s*\{[\s\S]*?companyServiceId[\s\S]*?serviceFeatureId/,
  );
  assert.match(
    assignmentMigration,
    /"company_service_id"\) REFERENCES "company_services"[\s\S]*?ON DELETE CASCADE/,
  );
  assert.match(
    assignmentMigration,
    /"service_feature_id"\) REFERENCES "service_features"[\s\S]*?ON DELETE RESTRICT/,
  );
  assert.match(
    assignmentMigration,
    /company_service_features_assignment_feature_unique/,
  );
});

test('lifecycle history is additive, scoped, indexed, and backfilled', () => {
  assert.match(
    schema,
    /model CompanyServiceLifecycleEvent\s*\{[\s\S]*?companyServiceId[\s\S]*?companyId/,
  );
  assert.match(
    lifecycleMigration,
    /INSERT INTO "company_service_lifecycle_events"/,
  );
  assert.match(
    lifecycleMigration,
    /assignment\."status", 'SYSTEM', assignment\."created_at"/,
  );
  assert.match(lifecycleMigration, /'\{"backfilled": true\}'::jsonb/);
  assert.match(
    lifecycleMigration,
    /company_service_lifecycle_company_effective_idx/,
  );
});

test('service foundation does not introduce Stage 9 commercial models or columns', () => {
  const additions = [
    featureMigration,
    assignmentMigration,
    lifecycleMigration,
  ].join('\n');
  assert.doesNotMatch(
    additions,
    /(?:CREATE TABLE|ADD COLUMN)\s+"?(?:prices?|service_plans?|checkout|orders?|payments?|invoices?|subscriptions?)\b/i,
  );
  assert.match(featureMigration, /service_features_non_monetary_unit_check/);
});
