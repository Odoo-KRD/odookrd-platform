import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const schema = read('apps/api/prisma/schema.prisma');
const migration = read(
  'apps/api/prisma/migrations/20260826100000_020_training_foundation/migration.sql',
);
const service = read(
  'apps/api/src/modules/training/training-course-completion.service.ts',
);
const controller = read(
  'apps/api/src/modules/training/training-course-completion.controller.ts',
);
const rules = read(
  'apps/api/src/modules/training/training-course-completion.rules.ts',
);
const progress = read(
  'apps/api/src/modules/training/training-progress.service.ts',
);
const attempts = read(
  'apps/api/src/modules/training/training-quiz-attempt.service.ts',
);
const moduleSource = read('apps/api/src/modules/training/training.module.ts');
const types = read('packages/types/src/index.ts');
const coursePage = read(
  'apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/page.tsx',
);

test('3C.5A uses the reserved immutable completion schema without a new migration', () => {
  assert.match(schema, /model TrainingCourseCompletion/);
  assert.match(migration, /training_course_completions_user_course_unique/);
  assert.match(service, /trainingCourseCompletion\.upsert/);
  assert.match(service, /update: \{\}/);
  assert.match(service, /requirementSnapshot/);
});

test('3C.5A keeps completion authority on the backend and company-user scoped', () => {
  assert.match(service, /assertEntitledCourseBySlug/);
  assert.match(service, /companyId: context\.companyId/);
  assert.match(service, /userId: context\.userId/);
  assert.match(controller, /PERMISSIONS\.TRAINING_READ/);
  assert.match(controller, /@Get\('courses\/:slug'\)/);
  assert.doesNotMatch(controller, /@Post/);
});

test('3C.5A requires authoritative lesson and quiz evidence', () => {
  assert.match(service, /TrainingProgressStatus\.COMPLETED/);
  assert.match(service, /TrainingQuizAttemptStatus\.PASSED/);
  assert.match(service, /requiredForCompletion/);
  assert.match(service, /requiredToContinue/);
  assert.match(service, /finalQuizPass/);
  assert.match(rules, /!state\.finalQuizRequired \|\| state\.finalQuizPassed/);
});

test('3C.5A reconciles after lesson completion and Course Final Quiz pass', () => {
  assert.match(progress, /shouldReconcileCompletion/);
  assert.match(progress, /completions\.reconcileForContext/);
  assert.match(
    attempts,
    /TrainingQuizPlacement\.COURSE_FINAL[\s\S]{0,300}completions\.reconcileForContext/,
  );
  assert.match(moduleSource, /TrainingCourseCompletionController/);
  assert.match(moduleSource, /TrainingCourseCompletionService/);
});

test('3C.5A exposes typed learner completion status and completion UX', () => {
  assert.match(types, /TrainingCourseCompletionStatus/);
  assert.match(coursePage, /completionStatus\.completed/);
  assert.match(coursePage, /completionStatus\.completion\.completedAt/);
  assert.match(coursePage, /assessment\.courseCompleted/);
});

test('3C.5A does not implement certificates prematurely', () => {
  assert.doesNotMatch(service, /trainingCertificate/);
  assert.doesNotMatch(controller, /certificate/i);
  assert.doesNotMatch(rules, /certificate/i);
});
