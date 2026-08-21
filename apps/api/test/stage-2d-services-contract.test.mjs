import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(apiRoot, '../..');

function read(path) {
  return readFileSync(join(apiRoot, path), 'utf8');
}

const schema = read('prisma/schema.prisma');
const migration = read(
  'prisma/migrations/20260822010000_007_services_management/migration.sql',
);
const seed = read('prisma/seed.ts');
const service = read('src/modules/services/services.service.ts');
const serviceController = read('src/modules/services/services.controller.ts');
const assignmentController = read(
  'src/modules/services/service-assignments.controller.ts',
);
const assignmentDto = read(
  'src/modules/services/dto/service-assignment.dto.ts',
);
const apiPermissions = read('src/modules/authorization/permissions.ts');
const sharedTypes = readFileSync(
  join(repositoryRoot, 'packages/types/src/index.ts'),
  'utf8',
);

test('service models preserve additive company ownership and durable status enums', () => {
  assert.match(schema, /enum\s+ServiceCategory\s*\{/);
  assert.match(schema, /enum\s+ServiceCatalogStatus\s*\{/);
  assert.match(schema, /enum\s+CompanyServiceStatus\s*\{/);
  assert.match(schema, /model\s+Service\s*\{/);
  assert.match(schema, /model\s+CompanyService\s*\{/);
  assert.match(schema, /serviceAssignments\s+CompanyService\[\]/);
  assert.match(schema, /@@index\(\[companyId,\s*status\]/);
  assert.match(migration, /REFERENCES\s+"companies"\s*\("id"\)/i);
  assert.match(migration, /REFERENCES\s+"services"\s*\("id"\)/i);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE)\s+TABLE\b/i);
});

test('service keys, HTTPS links, and date ordering are protected in PostgreSQL', () => {
  assert.match(migration, /services_key_format_check/);
  assert.match(migration, /company_services_dates_check/);
  assert.match(migration, /company_services_url_https_check/);
  assert.match(assignmentDto, /protocols:\s*\[['"]https['"]\]/);
  assert.match(service, /startsAt\.getTime\(\)\s*>\s*expiresAt\.getTime\(\)/);
});

test('platform management and company service viewing have distinct permissions', () => {
  for (const source of [apiPermissions, sharedTypes]) {
    assert.match(source, /SERVICES_READ:\s*['"]services\.read['"]/);
    assert.match(source, /SERVICES_MANAGE:\s*['"]services\.manage['"]/);
  }

  for (const roleKey of ['company_admin', 'company_user']) {
    const role = seed.match(
      new RegExp(
        'key:\\s*[\'"]' +
          roleKey +
          '[\'"][\\s\\S]*?permissions:\\s*\\[([\\s\\S]*?)\\]',
      ),
    );
    assert.ok(role, roleKey + ' role is required');
    assert.match(role[1], /['"]services\.read['"]/);
    assert.doesNotMatch(role[1], /['"]services\.manage['"]/);
  }

  const platform = seed.match(
    /key:\s*['"]platform_admin['"][\s\S]*?permissions:\s*\[([\s\S]*?)\]/,
  );
  assert.ok(platform);
  assert.match(platform[1], /['"]services\.manage['"]/);
});

test('catalog mutation routes require platform service-management permission', () => {
  assert.match(
    serviceController,
    /@UseGuards\(AuthenticatedGuard,\s*AuthorizationGuard\)/,
  );
  const managementChecks = serviceController.match(
    /@RequirePermissions\(PERMISSIONS\.SERVICES_MANAGE\)/g,
  );
  assert.equal(managementChecks?.length, 4);
  assert.match(
    service,
    /principal\.accountScope\s*!==\s*AccountScope\.PLATFORM/,
  );
});

test('company service reads are authenticated, permission checked, and scoped', () => {
  assert.match(
    assignmentController,
    /@UseGuards\(AuthenticatedGuard,\s*AuthorizationGuard\)/,
  );
  assert.match(
    assignmentController,
    /@RequirePermissions\(PERMISSIONS\.SERVICES_READ\)/,
  );
  assert.match(
    assignmentController,
    /@RequirePermissions\(PERMISSIONS\.SERVICES_MANAGE\)/,
  );
  assert.match(service, /resolveCompanyScope\(principal,\s*query\.companyId\)/);
  assert.match(
    service,
    /authorization\.assertCompanyAccess\(principal,\s*assignment\.companyId\)/,
  );
  assert.match(
    service,
    /authorization\.assertCompanyAccess\(principal,\s*requestedCompanyId\)/,
  );
});

test('internal operator notes are never returned to a company account', () => {
  assert.match(schema, /internalNotes\s+String\?/);
  assert.match(
    service,
    /const\s*\{\s*internalNotes,\s*\.\.\.visible\s*\}\s*=\s*record/,
  );
  assert.match(
    service,
    /principal\.accountScope\s*===\s*AccountScope\.PLATFORM[\s\S]*?return\s*\{\s*\.\.\.visible,\s*internalNotes\s*\}/,
  );
  assert.match(service, /return\s+visible;/);
});

test('service and assignment mutations create company-scoped audit records', () => {
  for (const action of [
    'service.created',
    'service.updated',
    'service.assignment.created',
    'service.assignment.updated',
  ]) {
    assert.match(service, new RegExp(action.replaceAll('.', '\\.')));
  }

  assert.match(service, /companyId:\s*created\.companyId/);
  assert.match(service, /companyId:\s*previous\.companyId/);
});

test('inactive services and inactive companies cannot receive new assignments', () => {
  assert.match(service, /company\.status\s*!==\s*CompanyStatus\.ACTIVE/);
  assert.match(service, /service\.status\s*!==\s*ServiceCatalogStatus\.ACTIVE/);
});
