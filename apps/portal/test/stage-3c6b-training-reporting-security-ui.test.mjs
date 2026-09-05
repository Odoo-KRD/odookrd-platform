import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const page = read(
  'apps/portal/src/app/(protected)/admin/training/reports/page.tsx',
);
const exportRoute = read(
  'apps/portal/src/app/api/training/reports/export/route.ts',
);

test('3C.6B report workspace requires the dedicated server-side admin permission', () => {
  assert.match(
    page,
    /getAdminApiContext\(PERMISSIONS\.TRAINING_REPORTS_READ\)/,
  );
  assert.match(page, /session\.user\.accountScope === "PLATFORM"/);
});

test('3C.6B CSV proxy remains fixed-path, cookie-authenticated and allow-listed', () => {
  assert.match(exportRoute, /SESSION_COOKIE_NAME/);
  assert.match(exportRoute, /datasets = new Set/);
  assert.match(exportRoute, /uuidPattern/);
  assert.match(exportRoute, /datePattern/);
  assert.match(exportRoute, /\/v1\/training\/reports\/export/);
  assert.doesNotMatch(exportRoute, /request\.nextUrl\.pathname.*fetch/s);
});
