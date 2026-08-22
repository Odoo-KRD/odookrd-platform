import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relative) => readFile(path.join(root, relative), 'utf8');

test('invitation persistence stores safe delivery metadata without secrets', async () => {
  const [schema, migration] = await Promise.all([
    source('prisma/schema.prisma'),
    source(
      'prisma/migrations/20260822210000_010_invitation_delivery_admin/migration.sql',
    ),
  ]);

  assert.match(schema, /whatsappNumber\s+String\?/u);
  assert.match(schema, /model UserInvitationDispatch/u);
  assert.match(schema, /model UserInvitationDelivery/u);
  assert.match(migration, /enforce_user_invitation_dispatch_scope/u);
  assert.match(migration, /users_whatsapp_number_e164_check/u);
  assert.doesNotMatch(
    migration,
    /"(?:token|invitation_url|destination|body|subject|credential|secret)"/iu,
  );
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE)\s+TABLE\b/iu);
});

test('invitation rotation invalidates previous tokens and stores only a hash', async () => {
  const service = await source(
    'src/modules/user-administration/user-administration.service.ts',
  );

  assert.match(service, /randomBytes\(32\)\.toString\(['"]base64url['"]\)/u);
  assert.match(service, /createHash\(['"]sha256['"]\)/u);
  assert.match(
    service,
    /authToken\.updateMany\([\s\S]*?type:\s*AuthTokenType\.INVITATION[\s\S]*?usedAt:\s*null[\s\S]*?data:\s*\{\s*usedAt:\s*now/u,
  );
  assert.match(service, /tokenHash,/u);

  const dispatchStart = service.indexOf(
    'this.prisma.userInvitationDispatch.create({',
  );
  assert.notEqual(dispatchStart, -1);

  const renderStart = service.indexOf(
    'const rendered = this.templates.render(',
    dispatchStart,
  );
  assert.notEqual(renderStart, -1);
  assert.ok(renderStart > dispatchStart);

  // Stage 2H.1 repair marker: persist-safe-invitation-dispatch
  const persistedDispatch = service.slice(dispatchStart, renderStart);

  for (const forbidden of ['token:', 'emailBody:', 'whatsappBody:']) {
    assert.equal(
      persistedDispatch.includes(forbidden),
      false,
      `Invitation dispatch persistence must not contain ${forbidden}`,
    );
  }
});

test('delivery reuses Stage 2H providers and records sanitized failure codes only', async () => {
  const [service, email, whatsapp, module] = await Promise.all([
    source('src/modules/user-administration/user-administration.service.ts'),
    source('src/modules/notifications/providers/email-provider.service.ts'),
    source('src/modules/notifications/providers/whatsapp-provider.service.ts'),
    source('src/modules/notifications/notifications.module.ts'),
  ]);

  assert.match(service, /EmailProviderService/u);
  assert.match(service, /WhatsAppProviderService/u);
  assert.match(service, /notifications\.email\.enabled/u);
  assert.match(service, /notifications\.whatsapp\.enabled/u);
  assert.match(service, /safeFailureCode/u);
  assert.match(email, /companyId:\s*string\s*\|\s*null/u);
  assert.match(whatsapp, /companyId:\s*string\s*\|\s*null/u);
  assert.match(
    module,
    /exports:[\s\S]*EmailProviderService[\s\S]*WhatsAppProviderService/u,
  );
});

test('administration routes are authenticated, permission checked, and session scoped', async () => {
  const [controller, service] = await Promise.all([
    source('src/modules/user-administration/user-administration.controller.ts'),
    source('src/modules/user-administration/user-administration.service.ts'),
  ]);

  assert.match(
    controller,
    /@UseGuards\(AuthenticatedGuard,\s*AuthorizationGuard\)/u,
  );
  assert.match(controller, /@RequirePermissions\(PERMISSIONS\.USERS_MANAGE\)/u);
  assert.match(controller, /@CurrentUser\(\) principal/u);
  assert.match(service, /target\.companyId !== principal\.companyId/u);
  assert.doesNotMatch(controller, /@Query\(\).*companyId/u);
});

test('company administrator removal is allowed only when another active admin exists', async () => {
  const service = await source(
    'src/modules/user-administration/user-administration.service.ts',
  );

  assert.match(service, /id:\s*\{\s*not:\s*target\.id\s*\}/u);
  assert.match(service, /status:\s*UserStatus\.ACTIVE/u);
  assert.match(service, /role:\s*\{\s*key:\s*roleKey\s*\}/u);
  assert.match(service, /return alternatives > 0/u);
  assert.match(
    service,
    /final active company administrator cannot have its administrative role removed/u,
  );
});
