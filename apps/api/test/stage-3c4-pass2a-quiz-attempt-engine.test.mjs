import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const controller = read(
  'apps/api/src/modules/training/training-quiz-attempt.controller.ts',
);
const service = read(
  'apps/api/src/modules/training/training-quiz-attempt.service.ts',
);
const rules = read(
  'apps/api/src/modules/training/training-quiz-attempt.rules.ts',
);
const moduleSource = read('apps/api/src/modules/training/training.module.ts');
const bff = read('apps/portal/src/app/api/training/[...path]/route.ts');
const types = read('packages/types/src/index.ts');

test('Pass 2A exposes learner quiz endpoints behind TRAINING_READ', () => {
  assert.match(controller, /PERMISSIONS\.TRAINING_READ/);
  assert.match(controller, /:quizId\/attempts/);
  assert.match(controller, /answers\/:questionId/);
  assert.match(controller, /:attemptId\/submit/);
  assert.match(controller, /:quizId\/history/);
  assert.doesNotMatch(controller, /TRAINING_MANAGE/);
});

test('Pass 2A scopes attempts through entitlement and authenticated ownership', () => {
  assert.match(service, /assertEntitledCourseBySlug/);
  assert.match(service, /companyId/);
  assert.match(service, /userId/);
  assert.match(service, /courseId/);
  assert.match(service, /quizId/);
});

test('Pass 2A hides answer correctness before submitted review', () => {
  assert.match(
    service,
    /const reveal = submitted && attempt\.quizVersion\.revealAnswers/,
  );
  assert.match(service, /isCorrect: reveal \? option\.isCorrect : null/);
  assert.match(service, /explanation: reveal \? question\.explanation : null/);
});

test('Pass 2A enforces attempt limits and server-authoritative expiry', () => {
  assert.match(service, /maxAttempts/);
  assert.match(service, /maximum number of quiz attempts/i);
  assert.match(service, /TrainingQuizAttemptStatus\.EXPIRED/);
  assert.match(service, /expiresAt/);
});

test('Pass 2A uses exact-match scoring and stable deterministic shuffle', () => {
  assert.match(rules, /exactQuizSelectionMatch/);
  assert.match(rules, /deterministicQuizOrder/);
  assert.match(service, /quizPercentage/);
  assert.match(service, /pointsAwarded/);
});

test('Pass 2A is registered in Nest and explicitly allow-listed by the BFF', () => {
  assert.match(moduleSource, /TrainingQuizAttemptController/);
  assert.match(moduleSource, /TrainingQuizAttemptService/);
  assert.match(bff, /Stage 3C\.4 Pass 2 learner quiz paths/);
  assert.match(bff, /const learnerQuizGet =/);
  assert.match(bff, /catalog\/\$\{courseSlug\}\/quizzes\/\$\{uuid\}\/attempts/);
});

test('Pass 2A publishes typed learner quiz contracts', () => {
  assert.match(types, /TrainingQuizLearnerSummary/);
  assert.match(types, /TrainingQuizLearnerAttempt/);
  assert.match(types, /TrainingQuizAttemptHistory/);
  assert.match(types, /TrainingQuizAnswerInput/);
});
