-- Stage 3C.4 Pass 1: quiz authoring target integrity.
--
-- Existing Stage 3A protections deliberately preserved:
--   training_quizzes_course_final_unique
--   training_quiz_versions_one_published_unique
--
-- Stage 3C.4 changes SECTION quizzes from one-per-section to one-per-QUIZ-lesson.

ALTER TABLE "training_quizzes"
ADD COLUMN "lesson_id" UUID;

CREATE UNIQUE INDEX "training_quizzes_lesson_id_key"
ON "training_quizzes"("lesson_id");

DROP INDEX "training_quizzes_section_unique";

CREATE UNIQUE INDEX "training_quiz_versions_one_draft_unique"
ON "training_quiz_versions"("quiz_id")
WHERE "status" = 'DRAFT';

ALTER TABLE "training_quizzes"
DROP CONSTRAINT "training_quizzes_placement_check";

ALTER TABLE "training_quizzes"
ADD CONSTRAINT "training_quizzes_lesson_id_fkey"
FOREIGN KEY ("lesson_id")
REFERENCES "training_video_lessons"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "training_quizzes"
ADD CONSTRAINT "training_quizzes_placement_check"
CHECK (
  (
    "placement" = 'SECTION'
    AND "section_id" IS NOT NULL
    AND "lesson_id" IS NOT NULL
  )
  OR
  (
    "placement" = 'COURSE_FINAL'
    AND "section_id" IS NULL
    AND "lesson_id" IS NULL
  )
);
