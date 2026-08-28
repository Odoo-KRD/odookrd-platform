import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workspaceRoot = new URL('../../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, workspaceRoot), 'utf8');
}

test('3B.2R.2E focused contract can resolve the workspace root', () => {
  assert.match(read('apps/api/prisma/schema.prisma'), /model Role \{/);
  assert.match(
    read('apps/portal/src/components/admin/admin-data-table.tsx'),
    /AdminDataTable/,
  );
  assert.match(read('packages/ui/src/rich-text-editor.tsx'), /RichTextEditor/);
});

test('3B.2R.2E uses the supplied action icon geometry through one reusable control system', () => {
  const icons = read('apps/portal/src/components/admin/admin-action-icons.tsx');
  const controls = read(
    'apps/portal/src/components/admin/admin-action-controls.tsx',
  );
  const table = read('apps/portal/src/components/admin/admin-data-table.tsx');
  const lifecycle = read(
    'apps/portal/src/components/admin/admin-lifecycle-row-actions.tsx',
  );

  for (const geometry of [
    'M109.8,544.51V245.46',
    'M134.35,575.5V219.76',
    'M64.96,575V141.27',
    'M213.9,512.81c8.51',
    'M322.01,514.9c-32.8',
  ]) {
    assert.ok(
      icons.includes(geometry),
      `missing approved SVG geometry: ${geometry}`,
    );
  }

  assert.match(icons, /fill: "currentColor"/);
  assert.match(controls, /AdminActionIcon/);
  assert.match(controls, /inferAdminActionIcon/);
  assert.match(controls, /inline-flex h-8/);
  assert.match(
    controls,
    /interface AdminActionButtonProps[\s\S]*?icon\?: AdminActionIconName;/,
  );
  assert.match(table, /inferAdminActionIcon\(item\.key\)/);
  assert.match(lifecycle, /icon="edit"/);
  assert.match(lifecycle, /icon="archive"/);
  assert.match(lifecycle, /icon="delete"/);
});

test('3B.2R.2E lifecycle dictionary has View labels for all supported locales', () => {
  const lifecycle = read('apps/portal/src/lib/i18n/admin-lifecycle.ts');

  assert.match(lifecycle, /view: string;/);
  assert.match(lifecycle, /ku:\s*\{[\s\S]{0,220}?view:\s*"بینین"/);
  assert.match(lifecycle, /ar:\s*\{[\s\S]{0,220}?view:\s*"عرض"/);
  assert.match(lifecycle, /en:\s*\{[\s\S]{0,220}?view:\s*"View"/);
});

test('3B.2R.2E gives custom roles an archived lifecycle and blocks unsafe assignment/deletion', () => {
  const schema = read('apps/api/prisma/schema.prisma');
  const migration = read(
    'apps/api/prisma/migrations/20260828110000_026_role_archive_lifecycle/migration.sql',
  );
  const controller = read('apps/api/src/modules/roles/roles.controller.ts');
  const roles = read('apps/api/src/modules/roles/roles.service.ts');
  const users = read('apps/api/src/modules/users/users.service.ts');
  const types = read('packages/types/src/index.ts');

  assert.match(schema, /archivedAt\s+DateTime\?/);
  assert.match(migration, /ADD COLUMN "archived_at"/);
  assert.match(types, /archivedAt: string \| null/);
  assert.match(controller, /@Patch\(':roleId\/archive'\)/);
  assert.match(controller, /@Patch\(':roleId\/restore'\)/);
  assert.match(roles, /System roles cannot be archived/);
  assert.match(roles, /assigned to users and cannot be archived/);
  assert.match(roles, /Archive the role before deleting it/);
  assert.match(users, /archivedAt: null/);
});

test('3B.2R.2E protects Service and Feature permanent deletion behind archive and dependency checks', () => {
  const servicesController = read(
    'apps/api/src/modules/services/services.controller.ts',
  );
  const featuresController = read(
    'apps/api/src/modules/services/service-feature-definitions.controller.ts',
  );
  const service = read('apps/api/src/modules/services/services.service.ts');

  assert.match(servicesController, /@Delete\(':id'\)/);
  assert.match(featuresController, /@Delete\(':id'\)/);
  assert.match(service, /async deleteService\(/);
  assert.match(service, /ServiceCatalogStatus\.INACTIVE/);
  assert.match(service, /trainingCourseAccess/);
  assert.match(service, /async deleteFeatureDefinition\(/);
  assert.match(service, /ServiceFeatureStatus\.INACTIVE/);
  assert.match(service, /_count\.serviceFeatures/);
});

test('3B.2R.2E protects Training category/course permanent deletion and preserves learner history', () => {
  const controller = read(
    'apps/api/src/modules/training/training.controller.ts',
  );
  const service = read('apps/api/src/modules/training/training.service.ts');

  assert.match(controller, /@Delete\('categories\/:categoryId'\)/);
  assert.match(controller, /@Delete\('courses\/:courseId'\)/);
  assert.match(service, /TrainingCategoryStatus\.INACTIVE/);
  assert.match(service, /existing\._count\.courses/);
  assert.match(service, /TrainingCourseStatus\.ARCHIVED/);

  for (const relation of [
    'trainingCourseCompanyAccess',
    'trainingCourseServiceAccess',
    'trainingCourseUserAccess',
    'trainingLessonProgress',
    'trainingCourseProgress',
    'trainingQuizAttempt',
    'trainingCourseCompletion',
    'trainingCertificate',
  ]) {
    assert.match(service, new RegExp(relation));
  }
});

test('3B.2R.2E exposes reusable lifecycle actions across approved admin tables', () => {
  const roles = read('apps/portal/src/app/(protected)/admin/roles/page.tsx');
  const services = read(
    'apps/portal/src/app/(protected)/admin/services/page.tsx',
  );
  const features = read(
    'apps/portal/src/app/(protected)/admin/services/features/page.tsx',
  );
  const categories = read(
    'apps/portal/src/app/(protected)/admin/training/categories/page.tsx',
  );
  const courses = read(
    'apps/portal/src/app/(protected)/admin/training/courses/page.tsx',
  );

  for (const source of [roles, services, features, categories, courses]) {
    assert.match(source, /AdminLifecycleRowActions/);
  }

  assert.match(courses, /icon: "course-editor"/);
  assert.match(courses, /extraActions/);
});

test('Notification Delivery remains immutable, uses AdminDataTable, and exposes View details only', () => {
  const page = read(
    'apps/portal/src/app/(protected)/admin/notifications/deliveries/page.tsx',
  );
  const details = read(
    'apps/portal/src/components/admin/admin-record-details-action.tsx',
  );

  assert.match(page, /AdminDataTable/);
  assert.match(page, /AdminRecordDetailsAction/);
  assert.match(page, /providerMessageId/);
  assert.match(page, /lastAttemptAt/);
  assert.match(page, /sentAt/);
  assert.match(details, /icon="view"/);
  assert.doesNotMatch(
    page,
    /deleteNotificationDelivery|archiveNotificationDelivery|editNotificationDelivery/,
  );
});

test('R1 Company and RichText stabilization remains preserved', () => {
  const company = read(
    'apps/portal/src/app/(protected)/admin/companies/page.tsx',
  );
  const editor = read('packages/ui/src/rich-text-editor.tsx');

  const lifecycle = company.indexOf(
    'const lifecycle = adminLifecycleDictionaries[locale]',
  );
  const rows = company.indexOf(
    'const rows: AdminDataTableRow[] = result.items.map',
  );

  assert.ok(lifecycle >= 0 && rows >= 0 && lifecycle < rows);
  assert.match(
    editor,
    /event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);/,
  );
});
