import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relative) => readFile(path.join(root, relative), 'utf8');

function settingDefinition(registry, key) {
  const start = registry.indexOf("key: '" + key + "'");
  assert.notEqual(start, -1, 'Missing setting: ' + key);
  return registry.slice(start, start + 700);
}

test('SES SMTP settings remain encrypted platform-only settings', async () => {
  const registry = await source('src/modules/settings/settings.registry.ts');

  for (const key of [
    'notifications.email.amazon_ses.smtp_username',
    'notifications.email.amazon_ses.smtp_password',
  ]) {
    const definition = settingDefinition(registry, key);
    assert.equal(definition.includes("valueType: 'SECRET'"), true);
    assert.equal(definition.includes('companyVisible: false'), true);
    assert.equal(definition.includes('companyWritable: false'), true);
  }

  assert.equal(
    registry.includes("key: 'notifications.email.amazon_ses.transport'"),
    true,
  );
  assert.equal(registry.includes("allowedValues: ['api', 'smtp']"), true);
  assert.equal(
    registry.includes("key: 'notifications.email.amazon_ses.smtp_port'"),
    true,
  );
  assert.equal(
    registry.includes("key: 'notifications.email.amazon_ses.smtp_security'"),
    true,
  );
});

test('email provider supports SES API and SMTP while deriving the SES SMTP host', async () => {
  const provider = await source(
    'src/modules/notifications/providers/email-provider.service.ts',
  );

  for (const marker of [
    '@aws-sdk/client-sesv2',
    "from 'nodemailer'",
    "transport === 'smtp'",
    'sendSmtp(',
    'sendApi(',
    'email-smtp.${region}.amazonaws.com',
    'notifications.email.amazon_ses.smtp_username',
    'notifications.email.amazon_ses.smtp_password',
    "requireTLS: security === 'starttls'",
    "secure: security === 'tls'",
  ]) {
    assert.equal(
      provider.includes(marker),
      true,
      'Missing provider marker: ' + marker,
    );
  }

  assert.equal(
    provider.includes('notifications.email.amazon_ses.smtp_host'),
    false,
  );
});

test('SMTP failures are sanitized and raw provider errors are not logged', async () => {
  const provider = await source(
    'src/modules/notifications/providers/email-provider.service.ts',
  );

  for (const code of [
    'SES_SMTP_CONFIGURATION_MISSING',
    'SES_SMTP_AUTH_FAILED',
    'SES_SMTP_CONNECTION_FAILED',
    'SES_SMTP_TEMPORARY_FAILURE',
    'SES_SMTP_REQUEST_FAILED',
  ]) {
    assert.equal(
      provider.includes(code),
      true,
      'Missing safe failure code: ' + code,
    );
  }

  assert.equal(provider.includes('console.'), false);
  assert.equal(provider.includes('logger.error'), false);
  assert.equal(provider.includes('logger.warn'), false);
});

test('provider readiness follows the selected transport and masks SMTP credentials', async () => {
  const service = await source(
    'src/modules/notifications/notification-administration.service.ts',
  );

  for (const marker of [
    'notifications.email.amazon_ses.transport',
    'notifications.email.amazon_ses.smtp_username',
    'notifications.email.amazon_ses.smtp_password',
    "transport === 'smtp' ? smtpReady : apiReady",
    'username: this.maskedSecret(smtpUsername, true)',
    'password: this.maskedSecret(smtpPassword, false)',
  ]) {
    assert.equal(
      service.includes(marker),
      true,
      'Missing readiness marker: ' + marker,
    );
  }
});
