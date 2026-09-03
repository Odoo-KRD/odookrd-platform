import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const rulesPath = 'apps/api/src/modules/training/training-certificate.rules.ts';
const servicePath =
  'apps/api/src/modules/training/training-certificate.service.ts';
const formPath =
  'apps/portal/src/components/training/training-certificate-template-form.tsx';
const adminLayoutPath = 'apps/portal/src/app/(protected)/admin/layout.tsx';

test('certificate designer exposes genuinely distinct Noto font families', async () => {
  const [rules, form, layout] = await Promise.all([
    readFile(rulesPath, 'utf8'),
    readFile(formPath, 'utf8'),
    readFile(adminLayoutPath, 'utf8'),
  ]);

  assert.match(rules, /Noto Sans Arabic/);
  assert.match(rules, /Noto Naskh Arabic/);
  assert.match(form, /"Noto Sans Arabic"/);
  assert.match(form, /"Noto Naskh Arabic"/);
  assert.notEqual(
    form.match(/case "ARABIC_SANS":[\s\S]*?return ([^;]+);/)?.[1],
    form.match(/case "ARABIC_NASKH":[\s\S]*?return ([^;]+);/)?.[1],
  );

  assert.match(layout, /@fontsource\/noto-sans-arabic\/400\.css/);
  assert.match(layout, /@fontsource\/noto-naskh-arabic\/400\.css/);
});

test('certificate dates remain English-only in PDF and live preview', async () => {
  const [service, form] = await Promise.all([
    readFile(servicePath, 'utf8'),
    readFile(formPath, 'utf8'),
  ]);

  assert.match(service, /new Intl\.DateTimeFormat\('en-US', \{/);
  assert.doesNotMatch(service, /ku-Arab-IQ|ar-IQ/);

  assert.match(form, /new Intl\.DateTimeFormat\("en-US", \{/);
  assert.doesNotMatch(form, /ku-Arab-IQ|ar-IQ/);
});
