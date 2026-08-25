import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(`${root}/${path}`, 'utf8');

const [
  service,
  catalogController,
  assignmentController,
  batchIds,
  users,
  companies,
  settingsRegistry,
  settingsTests,
] = await Promise.all([
  read('src/modules/services/services.service.ts'),
  read('src/modules/services/services.controller.ts'),
  read('src/modules/services/service-assignments.controller.ts'),
  read('src/common/batch/batch-mutation.dto.ts'),
  read('src/modules/users/users.service.ts'),
  read('src/modules/companies/companies.service.ts'),
  read('src/modules/settings/settings.registry.ts'),
  read('src/modules/settings/settings.service.spec.ts'),
]);

test('existing settings preference fixtures use an approved production font', () => {
  const definition = settingsRegistry.match(
    /key:\s*'theme\.default_font'[\s\S]*?allowedValues:\s*\[([\s\S]*?)\]/,
  );
  const preference = settingsTests.match(
    /key:\s*'theme\.default_font',\s*value:\s*'([^']+)'/,
  );

  assert.ok(
    definition,
    'The existing theme font registry must remain defined.',
  );
  assert.ok(
    preference,
    'The existing company preference test must exercise a font override.',
  );
  assert.match(definition[1], new RegExp(`'${preference[1]}'`));
});

test('batch mutations require bounded, unique UUID selections and remain atomic', () => {
  assert.match(batchIds, /@ArrayMinSize\(1\)/);
  assert.match(batchIds, /@ArrayMaxSize\(100\)/);
  assert.match(batchIds, /@ArrayUnique\(\)/);
  assert.match(batchIds, /@IsUUID\('all', \{ each: true \}\)/);

  for (const source of [users, companies]) {
    assert.match(
      source,
      /async updateStatuses\([\s\S]*?return this\.prisma\.\$transaction\(async \(tx\) =>/,
    );
  }

  assert.match(users, /assertNotLastActiveAdmin/);
  assert.match(users, /principal\.userId/);
  assert.match(
    service,
    /async updateServiceStatuses\([\s\S]*?this\.prisma\.\$transaction/,
  );
  assert.match(
    service,
    /async transitionAssignments\([\s\S]*?this\.prisma\.\$transaction/,
  );
});

test('feature catalog endpoints are nested under a service and platform protected', () => {
  assert.match(catalogController, /@Get\(':serviceId\/features'\)/);
  assert.match(catalogController, /@Post\(':serviceId\/features'\)/);
  assert.match(catalogController, /@Post\(':serviceId\/features\/reorder'\)/);
  assert.match(
    catalogController,
    /@Patch\(':serviceId\/features\/:featureId'\)/,
  );

  const managementChecks = catalogController.match(
    /@RequirePermissions\(PERMISSIONS\.SERVICES_MANAGE\)/g,
  );
  assert.ok((managementChecks?.length ?? 0) >= 9);
  assert.match(service, /prohibitedMonetaryUnit/);
  assert.match(service, /assertValidFeatureValue/);
});

test('assignment snapshots are atomic and later catalog sync preserves existing values', () => {
  assert.match(
    service,
    /async createAssignment\([\s\S]*?transaction\.companyService\.create\([\s\S]*?transaction\.serviceFeature\.findMany\([\s\S]*?transaction\.companyServiceFeature\.createMany/,
  );
  assert.match(
    service,
    /async syncAssignmentFeatures\([\s\S]*?transaction\.companyServiceFeature\.findMany\([\s\S]*?transaction\.companyServiceFeature\.createMany/,
  );
  assert.match(service, /CompanyServiceFeatureSource\.ADMIN_OVERRIDE/);
  assert.match(service, /CompanyServiceFeatureSource\.CATALOG_DEFAULT/);
});

test('company feature reads first enforce ownership and redact operator-only fields', () => {
  assert.match(
    service,
    /async listAssignmentFeatures\([\s\S]*?await this\.getAssignment\(principal, assignmentId\)/,
  );
  assert.match(service, /customerVisibleOverride: true/);
  assert.match(service, /serviceFeature: \{ customerVisible: true \}/);
  assert.match(
    service,
    /presentAssignmentFeature\([\s\S]*?AccountScope\.PLATFORM/,
  );
  assert.match(
    assignmentController,
    /@Get\(':id\/features'\)\s+@RequirePermissions\(PERMISSIONS\.SERVICES_READ\)/,
  );
  assert.match(
    assignmentController,
    /@Patch\(':id\/features\/:featureId'\)\s+@RequirePermissions\(PERMISSIONS\.SERVICES_MANAGE\)/,
  );
});

test('lifecycle transitions validate the state graph and append scoped history plus audit', () => {
  assert.match(service, /\[CompanyServiceStatus\.CANCELLED\]: \[\]/);
  assert.match(service, /assertAllowedTransition/);
  assert.match(service, /recordLifecycleTransition/);
  assert.match(service, /transaction\.companyServiceLifecycleEvent\.create/);
  assert.match(service, /transaction\.auditLog\.create/);
  assert.match(
    assignmentController,
    /@Get\(':id\/history'\)\s+@RequirePermissions\(PERMISSIONS\.SERVICES_READ\)/,
  );
  assert.match(
    assignmentController,
    /@Post\(':id\/transitions'\)\s+@RequirePermissions\(PERMISSIONS\.SERVICES_MANAGE\)/,
  );
});
