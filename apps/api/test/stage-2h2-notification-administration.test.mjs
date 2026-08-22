import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relative) => readFile(path.join(root, relative), 'utf8');

test('notification administration is permission-protected and company scoped', async () => {
  const [controller, service, permissions, seed] = await Promise.all([
    source(
      'src/modules/notifications/notification-administration.controller.ts',
    ),
    source('src/modules/notifications/notification-administration.service.ts'),
    source('src/modules/authorization/permissions.ts'),
    source('prisma/seed.ts'),
  ]);

  assert.match(controller, /PERMISSIONS\.NOTIFICATIONS_MANAGE/u);
  assert.match(controller, /AuthenticatedGuard/u);
  assert.match(controller, /AuthorizationGuard/u);
  assert.match(service, /principal\.accountScope === AccountScope\.COMPANY/u);
  assert.match(service, /"company_id" = \$\{principal\.companyId\}::uuid/u);
  assert.match(service, /Cross-company delivery access is forbidden/u);
  assert.match(
    permissions,
    /NOTIFICATIONS_MANAGE:\s*['"]notifications\.manage['"]/u,
  );
  assert.match(seed, /key:\s*['"]notifications\.manage['"]/u);
});

test('provider status masks secrets and provider tests never store email bodies or credentials', async () => {
  const [service, schema, migration] = await Promise.all([
    source('src/modules/notifications/notification-administration.service.ts'),
    source('prisma/schema.prisma'),
    source(
      'prisma/migrations/20260822223000_011_notification_administration/migration.sql',
    ),
  ]);

  assert.match(service, /resolveSecret\(/u);
  assert.match(service, /maskedSecret/u);
  assert.match(service, /••••••••••••••••/u);
  assert.match(service, /emailProvider\.send\(\s*null,/u);
  assert.match(schema, /model NotificationProviderTest/u);
  assert.doesNotMatch(
    schema,
    /model NotificationProviderTest[\s\S]*?\b(?:body|subject|credential|secret|token)\b\s+/iu,
  );
  assert.doesNotMatch(
    migration,
    /notification_provider_tests[\s\S]*?"(?:body|subject|credential|secret|token)"/iu,
  );
});

test('provider tests are persisted, rate limited, audited, and expose only safe failure codes', async () => {
  const service = await source(
    'src/modules/notifications/notification-administration.service.ts',
  );

  assert.match(service, /notificationProviderTest\.create/u);
  assert.match(service, /attempts >= 5/u);
  assert.match(service, /HttpStatus\.TOO_MANY_REQUESTS/u);
  assert.match(service, /notification\.provider\.email\.test\.sent/u);
  assert.match(service, /notification\.provider\.email\.test\.failed/u);
  assert.match(service, /safeFailureCode/u);
  assert.doesNotMatch(service, /console\.|logger\.(?:log|warn|error)/iu);
});

test('delivery view combines notifications, invitations, and provider tests without secrets', async () => {
  const migration = await source(
    'prisma/migrations/20260822223000_011_notification_administration/migration.sql',
  );

  assert.match(migration, /CREATE VIEW "notification_delivery_log"/u);
  assert.match(migration, /'NOTIFICATION'::VARCHAR/u);
  assert.match(migration, /'INVITATION'::VARCHAR/u);
  assert.match(migration, /'TEST'::VARCHAR/u);
  assert.match(migration, /user_invitation_deliveries/u);
  assert.match(migration, /notification_provider_tests/u);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE)\s+TABLE\b/iu);
});
