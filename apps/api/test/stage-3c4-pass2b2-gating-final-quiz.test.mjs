import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const gateRules = read(
  'apps/api/src/modules/training/training-learning-gate.rules.ts',
);
const gateService = read(
  'apps/api/src/modules/training/training-learning-gate.service.ts',
);
const catalog = read(
  'apps/api/src/modules/training/training-catalog.service.ts',
);
const media = read('apps/api/src/modules/training/training-media.service.ts');
const enrichment = read(
  'apps/api/src/modules/training/training-video-enrichment.service.ts',
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
const lessonPage = read(
  'apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/lessons/[lessonId]/page.tsx',
);
const finalQuizPage = read(
  'apps/portal/src/app/(protected)/(customer)/dashboard/training/[slug]/final-quiz/page.tsx',
);

test('Pass 2B.2 computes required-to-continue locks centrally', () => {
  assert.match(gateRules, /blockingQuizId/);
  assert.match(gateRules, /requiredToContinue/);
  assert.match(gateService, /calculateTrainingLearningGate/);
  assert.match(gateService, /TrainingProgressStatus\.COMPLETED/);
  assert.match(gateService, /requiredLearningCompleted/);
  assert.match(moduleSource, /TrainingLearningGateService/);
});

test('Pass 2B.2 enforces gates on direct lesson and assessment APIs', () => {
  assert.match(media, /gate\.assertLessonAccessibleInCourse/);
  assert.match(enrichment, /gate\.assertLessonAccessibleInCourse/);
  assert.match(progress, /gate\.assertLessonAccessibleInCourse/);
  assert.match(attempts, /assertAttemptGate/);
  assert.match(attempts, /gate\.assertLessonAccessibleInCourse/);
  assert.match(attempts, /gate\.assertFinalQuizAccessibleInCourse/);
});

test('Pass 2B.2 exposes lock and Course Final Quiz state through catalog', () => {
  assert.match(catalog, /lockedByQuizId/);
  assert.match(catalog, /requiredToContinue/);
  assert.match(catalog, /TrainingQuizPlacement\.COURSE_FINAL/);
  assert.match(catalog, /finalQuizPassed/);
  assert.match(types, /TrainingCatalogFinalQuiz/);
  assert.match(types, /locked: boolean/);
});

test('Pass 2B.2 prevents resume and navigation into locked lessons', () => {
  assert.match(progress, /accessibleIds/);
  assert.match(coursePage, /lesson\.contentReady && !lesson\.locked/);
  assert.match(lessonPage, /lesson\.contentReady && !lesson\.locked/);
  assert.match(lessonPage, /course\.finalQuiz\?\.available/);
});

test('Pass 2B.2 provides the learner Course Final Quiz page', () => {
  assert.match(finalQuizPage, /TrainingQuizPlayer/);
  assert.match(finalQuizPage, /course\.finalQuiz\?\.available/);
  assert.match(finalQuizPage, /quizId=\{course\.finalQuiz\.id\}/);
});
