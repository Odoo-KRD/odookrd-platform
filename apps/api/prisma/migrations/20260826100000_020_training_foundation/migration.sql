-- CreateEnum
CREATE TYPE "training_category_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "training_course_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "training_content_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "training_storage_provider" AS ENUM ('AWS_S3', 'LOCAL');

-- CreateEnum
CREATE TYPE "training_video_asset_status" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "training_audience_mode" AS ENUM ('ALL_USERS', 'ASSIGNED_USERS');

-- CreateEnum
CREATE TYPE "training_user_access_source" AS ENUM ('PLATFORM', 'COMPANY_ADMIN');

-- CreateEnum
CREATE TYPE "training_progress_status" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "training_quiz_placement" AS ENUM ('SECTION', 'COURSE_FINAL');

-- CreateEnum
CREATE TYPE "training_quiz_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "training_quiz_version_status" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "training_quiz_question_type" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "training_quiz_attempt_status" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'PASSED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "training_certificate_status" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "certificate_name" VARCHAR(250);

-- CreateTable
CREATE TABLE "training_categories" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_translations" JSONB NOT NULL DEFAULT '{}',
    "description" VARCHAR(1000),
    "description_translations" JSONB NOT NULL DEFAULT '{}',
    "status" "training_category_status" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_certificate_templates" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "title_translations" JSONB NOT NULL DEFAULT '{}',
    "body_translations" JSONB NOT NULL DEFAULT '{}',
    "logo_reference" VARCHAR(2048),
    "background_reference" VARCHAR(2048),
    "signatory_name" VARCHAR(200),
    "signatory_title" VARCHAR(200),
    "signature_reference" VARCHAR(2048),
    "primary_color" VARCHAR(7) NOT NULL DEFAULT '#714b67',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_courses" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "certificate_template_id" UUID,
    "slug" VARCHAR(150) NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "title_translations" JSONB NOT NULL DEFAULT '{}',
    "summary" VARCHAR(2000),
    "summary_translations" JSONB NOT NULL DEFAULT '{}',
    "thumbnail_url" VARCHAR(2048),
    "status" "training_course_status" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "certificate_enabled" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sections" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "title_translations" JSONB NOT NULL DEFAULT '{}',
    "description" VARCHAR(2000),
    "description_translations" JSONB NOT NULL DEFAULT '{}',
    "status" "training_content_status" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_video_assets" (
    "id" UUID NOT NULL,
    "provider" "training_storage_provider" NOT NULL,
    "status" "training_video_asset_status" NOT NULL DEFAULT 'UPLOADING',
    "original_filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(150) NOT NULL,
    "size_bytes" BIGINT,
    "checksum" VARCHAR(128),
    "duration_seconds" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "source_reference" VARCHAR(2048) NOT NULL,
    "playback_manifest_reference" VARCHAR(2048),
    "poster_reference" VARCHAR(2048),
    "media_convert_job_id" VARCHAR(255),
    "failure_code" VARCHAR(80),
    "failure_message" VARCHAR(1000),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_video_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_video_lessons" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "video_asset_id" UUID NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "title_translations" JSONB NOT NULL DEFAULT '{}',
    "description" VARCHAR(2000),
    "description_translations" JSONB NOT NULL DEFAULT '{}',
    "caption_tracks" JSONB NOT NULL DEFAULT '{}',
    "status" "training_content_status" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_video_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_course_company_access" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "mode" "training_audience_mode" NOT NULL DEFAULT 'ALL_USERS',
    "starts_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_course_company_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_course_service_access" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "mode" "training_audience_mode" NOT NULL DEFAULT 'ALL_USERS',
    "starts_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_course_service_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_course_user_access" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source" "training_user_access_source" NOT NULL DEFAULT 'PLATFORM',
    "starts_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_course_user_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_lesson_progress" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "status" "training_progress_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "last_position_seconds" INTEGER NOT NULL DEFAULT 0,
    "furthest_position_seconds" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "last_accessed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_course_progress" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "last_lesson_id" UUID,
    "status" "training_progress_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "last_accessed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_course_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_quizzes" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "section_id" UUID,
    "placement" "training_quiz_placement" NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "title_translations" JSONB NOT NULL DEFAULT '{}',
    "instructions" VARCHAR(2000),
    "instruction_translations" JSONB NOT NULL DEFAULT '{}',
    "status" "training_quiz_status" NOT NULL DEFAULT 'DRAFT',
    "required_for_completion" BOOLEAN NOT NULL DEFAULT true,
    "required_to_continue" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_quiz_versions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "training_quiz_version_status" NOT NULL DEFAULT 'DRAFT',
    "pass_percentage" INTEGER NOT NULL DEFAULT 70,
    "max_attempts" INTEGER,
    "time_limit_seconds" INTEGER,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "shuffle_options" BOOLEAN NOT NULL DEFAULT false,
    "reveal_answers" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_quiz_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_quiz_questions" (
    "id" UUID NOT NULL,
    "quiz_version_id" UUID NOT NULL,
    "type" "training_quiz_question_type" NOT NULL,
    "prompt" VARCHAR(2000) NOT NULL,
    "prompt_translations" JSONB NOT NULL DEFAULT '{}',
    "explanation" VARCHAR(2000),
    "explanation_translations" JSONB NOT NULL DEFAULT '{}',
    "points" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_quiz_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "text_translations" JSONB NOT NULL DEFAULT '{}',
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_quiz_attempts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "quiz_version_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" "training_quiz_attempt_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" INTEGER,
    "max_score" INTEGER,
    "percentage" INTEGER,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_quiz_attempt_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option_ids" JSONB NOT NULL DEFAULT '[]',
    "is_correct" BOOLEAN,
    "points_awarded" INTEGER,
    "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_quiz_attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_course_completions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "course_title_snapshot" VARCHAR(250) NOT NULL,
    "course_title_translations" JSONB NOT NULL DEFAULT '{}',
    "final_score_percentage" INTEGER,
    "requirement_snapshot" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_course_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_certificates" (
    "id" UUID NOT NULL,
    "completion_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "certificate_number" VARCHAR(100) NOT NULL,
    "verification_code_hash" VARCHAR(128) NOT NULL,
    "learner_name_snapshot" VARCHAR(250) NOT NULL,
    "learner_email_snapshot" VARCHAR(320) NOT NULL,
    "company_name_snapshot" VARCHAR(200) NOT NULL,
    "course_title_snapshot" VARCHAR(250) NOT NULL,
    "course_title_translations" JSONB NOT NULL DEFAULT '{}',
    "locale" VARCHAR(10) NOT NULL,
    "score_percentage" INTEGER,
    "status" "training_certificate_status" NOT NULL DEFAULT 'ACTIVE',
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "pdf_storage_provider" "training_storage_provider",
    "pdf_storage_reference" VARCHAR(2048),
    "pdf_checksum" VARCHAR(128),
    "revoked_at" TIMESTAMPTZ(6),
    "revocation_reason" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_categories_key_key" ON "training_categories"("key");

-- CreateIndex
CREATE INDEX "training_categories_status_sort_idx" ON "training_categories"("status", "sort_order", "id");

-- CreateIndex
CREATE UNIQUE INDEX "training_certificate_templates_key_key" ON "training_certificate_templates"("key");

-- CreateIndex
CREATE INDEX "training_certificate_templates_active_name_idx" ON "training_certificate_templates"("active", "name");

-- CreateIndex
CREATE UNIQUE INDEX "training_courses_slug_key" ON "training_courses"("slug");

-- CreateIndex
CREATE INDEX "training_courses_category_status_sort_idx" ON "training_courses"("category_id", "status", "sort_order", "id");

-- CreateIndex
CREATE INDEX "training_courses_status_published_idx" ON "training_courses"("status", "published_at");

-- CreateIndex
CREATE INDEX "training_courses_certificate_template_idx" ON "training_courses"("certificate_template_id");

-- CreateIndex
CREATE INDEX "training_sections_course_status_sort_idx" ON "training_sections"("course_id", "status", "sort_order", "id");

-- CreateIndex
CREATE INDEX "training_video_assets_provider_status_idx" ON "training_video_assets"("provider", "status", "created_at");

-- CreateIndex
CREATE INDEX "training_video_assets_checksum_idx" ON "training_video_assets"("checksum");

-- CreateIndex
CREATE INDEX "training_video_lessons_course_status_idx" ON "training_video_lessons"("course_id", "status", "id");

-- CreateIndex
CREATE INDEX "training_video_lessons_section_sort_idx" ON "training_video_lessons"("section_id", "status", "sort_order", "id");

-- CreateIndex
CREATE INDEX "training_video_lessons_video_asset_idx" ON "training_video_lessons"("video_asset_id");

-- CreateIndex
CREATE INDEX "training_course_company_access_window_idx" ON "training_course_company_access"("company_id", "starts_at", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "training_course_company_access_unique" ON "training_course_company_access"("course_id", "company_id");

-- CreateIndex
CREATE INDEX "training_course_service_access_window_idx" ON "training_course_service_access"("service_id", "starts_at", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "training_course_service_access_unique" ON "training_course_service_access"("course_id", "service_id");

-- CreateIndex
CREATE INDEX "training_course_user_access_window_idx" ON "training_course_user_access"("company_id", "user_id", "starts_at", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "training_course_user_access_unique" ON "training_course_user_access"("course_id", "user_id");

-- CreateIndex
CREATE INDEX "training_lesson_progress_company_user_idx" ON "training_lesson_progress"("company_id", "user_id", "last_accessed_at" DESC);

-- CreateIndex
CREATE INDEX "training_lesson_progress_course_status_idx" ON "training_lesson_progress"("course_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "training_lesson_progress_user_lesson_unique" ON "training_lesson_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "training_course_progress_continue_idx" ON "training_course_progress"("company_id", "user_id", "last_accessed_at" DESC);

-- CreateIndex
CREATE INDEX "training_course_progress_course_status_idx" ON "training_course_progress"("course_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "training_course_progress_user_course_unique" ON "training_course_progress"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "training_quizzes_course_placement_idx" ON "training_quizzes"("course_id", "placement", "status");

-- CreateIndex
CREATE INDEX "training_quizzes_section_idx" ON "training_quizzes"("section_id");

-- CreateIndex
CREATE INDEX "training_quiz_versions_quiz_status_idx" ON "training_quiz_versions"("quiz_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "training_quiz_versions_quiz_version_unique" ON "training_quiz_versions"("quiz_id", "version");

-- CreateIndex
CREATE INDEX "training_quiz_questions_version_sort_idx" ON "training_quiz_questions"("quiz_version_id", "sort_order", "id");

-- CreateIndex
CREATE INDEX "training_quiz_options_question_sort_idx" ON "training_quiz_options"("question_id", "sort_order", "id");

-- CreateIndex
CREATE INDEX "training_quiz_attempts_company_course_idx" ON "training_quiz_attempts"("company_id", "course_id", "status");

-- CreateIndex
CREATE INDEX "training_quiz_attempts_user_started_idx" ON "training_quiz_attempts"("user_id", "started_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "training_quiz_attempts_user_quiz_number_unique" ON "training_quiz_attempts"("user_id", "quiz_id", "attempt_number");

-- CreateIndex
CREATE INDEX "training_quiz_answers_question_idx" ON "training_quiz_attempt_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_quiz_answers_attempt_question_unique" ON "training_quiz_attempt_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE INDEX "training_course_completions_company_idx" ON "training_course_completions"("company_id", "completed_at" DESC);

-- CreateIndex
CREATE INDEX "training_course_completions_course_idx" ON "training_course_completions"("course_id", "completed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "training_course_completions_user_course_unique" ON "training_course_completions"("user_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_certificates_completion_id_key" ON "training_certificates"("completion_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_certificates_certificate_number_key" ON "training_certificates"("certificate_number");

-- CreateIndex
CREATE UNIQUE INDEX "training_certificates_verification_code_hash_key" ON "training_certificates"("verification_code_hash");

-- CreateIndex
CREATE INDEX "training_certificates_company_issued_idx" ON "training_certificates"("company_id", "issued_at" DESC);

-- CreateIndex
CREATE INDEX "training_certificates_user_issued_idx" ON "training_certificates"("user_id", "issued_at" DESC);

-- CreateIndex
CREATE INDEX "training_certificates_course_issued_idx" ON "training_certificates"("course_id", "issued_at" DESC);

-- AddForeignKey
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "training_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_certificate_template_id_fkey" FOREIGN KEY ("certificate_template_id") REFERENCES "training_certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sections" ADD CONSTRAINT "training_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_video_lessons" ADD CONSTRAINT "training_video_lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_video_lessons" ADD CONSTRAINT "training_video_lessons_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "training_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_video_lessons" ADD CONSTRAINT "training_video_lessons_video_asset_id_fkey" FOREIGN KEY ("video_asset_id") REFERENCES "training_video_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_company_access" ADD CONSTRAINT "training_course_company_access_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_company_access" ADD CONSTRAINT "training_course_company_access_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_service_access" ADD CONSTRAINT "training_course_service_access_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_service_access" ADD CONSTRAINT "training_course_service_access_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_user_access" ADD CONSTRAINT "training_course_user_access_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_user_access" ADD CONSTRAINT "training_course_user_access_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_user_access" ADD CONSTRAINT "training_course_user_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lesson_progress" ADD CONSTRAINT "training_lesson_progress_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lesson_progress" ADD CONSTRAINT "training_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lesson_progress" ADD CONSTRAINT "training_lesson_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lesson_progress" ADD CONSTRAINT "training_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "training_video_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_progress" ADD CONSTRAINT "training_course_progress_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_progress" ADD CONSTRAINT "training_course_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_progress" ADD CONSTRAINT "training_course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_progress" ADD CONSTRAINT "training_course_progress_last_lesson_id_fkey" FOREIGN KEY ("last_lesson_id") REFERENCES "training_video_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quizzes" ADD CONSTRAINT "training_quizzes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quizzes" ADD CONSTRAINT "training_quizzes_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "training_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_versions" ADD CONSTRAINT "training_quiz_versions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "training_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_questions" ADD CONSTRAINT "training_quiz_questions_quiz_version_id_fkey" FOREIGN KEY ("quiz_version_id") REFERENCES "training_quiz_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_options" ADD CONSTRAINT "training_quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "training_quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_attempts" ADD CONSTRAINT "training_quiz_attempts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_attempts" ADD CONSTRAINT "training_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_attempts" ADD CONSTRAINT "training_quiz_attempts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_attempts" ADD CONSTRAINT "training_quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "training_quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_attempts" ADD CONSTRAINT "training_quiz_attempts_quiz_version_id_fkey" FOREIGN KEY ("quiz_version_id") REFERENCES "training_quiz_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_attempt_answers" ADD CONSTRAINT "training_quiz_attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "training_quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_attempt_answers" ADD CONSTRAINT "training_quiz_attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "training_quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_completions" ADD CONSTRAINT "training_course_completions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_completions" ADD CONSTRAINT "training_course_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_course_completions" ADD CONSTRAINT "training_course_completions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_completion_id_fkey" FOREIGN KEY ("completion_id") REFERENCES "training_course_completions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "training_certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "training_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Stage 3A domain invariants
ALTER TABLE "users"
  ADD CONSTRAINT "users_certificate_name_check"
  CHECK (
    "certificate_name" IS NULL
    OR char_length(btrim("certificate_name")) BETWEEN 2 AND 250
  );

ALTER TABLE "training_categories"
  ADD CONSTRAINT "training_categories_key_check"
  CHECK ("key" ~ '^[a-z][a-z0-9_-]{1,99}$'),
  ADD CONSTRAINT "training_categories_name_check"
  CHECK (char_length(btrim("name")) BETWEEN 1 AND 200),
  ADD CONSTRAINT "training_categories_name_translations_check"
  CHECK (odookrd_valid_localized_text("name_translations", 200)),
  ADD CONSTRAINT "training_categories_description_translations_check"
  CHECK (odookrd_valid_localized_text("description_translations", 1000));

ALTER TABLE "training_certificate_templates"
  ADD CONSTRAINT "training_certificate_templates_key_check"
  CHECK ("key" ~ '^[a-z][a-z0-9_-]{1,99}$'),
  ADD CONSTRAINT "training_certificate_templates_name_check"
  CHECK (char_length(btrim("name")) BETWEEN 1 AND 200),
  ADD CONSTRAINT "training_certificate_templates_title_translations_check"
  CHECK (odookrd_valid_localized_text("title_translations", 500)),
  ADD CONSTRAINT "training_certificate_templates_body_translations_check"
  CHECK (odookrd_valid_localized_text("body_translations", 4000)),
  ADD CONSTRAINT "training_certificate_templates_color_check"
  CHECK ("primary_color" ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE "training_courses"
  ADD CONSTRAINT "training_courses_slug_check"
  CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  ADD CONSTRAINT "training_courses_title_check"
  CHECK (char_length(btrim("title")) BETWEEN 1 AND 250),
  ADD CONSTRAINT "training_courses_title_translations_check"
  CHECK (odookrd_valid_localized_text("title_translations", 250)),
  ADD CONSTRAINT "training_courses_summary_translations_check"
  CHECK (odookrd_valid_localized_text("summary_translations", 2000)),
  ADD CONSTRAINT "training_courses_publish_state_check"
  CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL),
  ADD CONSTRAINT "training_courses_certificate_template_check"
  CHECK (
    NOT "certificate_enabled"
    OR "certificate_template_id" IS NOT NULL
  );

ALTER TABLE "training_sections"
  ADD CONSTRAINT "training_sections_title_check"
  CHECK (char_length(btrim("title")) BETWEEN 1 AND 250),
  ADD CONSTRAINT "training_sections_title_translations_check"
  CHECK (odookrd_valid_localized_text("title_translations", 250)),
  ADD CONSTRAINT "training_sections_description_translations_check"
  CHECK (odookrd_valid_localized_text("description_translations", 2000));

ALTER TABLE "training_video_assets"
  ADD CONSTRAINT "training_video_assets_filename_check"
  CHECK (char_length(btrim("original_filename")) BETWEEN 1 AND 255),
  ADD CONSTRAINT "training_video_assets_mime_check"
  CHECK (char_length(btrim("mime_type")) BETWEEN 1 AND 150),
  ADD CONSTRAINT "training_video_assets_source_check"
  CHECK (char_length(btrim("source_reference")) BETWEEN 1 AND 2048),
  ADD CONSTRAINT "training_video_assets_dimensions_check"
  CHECK (
    ("size_bytes" IS NULL OR "size_bytes" >= 0)
    AND ("duration_seconds" IS NULL OR "duration_seconds" > 0)
    AND ("width" IS NULL OR "width" > 0)
    AND ("height" IS NULL OR "height" > 0)
  ),
  ADD CONSTRAINT "training_video_assets_local_no_transcoding_check"
  CHECK (
    "provider" <> 'LOCAL'
    OR (
      "status" <> 'PROCESSING'
      AND "media_convert_job_id" IS NULL
    )
  ),
  ADD CONSTRAINT "training_video_assets_aws_ready_manifest_check"
  CHECK (
    "provider" <> 'AWS_S3'
    OR "status" <> 'READY'
    OR "playback_manifest_reference" IS NOT NULL
  ),
  ADD CONSTRAINT "training_video_assets_failure_check"
  CHECK (
    "status" <> 'FAILED'
    OR "failure_code" IS NOT NULL
  );

ALTER TABLE "training_video_lessons"
  ADD CONSTRAINT "training_video_lessons_title_check"
  CHECK (char_length(btrim("title")) BETWEEN 1 AND 250),
  ADD CONSTRAINT "training_video_lessons_title_translations_check"
  CHECK (odookrd_valid_localized_text("title_translations", 250)),
  ADD CONSTRAINT "training_video_lessons_description_translations_check"
  CHECK (odookrd_valid_localized_text("description_translations", 2000)),
  ADD CONSTRAINT "training_video_lessons_caption_tracks_check"
  CHECK (odookrd_valid_localized_text("caption_tracks", 2048));

ALTER TABLE "training_course_company_access"
  ADD CONSTRAINT "training_course_company_access_window_check"
  CHECK (
    "starts_at" IS NULL
    OR "expires_at" IS NULL
    OR "starts_at" < "expires_at"
  );

ALTER TABLE "training_course_service_access"
  ADD CONSTRAINT "training_course_service_access_window_check"
  CHECK (
    "starts_at" IS NULL
    OR "expires_at" IS NULL
    OR "starts_at" < "expires_at"
  );

ALTER TABLE "training_course_user_access"
  ADD CONSTRAINT "training_course_user_access_window_check"
  CHECK (
    "starts_at" IS NULL
    OR "expires_at" IS NULL
    OR "starts_at" < "expires_at"
  );

ALTER TABLE "training_lesson_progress"
  ADD CONSTRAINT "training_lesson_progress_positions_check"
  CHECK (
    "last_position_seconds" >= 0
    AND "furthest_position_seconds" >= "last_position_seconds"
  ),
  ADD CONSTRAINT "training_lesson_progress_completion_check"
  CHECK (
    ("status" = 'COMPLETED' AND "completed_at" IS NOT NULL)
    OR ("status" = 'IN_PROGRESS' AND "completed_at" IS NULL)
  );

ALTER TABLE "training_course_progress"
  ADD CONSTRAINT "training_course_progress_completion_check"
  CHECK (
    ("status" = 'COMPLETED' AND "completed_at" IS NOT NULL)
    OR ("status" = 'IN_PROGRESS' AND "completed_at" IS NULL)
  );

ALTER TABLE "training_quizzes"
  ADD CONSTRAINT "training_quizzes_title_check"
  CHECK (char_length(btrim("title")) BETWEEN 1 AND 250),
  ADD CONSTRAINT "training_quizzes_title_translations_check"
  CHECK (odookrd_valid_localized_text("title_translations", 250)),
  ADD CONSTRAINT "training_quizzes_instruction_translations_check"
  CHECK (odookrd_valid_localized_text("instruction_translations", 2000)),
  ADD CONSTRAINT "training_quizzes_placement_check"
  CHECK (
    ("placement" = 'SECTION' AND "section_id" IS NOT NULL)
    OR ("placement" = 'COURSE_FINAL' AND "section_id" IS NULL)
  ),
  ADD CONSTRAINT "training_quizzes_continue_scope_check"
  CHECK (
    NOT "required_to_continue"
    OR "placement" = 'SECTION'
  );

CREATE UNIQUE INDEX "training_quizzes_section_unique"
  ON "training_quizzes"("section_id")
  WHERE "section_id" IS NOT NULL;

CREATE UNIQUE INDEX "training_quizzes_course_final_unique"
  ON "training_quizzes"("course_id")
  WHERE "placement" = 'COURSE_FINAL';

ALTER TABLE "training_quiz_versions"
  ADD CONSTRAINT "training_quiz_versions_values_check"
  CHECK (
    "version" > 0
    AND "pass_percentage" BETWEEN 0 AND 100
    AND ("max_attempts" IS NULL OR "max_attempts" > 0)
    AND ("time_limit_seconds" IS NULL OR "time_limit_seconds" > 0)
  ),
  ADD CONSTRAINT "training_quiz_versions_publish_state_check"
  CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);

CREATE UNIQUE INDEX "training_quiz_versions_one_published_unique"
  ON "training_quiz_versions"("quiz_id")
  WHERE "status" = 'PUBLISHED';

ALTER TABLE "training_quiz_questions"
  ADD CONSTRAINT "training_quiz_questions_prompt_check"
  CHECK (char_length(btrim("prompt")) BETWEEN 1 AND 2000),
  ADD CONSTRAINT "training_quiz_questions_prompt_translations_check"
  CHECK (odookrd_valid_localized_text("prompt_translations", 2000)),
  ADD CONSTRAINT "training_quiz_questions_explanation_translations_check"
  CHECK (odookrd_valid_localized_text("explanation_translations", 2000)),
  ADD CONSTRAINT "training_quiz_questions_points_check"
  CHECK ("points" > 0);

ALTER TABLE "training_quiz_options"
  ADD CONSTRAINT "training_quiz_options_text_check"
  CHECK (char_length(btrim("text")) BETWEEN 1 AND 1000),
  ADD CONSTRAINT "training_quiz_options_text_translations_check"
  CHECK (odookrd_valid_localized_text("text_translations", 1000));

ALTER TABLE "training_quiz_attempts"
  ADD CONSTRAINT "training_quiz_attempts_values_check"
  CHECK (
    "attempt_number" > 0
    AND ("score" IS NULL OR "score" >= 0)
    AND ("max_score" IS NULL OR "max_score" > 0)
    AND ("score" IS NULL OR "max_score" IS NULL OR "score" <= "max_score")
    AND ("percentage" IS NULL OR "percentage" BETWEEN 0 AND 100)
  ),
  ADD CONSTRAINT "training_quiz_attempts_submission_check"
  CHECK (
    ("status" = 'IN_PROGRESS' AND "submitted_at" IS NULL)
    OR "status" = 'EXPIRED'
    OR ("status" IN ('SUBMITTED', 'PASSED', 'FAILED') AND "submitted_at" IS NOT NULL)
  );

ALTER TABLE "training_quiz_attempt_answers"
  ADD CONSTRAINT "training_quiz_answers_selected_options_check"
  CHECK (jsonb_typeof("selected_option_ids") = 'array'),
  ADD CONSTRAINT "training_quiz_answers_points_check"
  CHECK ("points_awarded" IS NULL OR "points_awarded" >= 0);

ALTER TABLE "training_course_completions"
  ADD CONSTRAINT "training_course_completions_title_check"
  CHECK (char_length(btrim("course_title_snapshot")) BETWEEN 1 AND 250),
  ADD CONSTRAINT "training_course_completions_title_translations_check"
  CHECK (odookrd_valid_localized_text("course_title_translations", 250)),
  ADD CONSTRAINT "training_course_completions_score_check"
  CHECK (
    "final_score_percentage" IS NULL
    OR "final_score_percentage" BETWEEN 0 AND 100
  ),
  ADD CONSTRAINT "training_course_completions_requirement_check"
  CHECK (jsonb_typeof("requirement_snapshot") = 'object');

ALTER TABLE "training_certificates"
  ADD CONSTRAINT "training_certificates_locale_check"
  CHECK ("locale" IN ('ku', 'ar', 'en')),
  ADD CONSTRAINT "training_certificates_score_check"
  CHECK (
    "score_percentage" IS NULL
    OR "score_percentage" BETWEEN 0 AND 100
  ),
  ADD CONSTRAINT "training_certificates_title_translations_check"
  CHECK (odookrd_valid_localized_text("course_title_translations", 250)),
  ADD CONSTRAINT "training_certificates_status_check"
  CHECK (
    (
      "status" = 'ACTIVE'
      AND "revoked_at" IS NULL
      AND "revocation_reason" IS NULL
    )
    OR (
      "status" = 'REVOKED'
      AND "revoked_at" IS NOT NULL
      AND char_length(btrim("revocation_reason")) BETWEEN 1 AND 1000
    )
  ),
  ADD CONSTRAINT "training_certificates_pdf_storage_check"
  CHECK (
    ("pdf_storage_provider" IS NULL AND "pdf_storage_reference" IS NULL)
    OR (
      "pdf_storage_provider" IS NOT NULL
      AND "pdf_storage_reference" IS NOT NULL
    )
  ),
  ADD CONSTRAINT "training_certificates_expiry_check"
  CHECK ("expires_at" IS NULL OR "issued_at" < "expires_at");

-- Every tenant-owned training row must agree with the company user scope.
CREATE FUNCTION odookrd_training_company_user_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  scoped_company_id UUID;
  scoped_account_scope account_scope;
BEGIN
  SELECT "company_id", "account_scope"
  INTO scoped_company_id, scoped_account_scope
  FROM "users"
  WHERE "id" = NEW."user_id";

  IF NOT FOUND
     OR scoped_account_scope <> 'COMPANY'
     OR scoped_company_id IS DISTINCT FROM NEW."company_id" THEN
    RAISE EXCEPTION 'Training user and company scope do not match.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "training_course_user_access_company_user_guard"
BEFORE INSERT OR UPDATE OF "company_id", "user_id"
ON "training_course_user_access"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_company_user_guard();

CREATE TRIGGER "training_lesson_progress_company_user_guard"
BEFORE INSERT OR UPDATE OF "company_id", "user_id"
ON "training_lesson_progress"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_company_user_guard();

CREATE TRIGGER "training_course_progress_company_user_guard"
BEFORE INSERT OR UPDATE OF "company_id", "user_id"
ON "training_course_progress"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_company_user_guard();

CREATE TRIGGER "training_quiz_attempts_company_user_guard"
BEFORE INSERT OR UPDATE OF "company_id", "user_id"
ON "training_quiz_attempts"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_company_user_guard();

CREATE TRIGGER "training_course_completions_company_user_guard"
BEFORE INSERT OR UPDATE OF "company_id", "user_id"
ON "training_course_completions"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_company_user_guard();

CREATE TRIGGER "training_certificates_company_user_guard"
BEFORE INSERT OR UPDATE OF "company_id", "user_id"
ON "training_certificates"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_company_user_guard();

-- Denormalized course identifiers are checked at the database boundary.
CREATE FUNCTION odookrd_training_lesson_scope_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  scoped_course_id UUID;
BEGIN
  SELECT "course_id"
  INTO scoped_course_id
  FROM "training_sections"
  WHERE "id" = NEW."section_id";

  IF NOT FOUND OR scoped_course_id IS DISTINCT FROM NEW."course_id" THEN
    RAISE EXCEPTION 'Training lesson and section course scope do not match.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "training_video_lessons_course_scope_guard"
BEFORE INSERT OR UPDATE OF "course_id", "section_id"
ON "training_video_lessons"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_lesson_scope_guard();

CREATE FUNCTION odookrd_training_quiz_scope_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  scoped_course_id UUID;
BEGIN
  IF NEW."section_id" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT "course_id"
  INTO scoped_course_id
  FROM "training_sections"
  WHERE "id" = NEW."section_id";

  IF NOT FOUND OR scoped_course_id IS DISTINCT FROM NEW."course_id" THEN
    RAISE EXCEPTION 'Training quiz and section course scope do not match.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "training_quizzes_course_scope_guard"
BEFORE INSERT OR UPDATE OF "course_id", "section_id"
ON "training_quizzes"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_quiz_scope_guard();

CREATE FUNCTION odookrd_training_lesson_progress_scope_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  scoped_course_id UUID;
BEGIN
  SELECT "course_id"
  INTO scoped_course_id
  FROM "training_video_lessons"
  WHERE "id" = NEW."lesson_id";

  IF NOT FOUND OR scoped_course_id IS DISTINCT FROM NEW."course_id" THEN
    RAISE EXCEPTION 'Training lesson progress and course scope do not match.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "training_lesson_progress_course_scope_guard"
BEFORE INSERT OR UPDATE OF "course_id", "lesson_id"
ON "training_lesson_progress"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_lesson_progress_scope_guard();

CREATE FUNCTION odookrd_training_course_progress_scope_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  scoped_course_id UUID;
BEGIN
  IF NEW."last_lesson_id" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT "course_id"
  INTO scoped_course_id
  FROM "training_video_lessons"
  WHERE "id" = NEW."last_lesson_id";

  IF NOT FOUND OR scoped_course_id IS DISTINCT FROM NEW."course_id" THEN
    RAISE EXCEPTION 'Continue Learning lesson and course scope do not match.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "training_course_progress_course_scope_guard"
BEFORE INSERT OR UPDATE OF "course_id", "last_lesson_id"
ON "training_course_progress"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_course_progress_scope_guard();

CREATE FUNCTION odookrd_training_quiz_attempt_scope_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  scoped_course_id UUID;
  scoped_quiz_id UUID;
BEGIN
  SELECT "course_id"
  INTO scoped_course_id
  FROM "training_quizzes"
  WHERE "id" = NEW."quiz_id";

  SELECT "quiz_id"
  INTO scoped_quiz_id
  FROM "training_quiz_versions"
  WHERE "id" = NEW."quiz_version_id";

  IF scoped_course_id IS DISTINCT FROM NEW."course_id"
     OR scoped_quiz_id IS DISTINCT FROM NEW."quiz_id" THEN
    RAISE EXCEPTION 'Training quiz attempt scope is invalid.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "training_quiz_attempts_scope_guard"
BEFORE INSERT OR UPDATE OF "course_id", "quiz_id", "quiz_version_id"
ON "training_quiz_attempts"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_quiz_attempt_scope_guard();

CREATE FUNCTION odookrd_training_certificate_scope_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  scoped_company_id UUID;
  scoped_user_id UUID;
  scoped_course_id UUID;
BEGIN
  SELECT "company_id", "user_id", "course_id"
  INTO scoped_company_id, scoped_user_id, scoped_course_id
  FROM "training_course_completions"
  WHERE "id" = NEW."completion_id";

  IF NOT FOUND
     OR scoped_company_id IS DISTINCT FROM NEW."company_id"
     OR scoped_user_id IS DISTINCT FROM NEW."user_id"
     OR scoped_course_id IS DISTINCT FROM NEW."course_id" THEN
    RAISE EXCEPTION 'Training certificate and completion scope do not match.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "training_certificates_completion_scope_guard"
BEFORE INSERT OR UPDATE OF "completion_id", "company_id", "user_id", "course_id"
ON "training_certificates"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_certificate_scope_guard();

-- Package-style access is intentionally limited to Stage 2 TRAINING services.
CREATE FUNCTION odookrd_training_service_access_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  scoped_category service_category;
BEGIN
  SELECT "category"
  INTO scoped_category
  FROM "services"
  WHERE "id" = NEW."service_id";

  IF NOT FOUND OR scoped_category <> 'TRAINING' THEN
    RAISE EXCEPTION 'Training course access requires a TRAINING service.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "training_course_service_access_category_guard"
BEFORE INSERT OR UPDATE OF "service_id"
ON "training_course_service_access"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_service_access_guard();

CREATE FUNCTION odookrd_training_service_category_change_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."category" <> 'TRAINING'
     AND EXISTS (
       SELECT 1
       FROM "training_course_service_access"
       WHERE "service_id" = NEW."id"
     ) THEN
    RAISE EXCEPTION 'A service with training access cannot leave the TRAINING category.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "services_training_access_category_guard"
BEFORE UPDATE OF "category"
ON "services"
FOR EACH ROW EXECUTE FUNCTION odookrd_training_service_category_change_guard();
