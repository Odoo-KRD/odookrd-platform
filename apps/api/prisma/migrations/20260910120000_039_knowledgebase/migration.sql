BEGIN;

-- Trigram matching is what makes Kurdish search usable. Postgres ships no
-- Kurdish text-search configuration, so Sorani falls back to 'simple' and gets
-- no stemming; trigrams are language-agnostic and catch partial words and
-- typos that stemming would otherwise have handled.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Arabic is frequently written with and without diacritics. Without this,
-- searching "الدفع" would not match "الدَّفع".
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TYPE "knowledge_category_status" AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE TYPE "knowledge_article_status" AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED'
);

CREATE TABLE "knowledge_categories" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(160) NOT NULL,
  "parent_id" UUID,
  "name" VARCHAR(200) NOT NULL,
  "name_translations" JSONB NOT NULL DEFAULT '{}',
  "description" VARCHAR(1000),
  "description_translations" JSONB NOT NULL DEFAULT '{}',
  "status" "knowledge_category_status" NOT NULL DEFAULT 'ACTIVE',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "knowledge_categories_pkey" PRIMARY KEY ("id"),
  -- A category cannot be its own parent. Deeper cycles and the two-level rule
  -- are enforced in the service; this catches the trivial case at the source.
  CONSTRAINT "knowledge_categories_not_self_parent"
    CHECK ("parent_id" IS NULL OR "parent_id" <> "id")
);

CREATE UNIQUE INDEX "knowledge_categories_slug_key"
  ON "knowledge_categories"("slug");
CREATE INDEX "knowledge_categories_parent_sort_idx"
  ON "knowledge_categories"("parent_id", "sort_order");
CREATE INDEX "knowledge_categories_status_idx"
  ON "knowledge_categories"("status");

ALTER TABLE "knowledge_categories"
  ADD CONSTRAINT "knowledge_categories_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "knowledge_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "knowledge_articles" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(200) NOT NULL,
  "category_id" UUID NOT NULL,
  "title" VARCHAR(250) NOT NULL,
  "title_translations" JSONB NOT NULL DEFAULT '{}',
  "excerpt" VARCHAR(500),
  "excerpt_translations" JSONB NOT NULL DEFAULT '{}',
  "body" JSONB NOT NULL DEFAULT '{}',
  "status" "knowledge_article_status" NOT NULL DEFAULT 'DRAFT',
  "published_at" TIMESTAMPTZ(6),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "search_text_ku" TEXT NOT NULL DEFAULT '',
  "search_text_ar" TEXT NOT NULL DEFAULT '',
  "search_text_en" TEXT NOT NULL DEFAULT '',
  "author_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id"),
  -- A published article must record when, so ordering by recency is reliable.
  CONSTRAINT "knowledge_articles_published_has_date"
    CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL)
);

CREATE UNIQUE INDEX "knowledge_articles_slug_key"
  ON "knowledge_articles"("slug");
CREATE INDEX "knowledge_articles_category_sort_idx"
  ON "knowledge_articles"("category_id", "sort_order");
CREATE INDEX "knowledge_articles_status_published_idx"
  ON "knowledge_articles"("status", "published_at" DESC);
CREATE INDEX "knowledge_articles_author_idx"
  ON "knowledge_articles"("author_user_id");

ALTER TABLE "knowledge_articles"
  ADD CONSTRAINT "knowledge_articles_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "knowledge_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "knowledge_articles"
  ADD CONSTRAINT "knowledge_articles_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Full text search, one configuration per language.
--
-- English and Arabic get stemming from their own configurations. Kurdish uses
-- 'simple', which tokenises without stemming, because Postgres has no Sorani
-- dictionary. Expression indexes rather than generated columns: Prisma does
-- not model either, and expressions keep the table definition something Prisma
-- can still describe accurately.
CREATE INDEX "knowledge_articles_fts_en_idx"
  ON "knowledge_articles"
  USING GIN (to_tsvector('english', "search_text_en"));

CREATE INDEX "knowledge_articles_fts_ar_idx"
  ON "knowledge_articles"
  USING GIN (to_tsvector('arabic', "search_text_ar"));

CREATE INDEX "knowledge_articles_fts_ku_idx"
  ON "knowledge_articles"
  USING GIN (to_tsvector('simple', "search_text_ku"));

-- Trigram matching, the second signal. Carries Kurdish where stemming cannot,
-- and makes every language tolerant of partial words and misspellings.
CREATE INDEX "knowledge_articles_trgm_ku_idx"
  ON "knowledge_articles" USING GIN ("search_text_ku" gin_trgm_ops);
CREATE INDEX "knowledge_articles_trgm_ar_idx"
  ON "knowledge_articles" USING GIN ("search_text_ar" gin_trgm_ops);
CREATE INDEX "knowledge_articles_trgm_en_idx"
  ON "knowledge_articles" USING GIN ("search_text_en" gin_trgm_ops);

COMMIT;
