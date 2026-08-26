import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Stage 3A reserves the complete training persistence foundation', async () => {
  const schema = await read('prisma/schema.prisma');

  for (const model of [
    'TrainingCategory',
    'TrainingCertificateTemplate',
    'TrainingCourse',
    'TrainingSection',
    'TrainingVideoAsset',
    'TrainingVideoLesson',
    'TrainingCourseCompanyAccess',
    'TrainingCourseServiceAccess',
    'TrainingCourseUserAccess',
    'TrainingLessonProgress',
    'TrainingCourseProgress',
    'TrainingQuiz',
    'TrainingQuizVersion',
    'TrainingQuizQuestion',
    'TrainingQuizOption',
    'TrainingQuizAttempt',
    'TrainingQuizAttemptAnswer',
    'TrainingCourseCompletion',
    'TrainingCertificate',
  ]) {
    assert.match(schema, new RegExp(`model ${model} \\{`));
  }

  assert.match(schema, /certificateName\s+String\?/);
});

test('video storage is AWS-first with simple local upload only', async () => {
  const [schema, constants, sharedTypes, settings, migration] =
    await Promise.all([
      read('prisma/schema.prisma'),
      read('src/modules/training/training.constants.ts'),
      read('../../packages/types/src/index.ts'),
      read('src/modules/settings/settings.registry.ts'),
      read('prisma/migrations/20260826100000_020_training_foundation/migration.sql'),
    ]);

  const providerEnum = schema.match(
    /enum TrainingStorageProvider \{([\s\S]*?)\}/,
  )?.[1];

  assert.ok(providerEnum);
  assert.match(providerEnum, /AWS_S3/);
  assert.match(providerEnum, /LOCAL/);
  assert.doesNotMatch(providerEnum, /GOOGLE|DRIVE/);
  assert.match(constants, /DEFAULT_TRAINING_STORAGE_PROVIDER[\s\S]*'AWS_S3'/);
  assert.match(constants, /LOCAL_TRAINING_TRANSCODING_ENABLED = false/);
  assert.match(sharedTypes, /TRAINING_STORAGE_PROVIDERS = \["AWS_S3", "LOCAL"\]/);
  assert.match(settings, /key: 'trainings\.video\.primary_provider'[\s\S]*defaultValue: 'AWS_S3'/);
  assert.match(migration, /"provider" "training_storage_provider" NOT NULL/);
  assert.match(
    migration,
    /training_video_assets_local_no_transcoding_check/,
  );
});

test('training permissions follow the approved system-role matrix', async () => {
  const [permissions, seed, roles, portal] = await Promise.all([
    read('src/modules/authorization/permissions.ts'),
    read('prisma/seed.ts'),
    read('src/modules/roles/roles.service.ts'),
    read('../../apps/portal/src/lib/authorization.ts'),
  ]);

  for (const permission of [
    'training.read',
    'training.manage',
    'training.assign',
    'training.progress.read',
  ]) {
    assert.match(permissions, new RegExp(permission.replaceAll('.', '\\.')));
    assert.match(seed, new RegExp(permission.replaceAll('.', '\\.')));
  }

  const companyAllowlist = roles.match(
    /const COMPANY_ROLE_PERMISSION_KEYS = new Set\(\[([\s\S]*?)\]\);/,
  )?.[1];

  assert.ok(companyAllowlist);
  assert.match(companyAllowlist, /training\.read/);
  assert.match(companyAllowlist, /training\.assign/);
  assert.match(companyAllowlist, /training\.progress\.read/);
  assert.doesNotMatch(companyAllowlist, /training\.manage/);
  assert.match(portal, /PERMISSIONS\.TRAINING_MANAGE/);
});

test('database migration enforces tenant and course isolation', async () => {
  const migration = await read(
    'prisma/migrations/20260826100000_020_training_foundation/migration.sql',
  );

  for (const guard of [
    'odookrd_training_company_user_guard',
    'odookrd_training_lesson_scope_guard',
    'odookrd_training_quiz_scope_guard',
    'odookrd_training_lesson_progress_scope_guard',
    'odookrd_training_course_progress_scope_guard',
    'odookrd_training_quiz_attempt_scope_guard',
    'odookrd_training_certificate_scope_guard',
    'odookrd_training_service_access_guard',
    'odookrd_training_service_category_change_guard',
  ]) {
    assert.match(migration, new RegExp(guard));
  }
});

test('Stage 3A exposes no training API or frontend implementation', async () => {
  const trainingModule = await read('src/modules/training/training.module.ts');

  assert.doesNotMatch(trainingModule, /controllers:/);
  assert.doesNotMatch(trainingModule, /providers:/);
  assert.doesNotMatch(trainingModule, /Controller|Service/);
});

test('training remains feature-disabled while future quiz and certificate foundations exist', async () => {
  const [settings, schema] = await Promise.all([
    read('src/modules/settings/settings.registry.ts'),
    read('prisma/schema.prisma'),
  ]);

  assert.match(
    settings,
    /key: 'trainings\.enabled'[\s\S]*?defaultValue: false/,
  );
  assert.match(settings, /key: 'trainings\.quizzes\.enabled'/);
  assert.match(settings, /key: 'trainings\.certificates\.enabled'/);
  assert.match(
    schema,
    /enum TrainingQuizPlacement[\s\S]*SECTION[\s\S]*COURSE_FINAL/,
  );
  assert.match(schema, /model TrainingCertificate /);
});
