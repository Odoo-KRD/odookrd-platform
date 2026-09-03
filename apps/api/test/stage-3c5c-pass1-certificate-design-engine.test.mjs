import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

const schema = read('apps/api/prisma/schema.prisma');
const service = read(
  'apps/api/src/modules/training/training-certificate.service.ts',
);
const controller = read(
  'apps/api/src/modules/training/training-certificate.controller.ts',
);
const rules = read(
  'apps/api/src/modules/training/training-certificate.rules.ts',
);
const presets = read(
  'apps/api/src/modules/training/training-certificate-presets.ts',
);
const types = read('packages/types/src/index.ts');
const migration = read(
  'apps/api/prisma/migrations/20260903110000_033_training_certificate_designer/migration.sql',
);
const previewBff = read(
  'apps/portal/src/app/api/training/certificate-templates/preview/route.ts',
);

test('3C.5C adds versioned enterprise template design data additively', () => {
  assert.match(schema, /enum TrainingCertificateTemplateStatus/);
  assert.match(schema, /introTranslations\s+Json/);
  assert.match(schema, /layoutConfig\s+Json/);
  assert.match(schema, /backgroundPresetKey\s+String\?/);
  assert.match(schema, /templateSnapshot\s+Json/);
  assert.match(migration, /training_certificate_template_status/);
});

test('3C.5C provides backend-only preview and reusable vector presets', () => {
  assert.match(controller, /@Post\('preview'\)/);
  assert.match(controller, /presets\/:presetKey\/artwork/);
  assert.match(service, /async previewTemplate/);
  const preview = service.slice(
    service.indexOf('async previewTemplate'),
    service.indexOf('async courseStatus'),
  );
  assert.doesNotMatch(preview, /trainingCertificate\.create/);
  assert.match(presets, /style-1/);
  assert.match(presets, /viewBox="0 0 2400 1697"/);
});

test('3C.5C uses professional text hierarchy and removes the hardcoded border', () => {
  assert.match(service, /defaults\[input\.locale\]\.intro/);
  assert.match(service, /layout\.elements\.learnerName/);
  assert.match(rules, /Noto Naskh Arabic/);
  assert.match(service, /font-stretch="normal"/);
  assert.doesNotMatch(service, /<rect x="42" y="42"/);
  assert.doesNotMatch(service, /opacity="0\.22"/);
});

test('3C.5C accepts sanitized SVG artwork and snapshots issued layouts', () => {
  assert.match(service, /'image\/svg\+xml'/);
  assert.match(service, /templateLayoutVersion/);
  assert.match(service, /templateSnapshot/);
  assert.match(types, /TrainingCertificateLayoutConfig/);
  assert.match(types, /TrainingCertificateTemplateStatus/);
});

test('3C.5C preview BFF stays authenticated, same-origin and non-cacheable', () => {
  assert.match(previewBff, /isSameOrigin/);
  assert.match(previewBff, /SESSION_COOKIE_NAME/);
  assert.match(previewBff, /application\/pdf/);
  assert.match(previewBff, /no-store/);
});
