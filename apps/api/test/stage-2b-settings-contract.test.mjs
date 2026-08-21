import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(apiRoot, '../..');

function read(relativePath) {
  return readFileSync(join(apiRoot, relativePath), 'utf8');
}

const schema = read('prisma/schema.prisma');
const migration = read(
  'prisma/migrations/20260821170000_005_settings_foundation/migration.sql',
);
const seed = read('prisma/seed.ts');
const registry = read('src/modules/settings/settings.registry.ts');
const service = read('src/modules/settings/settings.service.ts');
const controller = read('src/modules/settings/settings.controller.ts');
const crypto = read('src/modules/settings/settings-crypto.service.ts');
const apiPermissions = read('src/modules/authorization/permissions.ts');
const sharedPermissions = readFileSync(
  join(repositoryRoot, 'packages/types/src/index.ts'),
  'utf8',
);

test('settings persistence enforces platform/company scope and secret separation', () => {
  assert.match(schema, /enum\s+SettingScope\s*\{/);
  assert.match(schema, /model\s+Setting\s*\{/);
  assert.match(schema, /@@unique\(\[scopeKey,\s*key\]/);
  assert.match(schema, /company\s+Company\?/);
  assert.match(migration, /settings_scope_context_check/);
  assert.match(migration, /settings_secret_storage_check/);
  assert.match(migration, /"encrypted_value"\s+IS\s+NOT\s+NULL/i);
  assert.match(migration, /"value"\s+IS\s+NULL/i);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE)\s+TABLE\b/i);
});

test('settings permissions are explicit and excluded from ordinary company users', () => {
  for (const source of [apiPermissions, sharedPermissions]) {
    assert.match(source, /SETTINGS_READ:\s*['"]settings\.read['"]/);
    assert.match(source, /SETTINGS_MANAGE:\s*['"]settings\.manage['"]/);
  }

  for (const roleKey of ['platform_admin', 'company_admin']) {
    const role = seed.match(
      new RegExp(
        'key:\\s*[\'"]' +
          roleKey +
          '[\'"][\\s\\S]*?permissions:\\s*\\[([\\s\\S]*?)\\]',
      ),
    );
    assert.ok(role, roleKey + ' seed must exist');
    assert.match(role[1], /['"]settings\.read['"]/);
    assert.match(role[1], /['"]settings\.manage['"]/);
  }

  const userRole = seed.match(
    /key:\s*['"]company_user['"][\s\S]*?permissions:\s*\[([\s\S]*?)\]/,
  );
  assert.ok(userRole);
  assert.doesNotMatch(userRole[1], /settings\./);
});

test('AES-256-GCM secrets are randomized and bound to their exact setting context', () => {
  assert.match(crypto, /['"]aes-256-gcm['"]/);
  assert.match(crypto, /randomBytes\(12\)/);
  assert.match(crypto, /\.setAAD\(/);
  assert.match(crypto, /\.getAuthTag\(\)/);
  assert.match(crypto, /\.setAuthTag\(/);
  assert.match(service, /scopeKey\s*\+\s*['"]:['"]\s*\+\s*definition\.key/);
});

test('provider secrets are platform-only while company quotas remain platform-managed', () => {
  for (const key of [
    'notifications.email.amazon_ses.access_key_id',
    'notifications.email.amazon_ses.secret_access_key',
    'notifications.whatsapp.access_token',
  ]) {
    const escaped = key.replaceAll('.', '\\.');
    const definition = registry.match(
      new RegExp(
        'key:\\s*[\'"]' + escaped + '[\'"]([\\s\\S]*?)(?=\\n\\s*\\},)',
      ),
    );
    assert.ok(definition, key + ' must be registered');
    assert.match(definition[1], /valueType:\s*['"]SECRET['"]/);
    assert.match(definition[1], /companyVisible:\s*false/);
    assert.match(definition[1], /companyWritable:\s*false/);
  }

  const limit = registry.match(
    /key:\s*['"]companies\.max_users_per_company['"]([\s\S]*?)(?=\n\s*\},)/,
  );
  assert.ok(limit);
  assert.match(limit[1], /companyOverridable:\s*true/);
  assert.match(limit[1], /companyWritable:\s*false/);
});

test('settings routes require authentication, permission checks, and company scoping', () => {
  assert.match(
    controller,
    /@UseGuards\(AuthenticatedGuard,\s*AuthorizationGuard\)/,
  );
  assert.match(controller, /@RequirePermissions\(PERMISSIONS\.SETTINGS_READ\)/);
  assert.match(
    controller,
    /@RequirePermissions\(PERMISSIONS\.SETTINGS_MANAGE\)/,
  );
  assert.match(controller, /company\/:companyId/);
  assert.match(service, /authorization\.assertCompanyAccess/);
  assert.match(service, /value:\s*isSecret\s*\?\s*null/);
  assert.match(service, /action:\s*['"]settings\.updated['"]/);
  assert.match(service, /metadata:\s*\{\s*scope,\s*keys,/);
});

test('the generic registry already reserves all approved future settings categories', () => {
  for (const category of [
    'general',
    'theme',
    'companies',
    'notifications',
    'helpdesk',
    'trainings',
  ]) {
    assert.match(
      registry,
      new RegExp('category:\\s*[\'"]' + category + '[\'"]'),
    );
  }
});
