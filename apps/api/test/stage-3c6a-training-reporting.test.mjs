import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const permissions = read('apps/api/src/modules/authorization/permissions.ts');
const seed = read('apps/api/prisma/seed.ts');
const roles = read('apps/api/src/modules/roles/roles.service.ts');
const moduleSource = read('apps/api/src/modules/training/training.module.ts');
const controller = read(
  'apps/api/src/modules/training/training-reporting.controller.ts',
);
const service = read(
  'apps/api/src/modules/training/training-reporting.service.ts',
);
const dto = read('apps/api/src/modules/training/dto/training-reporting.dto.ts');
const csv = read('apps/api/src/modules/training/training-reporting.csv.ts');
const schema = read('apps/api/prisma/schema.prisma');
const sharedTypes = read('packages/types/src/index.ts');

test('3C.6A adds a dedicated least-privilege reporting permission', () => {
  for (const source of [permissions, sharedTypes]) {
    assert.match(source, /TRAINING_REPORTS_READ/);
    assert.match(source, /training\.reports\.read/);
  }

  assert.match(seed, /key: 'training\.reports\.read'/);
  assert.match(seed, /key: 'platform_admin'[\s\S]*?'training\.reports\.read'/);
  assert.match(seed, /key: 'company_admin'[\s\S]*?'training\.reports\.read'/);
  assert.match(roles, /'training\.reports\.read'/);
});

test('3C.6A registers reporting controller and service in TrainingModule', () => {
  assert.match(moduleSource, /TrainingReportingController/);
  assert.match(moduleSource, /TrainingReportingService/);
  assert.match(
    controller,
    /@RequirePermissions\(PERMISSIONS\.TRAINING_REPORTS_READ\)/,
  );
});

test('3C.6A enforces company scope in the backend and rejects cross-company requests', () => {
  assert.match(service, /principal\.accountScope === AccountScope\.COMPANY/);
  assert.match(
    service,
    /query\.companyId && query\.companyId !== principal\.companyId/,
  );
  assert.match(service, /Cross-company training reporting is forbidden/);
  assert.match(service, /companyVisibleCourseWhere/);
});

test('3C.6A exposes validated reporting filters and bounded CSV export', () => {
  for (const field of [
    'companyId',
    'courseId',
    'categoryId',
    'dateFrom',
    'dateTo',
  ]) {
    assert.match(dto, new RegExp(field));
  }
  assert.match(dto, /TRAINING_REPORT_EXPORT_DATASETS/);
  assert.match(service, /EXPORT_ROW_LIMIT = 10_000/);
  assert.match(csv, /protectTrainingReportCsvCell/);
  assert.ok(csv.includes('[=+\\-@]'));
});

test('3C.6A does not introduce analytics tables', () => {
  assert.doesNotMatch(schema, /model TrainingReport/);
  assert.doesNotMatch(schema, /model TrainingAnalytics/);
});
