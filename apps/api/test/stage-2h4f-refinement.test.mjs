import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(`${root}/${path}`, 'utf8');

const [
  schema,
  migration,
  controller,
  catalogController,
  service,
  localization,
] = await Promise.all([
  read('prisma/schema.prisma'),
  read(
    'prisma/migrations/20260825120000_017_service_feature_definitions/migration.sql',
  ),
  read('src/modules/services/service-feature-definitions.controller.ts'),
  read('src/modules/services/services.controller.ts'),
  read('src/modules/services/services.service.ts'),
  read('src/i18n/localized-content.ts'),
]);

test('predefined service features are additive, typed, multilingual, and category-specific', () => {
  assert.match(schema, /model ServiceFeatureDefinition \{/);
  assert.match(schema, /category\s+ServiceCategory/);
  assert.match(schema, /parameterLabelTranslations\s+Json/);
  assert.match(schema, /definitionId\s+String\?/);
  assert.match(schema, /@@unique\(\[serviceId, definitionId\]/);
  assert.match(migration, /CREATE TABLE "service_feature_definitions"/);
  assert.match(migration, /ADD COLUMN "definition_id" UUID/);
  assert.match(migration, /ON DELETE RESTRICT/);
  assert.match(migration, /non_monetary_unit_check/);
  assert.doesNotMatch(migration, /DROP\s+(TABLE|COLUMN)|TRUNCATE\b/i);
  assert.doesNotMatch(
    migration,
    /CREATE TABLE "(?:prices|payments|subscriptions|invoices|orders)"/i,
  );
});

test('feature definition routes and service attachment require platform management permissions', () => {
  assert.match(controller, /@Controller\('service-feature-definitions'\)/);
  assert.match(
    controller,
    /@UseGuards\(AuthenticatedGuard, AuthorizationGuard\)/,
  );
  const permissionChecks = controller.match(
    /@RequirePermissions\(PERMISSIONS\.SERVICES_MANAGE\)/g,
  );
  assert.equal(permissionChecks?.length, 4);
  assert.match(catalogController, /@Post\(':serviceId\/features\/attach'\)/);
  assert.match(
    service,
    /async attachFeatureDefinition\([\s\S]*?this\.assertPlatformAdministrator\(principal\)/,
  );
});

test('feature attachment rejects inactive definitions, category mismatches, and duplicates', () => {
  assert.match(service, /definition\.status !== ServiceFeatureStatus\.ACTIVE/);
  assert.match(service, /definition\.category !== service\.category/);
  assert.match(
    service,
    /OR:\s*\[\{ definitionId: definition\.id \}, \{ key: definition\.key \}\]/,
  );
  assert.match(service, /definitionId: definition\.id/);
});

test('linked definition edits preserve service defaults and existing customer entitlements', () => {
  assert.match(service, /existing\._count\.serviceFeatures > 0/);
  assert.match(service, /category !== existing\.category/);
  assert.match(service, /valueType !== existing\.valueType/);
  assert.match(service, /unit !== existing\.unit/);
  assert.match(
    service,
    /transaction\.serviceFeature\.updateMany\(\{\s*where: \{ definitionId \},\s*data: metadata,/,
  );
  assert.doesNotMatch(
    service,
    /transaction\.companyServiceFeature\.updateMany\(\{\s*where: \{ definitionId \}/,
  );
  assert.match(
    localization,
    /\['parameterLabel', 'parameterLabelTranslations'\]/,
  );
});
