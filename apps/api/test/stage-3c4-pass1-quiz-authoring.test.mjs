import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const schema = read('apps/api/prisma/schema.prisma');
const migration = read(
  'apps/api/prisma/migrations/20260902093000_031_training_quiz_authoring/migration.sql',
);
const controller = read(
  'apps/api/src/modules/training/training-quiz-admin.controller.ts',
);
const service = read(
  'apps/api/src/modules/training/training-quiz-admin.service.ts',
);
const moduleSource = read('apps/api/src/modules/training/training.module.ts');
const lessonEditorService = read(
  'apps/api/src/modules/training/training-lesson-editor.service.ts',
);
const bff = read('apps/portal/src/app/api/training/[...path]/route.ts');
const builder = read(
  'apps/portal/src/components/training/training-quiz-builder.tsx',
);
const lessonEditor = read(
  'apps/portal/src/components/training/training-lesson-editor.tsx',
);
const finalQuizPage = read(
  'apps/portal/src/app/(protected)/admin/training/courses/[id]/final-quiz/page.tsx',
);
const quizDictionary = read('apps/portal/src/lib/i18n/training-quiz.ts');
const types = read('packages/types/src/index.ts');

test('3C.4 Pass 1 connects SECTION quizzes to an authoritative lesson', () => {
  assert.match(schema, /lessonId\s+String\?\s+@unique\s+@map\("lesson_id"\)/);
  assert.match(schema, /quiz\s+TrainingQuiz\?/);
  assert.match(migration, /ADD COLUMN "lesson_id" UUID/);
  assert.match(migration, /training_quizzes_lesson_id_fkey/);
  assert.match(migration, /DROP INDEX "training_quizzes_section_unique"/);
  assert.match(
    migration,
    /"placement" = 'SECTION'[\s\S]*"section_id" IS NOT NULL[\s\S]*"lesson_id" IS NOT NULL/,
  );
});

test('3C.4 Pass 1 preserves Stage 3A guards and adds one editable draft', () => {
  assert.match(migration, /training_quiz_versions_one_draft_unique/);
  assert.doesNotMatch(
    migration,
    /CREATE UNIQUE INDEX "training_quizzes_course_final_unique"/,
  );
  assert.doesNotMatch(
    migration,
    /CREATE UNIQUE INDEX "training_quiz_versions_one_published_unique"/,
  );
  assert.match(service, /createDraftFromPublished/);
  assert.match(service, /TrainingQuizVersionStatus\.RETIRED/);
});

test('3C.4 Pass 1 exposes platform-admin authoring only', () => {
  assert.match(controller, /PERMISSIONS\.TRAINING_MANAGE/);
  assert.match(controller, /final-quiz/);
  assert.match(controller, /questions\/reorder/);
  assert.match(controller, /publish/);
  assert.match(service, /AccountScope\.PLATFORM/);
  assert.match(moduleSource, /TrainingQuizAdminController/);
  assert.doesNotMatch(controller, /TRAINING_READ/);
});

test('3C.4 Pass 1 supports all question types and multilingual content', () => {
  assert.match(types, /TrainingQuizAdminQuestion/);
  assert.match(builder, /SINGLE_CHOICE/);
  assert.match(builder, /MULTIPLE_CHOICE/);
  assert.match(builder, /TRUE_FALSE/);
  assert.match(builder, /titleTranslations/);
  assert.match(builder, /promptTranslations/);
  assert.match(builder, /explanationTranslations/);
  assert.match(builder, /textTranslations/);
  assert.match(quizDictionary, /languages: Record<Locale, string>/);
  assert.match(quizDictionary, /ku:/);
  assert.match(quizDictionary, /ar:/);
  assert.match(quizDictionary, /en:/);
});

test('3C.4 Pass 1 replaces the reserved lesson quiz panel', () => {
  assert.match(lessonEditor, /<TrainingQuizBuilder/);
  assert.match(lessonEditor, /kind: "lesson"/);
  assert.match(lessonEditorService, /TrainingQuizStatus\.PUBLISHED/);
  assert.match(lessonEditorService, /TrainingQuizVersionStatus\.PUBLISHED/);
});

test('3C.4 Pass 1 provides a reusable course-final quiz workspace', () => {
  assert.match(finalQuizPage, /TrainingQuizBuilder/);
  assert.match(finalQuizPage, /kind: "final"/);
  assert.match(builder, /target\.kind === "lesson"/);
  assert.match(builder, /final-quiz/);
});

test('3C.4 Pass 1 BFF explicitly allow-lists quiz administration', () => {
  assert.match(bff, /final-quiz/);
  assert.match(bff, /draft-from-published/);
  assert.match(bff, /questions\/reorder/);
  assert.match(bff, /quizzes\/\$\{uuid\}\/publish/);
});

test('3C.4 Pass 1 does not prematurely implement learner attempts', () => {
  assert.doesNotMatch(controller, /attempts/);
  assert.doesNotMatch(builder, /Start Quiz|Submit Quiz|attemptId/);
});
