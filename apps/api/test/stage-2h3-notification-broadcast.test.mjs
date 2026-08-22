import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relative) => readFile(path.join(root, relative), 'utf8');

test('broadcast endpoints reuse notifications.manage and enforce actor scope in the service', async () => {
  const [controller, service] = await Promise.all([
    source('src/modules/notifications/notification-broadcast.controller.ts'),
    source('src/modules/notifications/notification-broadcast.service.ts'),
  ]);

  assert.equal(controller.includes('PERMISSIONS.NOTIFICATIONS_MANAGE'), true);
  assert.equal(controller.includes('AuthenticatedGuard'), true);
  assert.equal(controller.includes('AuthorizationGuard'), true);
  assert.equal(
    service.includes(
      'Company administrators can broadcast only inside their own company.',
    ),
    true,
  );
  assert.equal(
    service.includes('principal.accountScope !== AccountScope.PLATFORM'),
    true,
  );
});

test('broadcast targets only active company users inside active companies', async () => {
  const service = await source(
    'src/modules/notifications/notification-broadcast.service.ts',
  );

  for (const marker of [
    'CompanyStatus.ACTIVE',
    'AccountScope.COMPANY',
    'UserStatus.ACTIVE',
    'MAX_BROADCAST_RECIPIENTS = 5_000',
    'BROADCAST_BATCH_SIZE = 100',
  ]) {
    assert.equal(
      service.includes(marker),
      true,
      'Missing broadcast safety marker: ' + marker,
    );
  }

  assert.equal(service.includes("account_scope\" = 'COMPANY'"), true);
  assert.equal(service.includes('u."status" = \'ACTIVE\''), true);
  assert.equal(service.includes('c."status" = \'ACTIVE\''), true);
});

test('bulk external delivery is queued and remains idempotent by request/company/batch', async () => {
  const [broadcast, notifications] = await Promise.all([
    source('src/modules/notifications/notification-broadcast.service.ts'),
    source('src/modules/notifications/notifications.service.ts'),
  ]);

  assert.equal(broadcast.includes('dispatchImmediately: false'), true);
  assert.equal(
    broadcast.includes(
      'broadcast:${input.requestId}:${companyId}:${String(batchIndex)}',
    ),
    true,
  );
  assert.equal(notifications.includes('dispatchImmediately?: boolean;'), true);
  assert.equal(
    notifications.includes('if (input.dispatchImmediately !== false)'),
    true,
  );
  assert.equal(notifications.includes('actorUserId: input.actorUserId'), true);
});

test('broadcast content uses the typed notification template boundary and internal URL validation', async () => {
  const [template, broadcast, notifications] = await Promise.all([
    source('src/modules/notifications/notification-template.service.ts'),
    source('src/modules/notifications/notification-broadcast.service.ts'),
    source('src/modules/notifications/notifications.service.ts'),
  ]);

  assert.equal(template.includes("'admin.broadcast'"), true);
  assert.equal(broadcast.includes("templateKey: 'admin.broadcast'"), true);
  assert.equal(
    notifications.includes('Notification action URL must be an internal path.'),
    true,
  );
});

test('broadcast requests are audited and rate limited without provider secrets', async () => {
  const service = await source(
    'src/modules/notifications/notification-broadcast.service.ts',
  );

  assert.equal(
    service.includes("action: 'notification.broadcast.queued'"),
    true,
  );
  assert.equal(service.includes('BROADCAST_RATE_LIMIT = 10'), true);
  assert.equal(service.includes('HttpStatus.TOO_MANY_REQUESTS'), true);
  assert.equal(service.includes('secretAccessKey'), false);
  assert.equal(service.includes('smtpPassword'), false);
  assert.equal(service.includes('accessToken'), false);
});
