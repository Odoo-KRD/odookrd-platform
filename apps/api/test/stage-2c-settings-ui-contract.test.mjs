import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(apiRoot, '../..');

function readApi(path) {
  return readFileSync(join(apiRoot, path), 'utf8');
}

function readRepository(path) {
  return readFileSync(join(repositoryRoot, path), 'utf8');
}

const publicController = readApi(
  'src/modules/settings/settings-public.controller.ts',
);
const settingsService = readApi('src/modules/settings/settings.service.ts');
const settingsRegistry = readApi('src/modules/settings/settings.registry.ts');
const usersService = readApi('src/modules/users/users.service.ts');
const migration = readApi(
  'prisma/migrations/20260821220000_006_company_user_limit/migration.sql',
);
const portalAction = readRepository(
  'apps/portal/src/app/(protected)/admin/settings/actions.ts',
);
const settingsForm = readRepository(
  'apps/portal/src/components/settings/settings-form.tsx',
);

test('public branding exposes only an explicit non-secret allowlist', () => {
  assert.match(publicController, /@Controller\(['"]settings\/public['"]\)/);
  assert.match(publicController, /settingsService\.listPublic\(\)/);
  assert.doesNotMatch(
    publicController,
    /resolveSecret|encryptedValue|principal/,
  );
  assert.match(
    settingsService,
    /return\s*\{\s*siteTitle,\s*defaultLocale,\s*defaultFont\s*\}/,
  );
  assert.doesNotMatch(
    settingsService.match(/async listPublic[\s\S]*?\n\s*}\n/)?.[0] ?? '',
    /notifications\.|secret|credential|token/i,
  );
});

test('settings writes stay server-side and accept only registered keys', () => {
  assert.match(portalAction, /['"]use server['"]/);
  assert.match(portalAction, /SETTING_KEYS_BY_CATEGORY/);
  assert.match(
    portalAction,
    /getAdminApiContext\(\s*PERMISSIONS\.SETTINGS_MANAGE,?\s*\)/,
  );
  assert.match(portalAction, /apiRequest<SettingsCollection>/);
  assert.doesNotMatch(settingsForm, /ODOOKRD_API_URL|Authorization:\s*Bearer/);
});

test('provider secrets remain blank, masked, and explicitly clearable', () => {
  assert.match(
    settingsForm,
    /type=\{setting\.isSecret\s*\?\s*['"]password['"]/,
  );
  assert.match(
    settingsForm,
    /defaultValue=\{\s*setting\.isSecret\s*\?\s*['"]{2}\s*:/,
  );
  assert.match(settingsForm, /clear\./);
  assert.match(settingsForm, /setting\.configured/);
  assert.doesNotMatch(settingsForm, /encryptedValue/);
});

test('font choices and future settings categories remain registry-driven', () => {
  assert.match(settingsRegistry, /key:\s*['"]theme\.default_font['"]/);
  assert.match(settingsRegistry, /allowedValues:\s*\[/);
  for (const category of [
    'general',
    'theme',
    'companies',
    'notifications',
    'helpdesk',
    'trainings',
  ]) {
    assert.match(
      settingsRegistry,
      new RegExp('category:\\s*[\'"]' + category + '[\'"]'),
    );
  }
});

test('company user quotas have a friendly precheck and a concurrent database guard', () => {
  const precheck = usersService.indexOf(
    'await this.assertCompanyUserCapacity(target.companyId)',
  );
  const create = usersService.indexOf('transaction.user.create');
  assert.ok(precheck >= 0);
  assert.ok(create < 0 || precheck < create);
  assert.match(usersService, /this\.prisma\.user\.count/);
  assert.match(usersService, /ConflictException/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /BEFORE INSERT OR UPDATE OF/);
  assert.match(migration, /Company user limit reached/);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE)\s+TABLE\b/i);
});
