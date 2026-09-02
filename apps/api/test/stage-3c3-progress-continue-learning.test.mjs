import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (file) => readFile(path.join(root, file), 'utf8');

const [
  schema,
  migration,
  controller,
  service,
  rules,
  module,
  types,
  proxy,
  catalogPage,
  coursePage,
  lessonPage,
  mediaPlayer,
  videoPlayer,
  pdfViewer,
] = await Promise.all([
  read('apps/api/prisma/schema.prisma'),
  read(
    'apps/api/prisma/migrations/20260901163000_030_training_progress_continue_learning/migration.sql',
  ),
  read('apps/api/src/modules/training/training-progress.controller.ts'),
  read('apps/api/src/modules/training/training-progress.service.ts'),
  read('apps/api/src/modules/training/training-progress.rules.ts'),
  read('apps/api/src/modules/training/training.module.ts'),
  read('packages/types/src/index.ts'),
  read('apps/portal/src/app/api/training/[...path]/route.ts'),
  read(
    'apps/portal/src/app/(protected)/(customer)/dashboard/training/page.tsx',
  ),
  read(
    'apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/page.tsx',
  ),
  read(
    'apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/lessons/[lessonId]/page.tsx',
  ),
  read('apps/portal/src/components/training/lesson-media-player.tsx'),
  read('apps/portal/src/components/training/branded-video-player.tsx'),
  read('apps/portal/src/components/training/pdf-slide-viewer.tsx'),
]);

test('3C.3 adds additive PDF resume columns', () => {
  assert.match(schema, /lastPageNumber\s+Int\s+@default\(0\)/);
  assert.match(schema, /furthestPageNumber\s+Int\s+@default\(0\)/);
  assert.match(migration, /last_page_number/);
  assert.match(migration, /furthest_page_number/);
});

test('3C.3 exposes company-scoped progress endpoints behind TRAINING_READ', () => {
  assert.match(controller, /@Controller\('training\/progress'\)/);
  assert.match(controller, /PERMISSIONS\.TRAINING_READ/);
  assert.match(controller, /continueLearning/);
  assert.match(controller, /startLesson/);
  assert.match(controller, /updateLesson/);
  assert.match(controller, /completeLesson/);
  assert.match(service, /resolveCustomerContext/);
  assert.match(service, /assertEntitledCourseBySlug/);
  assert.match(service, /companyId: context\.companyId/);
  assert.match(service, /userId: context\.userId/);
});

test('3C.3 keeps completion authority on the API', () => {
  assert.match(rules, /TRAINING_VIDEO_COMPLETION_PERCENTAGE = 90/);
  assert.match(service, /isVideoLessonComplete/);
  assert.match(service, /furthestPageNumber >= pageCount/);
  assert.match(service, /Only article lessons support explicit completion/);
  assert.doesNotMatch(types, /completed:\s*boolean;\s*\/\/ client authority/);
});

test('3C.3 maintains course aggregate progress and Continue Learning', () => {
  assert.match(service, /syncCourseProgress/);
  assert.match(service, /calculateTrainingProgressPercentage/);
  assert.match(service, /lastLessonId/);
  assert.match(service, /lastAccessedAt/);
  assert.match(types, /TrainingContinueLearningResponse/);
  assert.match(catalogPage, /TrainingContinueLearning/);
  assert.match(coursePage, /TrainingCourseProgressDetail/);
});

test('3C.3 resumes video and PDF content and tracks article completion', () => {
  assert.match(lessonPage, /courseProgress/);
  assert.match(mediaPlayer, /positionSeconds/);
  assert.match(mediaPlayer, /pageNumber/);
  assert.match(mediaPlayer, /\/complete/);
  assert.match(videoPlayer, /initialPositionSeconds/);
  assert.match(videoPlayer, /onProgress/);
  assert.match(pdfViewer, /initialPageNumber/);
  assert.match(pdfViewer, /onPageChange/);
});

test('3C.3 BFF permits only explicit progress paths for browser writes', () => {
  assert.match(proxy, /progress\/courses/);
  assert.match(proxy, /\/start/);
  assert.match(proxy, /\/complete/);
});

test('3C.3 remains inside progress scope', () => {
  assert.doesNotMatch(service, /TrainingCertificate/);
  assert.doesNotMatch(service, /TrainingQuizAttempt/);
  assert.doesNotMatch(controller, /certificate/i);
});
