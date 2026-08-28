import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function read(path) {
  return readFileSync(path, 'utf8');
}

function walk(directory, extensions = new Set(['.ts', '.tsx'])) {
  const files = [];

  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      if (!['node_modules', '.next', 'dist', 'generated'].includes(entry)) {
        files.push(...walk(path, extensions));
      }
      continue;
    }

    if ([...extensions].some((extension) => path.endsWith(extension))) {
      files.push(path);
    }
  }

  return files;
}

test('3B.2R.2D v6 stores and shares ARCHIVED UserStatus', () => {
  const schema = read('apps/api/prisma/schema.prisma');
  const types = read('packages/types/src/index.ts');
  const migration = read(
    'apps/api/prisma/migrations/20260828090000_025_admin_lifecycle_archived_user/migration.sql',
  );

  assert.match(
    schema,
    /enum UserStatus\s*\{[\s\S]*?INVITED[\s\S]*?ACTIVE[\s\S]*?SUSPENDED[\s\S]*?ARCHIVED/,
  );
  assert.match(
    types,
    /export type UserStatus =[\s\S]*"INVITED"[\s\S]*"ACTIVE"[\s\S]*"SUSPENDED"[\s\S]*"ARCHIVED"/,
  );
  assert.match(
    migration,
    /ALTER TYPE "user_status" ADD VALUE IF NOT EXISTS 'ARCHIVED'/,
  );
});

test('3B.2R.2D v6 makes user status DTOs accept ARCHIVED', () => {
  for (const path of [
    'apps/api/src/modules/users/dto/update-user-status.dto.ts',
    'apps/api/src/modules/users/dto/batch-user-status.dto.ts',
  ]) {
    const source = read(path);
    assert.match(source, /UserStatus\.ACTIVE/);
    assert.match(source, /UserStatus\.SUSPENDED/);
    assert.match(source, /UserStatus\.ARCHIVED/);
  }
});

test('3B.2R.2D v6 keeps authentication and customer delivery ACTIVE-only', () => {
  const auth = read('apps/api/src/modules/auth/auth.service.ts');
  const invitation = read(
    'apps/api/src/modules/users/user-invitation.service.ts',
  );
  const workspace = read('apps/api/src/modules/workspace/workspace.service.ts');
  const broadcasts = read(
    'apps/api/src/modules/notifications/notification-broadcast.service.ts',
  );

  assert.match(auth, /status !== UserStatus\.ACTIVE/);
  assert.match(auth, /status === UserStatus\.ACTIVE|UserStatus\.ACTIVE/);
  assert.match(invitation, /UserStatus\.INVITED/);
  assert.match(workspace, /status: UserStatus\.ACTIVE/);
  assert.match(broadcasts, /UserStatus\.ACTIVE|status\s*=\s*'ACTIVE'/);
});

test('3B.2R.2D v6 propagates ARCHIVED through every known frontend UserStatus map', () => {
  const dictionaryTypes = read('apps/portal/src/lib/i18n/types.ts');
  const usersPage = read(
    'apps/portal/src/app/(protected)/admin/users/page.tsx',
  );
  const statusForm = read(
    'apps/portal/src/components/users/user-status-form.tsx',
  );
  const statusBadge = read(
    'apps/portal/src/components/users/user-status-badge.tsx',
  );
  const profilePage = read(
    'apps/portal/src/app/(protected)/(customer)/dashboard/profile/page.tsx',
  );

  assert.match(
    dictionaryTypes,
    /statusLabels:\s*Record<[\s\S]*?"INVITED"[\s\S]*?"ACTIVE"[\s\S]*?"SUSPENDED"[\s\S]*?"ARCHIVED"[\s\S]*?>/,
  );
  assert.match(usersPage, /const statuses: UserStatus\[\][\s\S]*"ARCHIVED"/);
  assert.match(usersPage, /users\.statusArchived/);
  assert.match(statusForm, /option value="ARCHIVED"/);
  assert.match(statusBadge, /ARCHIVED:[\s\S]*tone: "neutral"/);
  assert.match(profilePage, /profile\.status === "ARCHIVED"[\s\S]*"neutral"/);

  for (const locale of ['en', 'ar', 'ku']) {
    const source = read(`apps/portal/src/lib/i18n/frontend/${locale}.ts`);
    const profileStart = source.indexOf('    profile: {');
    const activityStart = source.indexOf('    activity: {', profileStart);
    assert.ok(profileStart >= 0 && activityStart > profileStart);
    assert.match(source.slice(profileStart, activityStart), /ARCHIVED:/);
  }

  for (const locale of ['en', 'ar', 'ku']) {
    const source = read(`apps/portal/src/lib/i18n/admin/${locale}.ts`);
    const usersStart = source.indexOf('\n  users: {\n');
    const settingsStart = source.indexOf('\n  settings: {', usersStart);
    assert.ok(usersStart >= 0 && settingsStart > usersStart);
    assert.match(source.slice(usersStart, settingsStart), /statusArchived:/);
  }
});

test('3B.2R.2D v6 rejects stale three-state frontend Records and UserStatus arrays', () => {
  const files = walk('apps/portal/src');
  const staleRecords = [];
  const staleArrays = [];

  for (const path of files) {
    const source = read(path);

    for (const match of source.matchAll(/Record<([^>]+)>/gs)) {
      const body = match[1];

      if (
        body.includes('"INVITED"') &&
        body.includes('"ACTIVE"') &&
        body.includes('"SUSPENDED"') &&
        !body.includes('"ARCHIVED"')
      ) {
        staleRecords.push(path);
      }
    }

    for (const match of source.matchAll(
      /UserStatus\[\]\s*=\s*\[([\s\S]*?)\]/g,
    )) {
      const body = match[1];

      if (
        body.includes('"INVITED"') &&
        body.includes('"ACTIVE"') &&
        body.includes('"SUSPENDED"') &&
        !body.includes('"ARCHIVED"')
      ) {
        staleArrays.push(path);
      }
    }
  }

  assert.deepEqual(
    [...new Set(staleRecords)],
    [],
    `Stale three-state UserStatus Record(s): ${staleRecords.join(', ')}`,
  );
  assert.deepEqual(
    [...new Set(staleArrays)],
    [],
    `Stale three-state UserStatus array(s): ${staleArrays.join(', ')}`,
  );
});

test('3B.2R.2D v6 portals RichText command dialogs outside the editor form', () => {
  const packageJson = JSON.parse(read('packages/ui/package.json'));
  const editor = read('packages/ui/src/rich-text-editor.tsx');

  assert.ok(packageJson.peerDependencies['react-dom']);
  assert.ok(packageJson.devDependencies['react-dom']);
  assert.ok(packageJson.devDependencies['@types/react-dom']);
  assert.match(editor, /import \{ createPortal \} from "react-dom"/);
  assert.match(editor, /commandDialogContent/);
  assert.match(editor, /createPortal\(commandDialogContent, document\.body\)/);
});

test('3B.2R.2D v6 exposes guarded company lifecycle/delete APIs', () => {
  const controller = read(
    'apps/api/src/modules/companies/companies.controller.ts',
  );
  const service = read('apps/api/src/modules/companies/companies.service.ts');
  const audit = read('apps/api/src/modules/audit/audit.actions.ts');

  assert.match(controller, /@Post\('batch-delete'\)/);
  assert.match(controller, /@Delete\(':id'\)/);
  assert.match(service, /async deleteMany\(/);
  assert.match(service, /this\.prisma\.\$transaction/);
  assert.match(service, /assertCompaniesDeletable/);
  assert.match(service, /trainingCertificate\.findFirst/);
  assert.match(service, /Archive the company instead/);
  assert.match(audit, /COMPANY_DELETED: 'company\.deleted'/);
});

test('3B.2R.2D v6 protects user archive/delete and audits lifecycle changes', () => {
  const controller = read('apps/api/src/modules/users/users.controller.ts');
  const service = read('apps/api/src/modules/users/users.service.ts');
  const audit = read('apps/api/src/modules/audit/audit.actions.ts');

  assert.match(controller, /@Post\('batch-delete'\)/);
  assert.match(controller, /@Delete\(':id'\)/);
  assert.match(service, /UserStatus\.ARCHIVED/);
  assert.match(service, /You cannot suspend or archive your own account/);
  assert.match(service, /assertNotLastActiveAdmin/);
  assert.match(
    service,
    /dto\.status === UserStatus\.ARCHIVED[\s\S]*?authToken\.updateMany/,
  );
  assert.match(service, /You cannot delete your own account/);
  assert.match(service, /The final active administrator cannot be deleted/);
  assert.match(service, /assertUsersDeletable/);
  assert.match(service, /tx\.user\.deleteMany/);
  assert.match(audit, /USER_ARCHIVED: 'user\.archived'/);
  assert.match(audit, /USER_DELETED: 'user\.deleted'/);
});

test('3B.2R.2D v6 exposes company/user row actions and transactional batch delete', () => {
  const component = read(
    'apps/portal/src/components/admin/admin-lifecycle-row-actions.tsx',
  );
  const companies = read(
    'apps/portal/src/app/(protected)/admin/companies/page.tsx',
  );
  const users = read('apps/portal/src/app/(protected)/admin/users/page.tsx');
  const table = read('apps/portal/src/components/admin/admin-data-table.tsx');
  const companyActions = read(
    'apps/portal/src/app/(protected)/admin/companies/actions.ts',
  );
  const userActions = read(
    'apps/portal/src/app/(protected)/admin/users/actions.ts',
  );

  assert.match(table, /type: "actions"/);
  assert.match(table, /type: "node"/);
  assert.match(table, /cell\.type === "node"/);

  assert.match(component, /createPortal/);
  assert.match(component, /labels\.edit/);
  assert.match(component, /labels\.archive/);
  assert.match(component, /labels\.restore/);
  assert.match(component, /labels\.delete/);

  assert.match(companies, /AdminLifecycleRowActions/);
  assert.match(companies, /value: "DELETE"/);
  assert.match(users, /AdminLifecycleRowActions/);
  assert.match(users, /value: "DELETE"/);

  assert.match(companyActions, /\/companies\/batch-delete/);
  assert.match(userActions, /\/users\/batch-delete/);
});
