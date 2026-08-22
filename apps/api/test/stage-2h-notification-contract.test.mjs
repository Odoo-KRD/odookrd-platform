import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const apiRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

function source(relativePath) {
  return readFile(path.join(apiRoot, relativePath), 'utf8');
}

test('notification inbox routes require authentication, permission, and session-derived ownership', async () => {
  const [controller, service] = await Promise.all([
    source('src/modules/notifications/notifications.controller.ts'),
    source('src/modules/notifications/notifications.service.ts'),
  ]);

  assert.match(
    controller,
    /@UseGuards\(AuthenticatedGuard, AuthorizationGuard\)/u,
  );
  assert.match(
    controller,
    /@RequirePermissions\(PERMISSIONS\.NOTIFICATIONS_READ\)/u,
  );
  assert.match(controller, /@CurrentUser\(\) principal/u);
  assert.doesNotMatch(controller, /companyId.*@Query|@Param\(['"]companyId/u);
  assert.match(service, /companyId,\s*userId:\s*principal\.userId/u);
  assert.match(service, /channel:\s*NotificationChannel\.IN_APP/u);
  assert.match(service, /status:\s*NotificationDeliveryStatus\.SENT/u);
  assert.match(service, /principal\.accountScope !== AccountScope\.COMPANY/u);
  assert.match(
    service,
    /id:\s*recipientId,[\s\S]*?companyId,[\s\S]*?userId:\s*principal\.userId/u,
  );
});

test('persistence has company idempotency, recipient scope, read state, and retry metadata', async () => {
  const [schema, migration] = await Promise.all([
    source('prisma/schema.prisma'),
    source(
      'prisma/migrations/20260822150000_009_notification_foundation/migration.sql',
    ),
  ]);

  assert.match(schema, /@@unique\(\[companyId, idempotencyKey\]/u);
  assert.match(schema, /model NotificationRecipient[\s\S]*?readAt/u);
  assert.match(
    schema,
    /model NotificationDelivery[\s\S]*?attemptCount[\s\S]*?nextAttemptAt/u,
  );
  assert.match(migration, /enforce_notification_recipient_scope/u);
  assert.match(migration, /recipient_user_company <> NEW\."company_id"/u);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE)\s+TABLE\b/iu);
});

test('providers resolve encrypted credentials only on the server and never log provider errors', async () => {
  const [email, whatsapp, dispatcher, registry, publicSettings] =
    await Promise.all([
      source('src/modules/notifications/providers/email-provider.service.ts'),
      source(
        'src/modules/notifications/providers/whatsapp-provider.service.ts',
      ),
      source('src/modules/notifications/notification-dispatcher.service.ts'),
      source('src/modules/settings/settings.registry.ts'),
      source('src/modules/settings/settings-public.controller.ts'),
    ]);

  assert.match(
    email,
    /resolveSecret\(\s*['"]notifications\.email\.amazon_ses\.access_key_id['"]/u,
  );
  assert.match(
    email,
    /resolveSecret\(\s*['"]notifications\.email\.amazon_ses\.secret_access_key['"]/u,
  );
  assert.match(
    whatsapp,
    /resolveSecret\(\s*['"]notifications\.whatsapp\.access_token['"]/u,
  );
  assert.match(whatsapp, /baseUrl\.protocol !== 'https:'/u);
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
    assert.ok(definition, key + ' must remain registered');
    assert.match(definition[1], /valueType:\s*['"]SECRET['"]/u);
    assert.match(definition[1], /companyVisible:\s*false/u);
    assert.match(definition[1], /companyWritable:\s*false/u);
  }
  assert.doesNotMatch(
    `${email}\n${whatsapp}\n${dispatcher}`,
    /console\.|logger\.(?:log|warn|error)\([^)]*error/iu,
  );
  assert.doesNotMatch(
    publicSettings,
    /resolveSecret|access_key|access_token|credential/iu,
  );
});

test('delivery claims are atomic and uncertain sends are not automatically duplicated', async () => {
  const dispatcher = await source(
    'src/modules/notifications/notification-dispatcher.service.ts',
  );

  assert.match(
    dispatcher,
    /status:\s*delivery\.status,[\s\S]*?attemptCount:\s*delivery\.attemptCount/u,
  );
  assert.match(dispatcher, /claim\.count !== 1/u);
  assert.match(dispatcher, /DELIVERY_STATE_UNCERTAIN/u);
  assert.match(dispatcher, /nextAttemptAt:\s*null/u);
  assert.match(
    dispatcher,
    /status:\s*NotificationDeliveryStatus\.FAILED,[\s\S]*?nextAttemptAt:\s*\{\s*lte:\s*now\s*\}/u,
  );
  assert.match(dispatcher, /delivery\.nextAttemptAt !== null/u);
  assert.match(dispatcher, /currentAttempt < delivery\.maxAttempts/u);
});

test('templates are typed and locale-aware across Kurdish, Arabic, and English', async () => {
  const [templates, i18n] = await Promise.all([
    source('src/modules/notifications/notification-template.service.ts'),
    source('src/i18n/types.ts'),
  ]);

  assert.match(templates, /NotificationTemplateVariablesByKey/u);
  assert.match(templates, /apiTranslations\[locale\]\.notifications/u);
  assert.match(i18n, /API_SUPPORTED_LOCALES = \['ku', 'ar', 'en'\] as const/u);
});
