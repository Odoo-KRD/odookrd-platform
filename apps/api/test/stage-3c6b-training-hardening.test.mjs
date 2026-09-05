import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const trainingDirectory = path.join(root, 'apps/api/src/modules/training');

function occurrences(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

test('3C.6B keeps every training controller behind authentication and authorization guards', () => {
  const controllerFiles = fs
    .readdirSync(trainingDirectory)
    .filter((name) => name.endsWith('.controller.ts'));

  assert.ok(controllerFiles.length >= 10);

  for (const name of controllerFiles) {
    const source = fs.readFileSync(path.join(trainingDirectory, name), 'utf8');
    const controllerCount = occurrences(source, /@Controller\(/g);
    const guardCount = occurrences(
      source,
      /@UseGuards\(AuthenticatedGuard, AuthorizationGuard\)/g,
    );

    assert.ok(controllerCount > 0, `${name} has no controller declaration`);
    assert.equal(
      guardCount,
      controllerCount,
      `${name} must guard every controller declaration`,
    );
  }
});

test('3C.6B preserves least-privilege reporting RBAC', () => {
  const seed = read('apps/api/prisma/seed.ts');
  const roles = read('apps/api/src/modules/roles/roles.service.ts');

  const companyAdmin = seed.match(
    /key: 'company_admin'[\s\S]*?permissions: \[([\s\S]*?)\][\s\S]*?\n  },/,
  )?.[1];
  const companyUser = seed.match(
    /key: 'company_user'[\s\S]*?permissions: \[([\s\S]*?)\][\s\S]*?\n  },/,
  )?.[1];

  assert.ok(companyAdmin);
  assert.ok(companyUser);
  assert.match(companyAdmin, /training\.reports\.read/);
  assert.doesNotMatch(companyUser, /training\.reports\.read/);
  assert.match(roles, /'training\.reports\.read'/);
  assert.doesNotMatch(
    roles.match(
      /const COMPANY_ROLE_PERMISSION_KEYS = new Set\(\[([\s\S]*?)\]\);/,
    )?.[1] ?? '',
    /training\.manage/,
  );
});

test('3C.6B reporting metrics use the complete active-learner event union', () => {
  const service = read(
    'apps/api/src/modules/training/training-reporting.service.ts',
  );

  assert.match(service, /progressLearners/);
  assert.match(service, /completionLearners/);
  assert.match(service, /quizLearners/);
  assert.match(service, /certificateLearners/);
  assert.match(service, /activeLearnerIds\.size/);
});

test('3C.6B keeps protected customer media responses private and same-origin', () => {
  const media = read(
    'apps/api/src/modules/training/training-media.controller.ts',
  );

  assert.match(media, /PERMISSIONS\.TRAINING_READ/);
  assert.match(media, /private, no-store, max-age=0/);
  assert.match(media, /Cross-Origin-Resource-Policy/);
  assert.match(media, /same-origin/);
});

test('3C.6B keeps customer learning operations behind the entitlement authority', () => {
  for (const file of [
    'training-catalog.service.ts',
    'training-media.service.ts',
    'training-progress.service.ts',
    'training-quiz-attempt.service.ts',
    'training-course-completion.service.ts',
    'training-certificate.service.ts',
  ]) {
    const source = read(`apps/api/src/modules/training/${file}`);
    assert.match(
      source,
      /TrainingEntitlementService/,
      `${file} must retain the training entitlement authority`,
    );
  }

  assert.match(
    read('apps/api/src/modules/training/training-quiz-attempt.service.ts'),
    /TrainingCourseCompletionService/,
  );
  assert.match(
    read('apps/api/src/modules/training/training-certificate.service.ts'),
    /TrainingCourseCompletionService/,
  );
});

test('3C.6B does not add analytics persistence or speculative reporting indexes', () => {
  const schema = read('apps/api/prisma/schema.prisma');

  assert.doesNotMatch(schema, /model TrainingReport/);
  assert.doesNotMatch(schema, /model TrainingAnalytics/);
  assert.doesNotMatch(schema, /stage_3c6b|3c6b/i);
});
