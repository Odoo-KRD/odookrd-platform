import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(apiRoot, '../..');

function source(relativePath) {
  return readFileSync(join(apiRoot, relativePath), 'utf8');
}

const schema = source('prisma/schema.prisma');
const migration = source(
  'prisma/migrations/20260822060000_008_multilingual_content/migration.sql',
);
const companyService = source('src/modules/companies/companies.service.ts');
const servicesService = source('src/modules/services/services.service.ts');
const helper = source('src/i18n/localized-content.ts');
const setup = source('src/app.setup.ts');
const shared = readFileSync(
  join(repositoryRoot, 'packages/types/src/index.ts'),
  'utf8',
);

test('multilingual content is additive and existing production values are backfilled', () => {
  for (const field of [
    'name_translations',
    'description_translations',
    'display_name_translations',
  ]) {
    assert.match(schema, new RegExp(field));
    assert.match(migration, new RegExp('ADD COLUMN "' + field + '"'));
  }

  assert.match(migration, /jsonb_build_object\('ku', "name"\)/);
  assert.match(migration, /jsonb_build_object\('ku', "description"\)/);
  assert.match(migration, /jsonb_build_object\('ku', "display_name"\)/);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE)\s+TABLE\b/i);
  assert.doesNotMatch(migration, /DROP\s+COLUMN/i);
});

test('PostgreSQL protects language maps, nonblank values, and field limits', () => {
  assert.match(migration, /odookrd_valid_localized_text/);
  assert.match(migration, /jsonb_typeof\(translations\) <> 'object'/);
  assert.match(
    migration,
    /char_length\(entry\.value #>> '\{\}'\) > maximum_length/,
  );
  assert.match(migration, /companies_name_translations_check/);
  assert.match(migration, /services_description_translations_check/);
  assert.match(migration, /company_services_display_name_translations_check/);
});

test('company and service translations stay inside existing scoped transactions', () => {
  assert.match(companyService, /\.company\.create\(/);
  assert.match(companyService, /\.company\.update\(/);
  assert.match(companyService, /normalizeLocalizedText/);
  assert.match(companyService, /principal\.companyId\s*!==\s*companyId/);
  assert.match(servicesService, /transaction\.service\.create\(/);
  assert.match(servicesService, /transaction\.companyService\.update\(/);
  assert.match(servicesService, /authorization\.assertCompanyAccess/);
  assert.match(
    servicesService,
    /const\s*\{\s*internalNotes,\s*\.\.\.visible\s*\}\s*=\s*record/,
  );
});

test('strict nested DTO validation rejects unknown languages and oversized values', () => {
  const localizedDto = source('src/i18n/localized-content.dto.ts');

  for (const locale of ['ku', 'ar', 'en']) {
    assert.match(localizedDto, new RegExp('\\b' + locale + '\\?: string'));
  }

  assert.match(localizedDto, /@MaxLength\(200\)/);
  assert.match(localizedDto, /@MaxLength\(1000\)/);

  for (const dto of [
    'src/modules/companies/dto/create-company.dto.ts',
    'src/modules/companies/dto/update-company.dto.ts',
    'src/modules/services/dto/service.dto.ts',
    'src/modules/services/dto/service-assignment.dto.ts',
  ]) {
    assert.match(source(dto), /@ValidateNested\(\)/);
    assert.match(source(dto), /@Type\(\(\) => Localized/);
  }
});

test('API language negotiation localizes names, descriptions, and nested assignments', () => {
  assert.match(
    setup,
    /useGlobalInterceptors\(new LocalizedContentInterceptor\(\)\)/,
  );
  assert.match(
    helper,
    /resolveApiLocale\(request\.headers\['accept-language'\]\)/,
  );
  assert.match(helper, /\['name', 'nameTranslations'\]/);
  assert.match(helper, /\['description', 'descriptionTranslations'\]/);
  assert.match(helper, /\['displayName', 'displayNameTranslations'\]/);
  assert.match(helper, /\[locale, \.\.\.API_SUPPORTED_LOCALES\]/);
  assert.match(
    shared,
    /export type LocalizedText = Partial<Record<Locale, string>>/,
  );
});
