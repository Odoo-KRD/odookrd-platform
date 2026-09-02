import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const catalog = read(
  'apps/api/src/modules/training/training-catalog.service.ts',
);
const media = read('apps/api/src/modules/training/training-media.service.ts');
const progress = read(
  'apps/api/src/modules/training/training-progress.service.ts',
);
const attempts = read(
  'apps/api/src/modules/training/training-quiz-attempt.service.ts',
);
const lessonPlayer = read(
  'apps/portal/src/components/training/lesson-media-player.tsx',
);
const quizPlayer = read(
  'apps/portal/src/components/training/training-quiz-player.tsx',
);
const quizDictionary = read('apps/portal/src/lib/i18n/training-quiz-player.ts');
const types = read('packages/types/src/index.ts');

test('Pass 2B.1 marks only published non-empty section quizzes ready', () => {
  assert.match(catalog, /TrainingQuizStatus\.PUBLISHED/);
  assert.match(catalog, /TrainingQuizVersionStatus\.PUBLISHED/);
  assert.match(catalog, /_count\.questions/);
  assert.match(catalog, /quizId: quiz\?\.id \?\? null/);
  assert.doesNotMatch(catalog, /quizConfigured: false/);
});

test('Pass 2B.1 exposes safe quiz content through customer lesson detail', () => {
  assert.match(media, /type: 'QUIZ' as const/);
  assert.match(media, /quizId: lesson\.quiz\.id/);
  assert.match(types, /TrainingCustomerQuizContent/);
  assert.match(types, /quizId: string \| null/);
});

test('Pass 2B.1 includes quiz lessons in persistent course progress', () => {
  assert.match(progress, /quizConfigured/);
  assert.match(progress, /async completeQuizLesson/);
  assert.doesNotMatch(
    progress,
    /lesson\.contentType === TrainingLessonContentType\.QUIZ[\s\S]{0,80}throw new NotFoundException/,
  );
});

test('Pass 2B.1 lets only scored attempts complete quiz lessons', () => {
  assert.match(attempts, /TrainingProgressService/);
  assert.match(attempts, /progress\.startLesson/);
  assert.match(attempts, /progress\.completeQuizLesson/);
  assert.match(attempts, /TrainingQuizAttemptStatus\.PASSED/);
});

test('Pass 2B.1 renders the learner quiz player and uses localized start labels', () => {
  assert.match(lessonPlayer, /content\.type === "QUIZ"/);
  assert.match(lessonPlayer, /TrainingQuizPlayer/);
  assert.match(quizPlayer, /labels\.startQuiz/);
  assert.match(quizPlayer, /selectedOptionIds/);
  assert.match(quizPlayer, /submit/);
  assert.match(quizPlayer, /remainingSeconds/);
  assert.match(quizDictionary, /startQuiz: "Start quiz"/);
  assert.match(quizDictionary, /startQuiz: "دەستپێکردنی تاقیکردنەوە"/);
});

test('Pass 2B.1 keeps correctness review conditional on API response', () => {
  assert.match(quizPlayer, /attempt\.revealAnswers/);
  assert.match(quizPlayer, /option\.isCorrect === true/);
  assert.match(quizPlayer, /question\.explanationTranslations/);
});
