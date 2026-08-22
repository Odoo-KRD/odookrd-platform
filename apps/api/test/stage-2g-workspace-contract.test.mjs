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

test('workspace routes require authentication and explicit company permissions', async () => {
  const controller = await source(
    'src/modules/workspace/workspace.controller.ts',
  );

  assert.match(
    controller,
    /@UseGuards\(AuthenticatedGuard, AuthorizationGuard\)/u,
  );
  assert.match(
    controller,
    /@RequirePermissions\(PERMISSIONS\.SERVICES_READ\)/u,
  );
  assert.match(
    controller,
    /@RequirePermissions\(PERMISSIONS\.COMPANIES_READ\)/u,
  );
  assert.match(controller, /@CurrentUser\(\) principal/u);
  assert.doesNotMatch(controller, /@Param\(|@Query\(/u);
});

test('company identity is always derived from the authenticated session', async () => {
  const service = await source('src/modules/workspace/workspace.service.ts');

  assert.match(service, /principal\.accountScope !== AccountScope\.COMPANY/u);
  assert.match(service, /return principal\.companyId/u);
  assert.match(service, /where: \{ id: principal\.userId, companyId \}/u);
  assert.match(
    service,
    /where: \{\s*companyId,\s*status: UserStatus\.ACTIVE\s*\}/u,
  );
});

test('recent activity has an explicit allowlist and no raw audit metadata', async () => {
  const service = await source('src/modules/workspace/workspace.service.ts');
  const auditQuery = service.match(
    /this\.prisma\.auditLog\.findMany\(\{([\s\S]*?)\}\),/u,
  );

  assert.ok(auditQuery);
  assert.match(auditQuery[1], /companyId/u);
  assert.match(auditQuery[1], /CUSTOMER_ACTIVITY_ACTIONS/u);
  assert.doesNotMatch(auditQuery[1], /metadata|actorUserId/u);
});

test('dashboard service projections never include private operator notes', async () => {
  const service = await source('src/modules/workspace/workspace.service.ts');
  const projection = service.match(
    /const recentServiceSelect = \{([\s\S]*?)\} satisfies Prisma\.CompanyServiceSelect/u,
  );

  assert.ok(projection);
  assert.doesNotMatch(projection[1], /internalNotes|\bnotes\b/u);
  assert.match(projection[1], /nameTranslations/u);
  assert.match(projection[1], /displayNameTranslations/u);
});
