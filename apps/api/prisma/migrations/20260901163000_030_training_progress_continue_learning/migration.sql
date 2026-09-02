ALTER TABLE "training_lesson_progress"
  ADD COLUMN "last_page_number" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "furthest_page_number" INTEGER NOT NULL DEFAULT 0;
