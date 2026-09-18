BEGIN;

-- Stage 5A addendum, ahead of 5B.
--
--   1. `body` becomes `body_translations`, matching the `_translations`
--      suffix every other localized field in the schema carries.
--   2. `tags_translations` is added: a locale map of string arrays, folded
--      into search_text_<locale> at write time alongside title, excerpt and
--      body. No tag table -- nothing browses or filters by tag.
--   3. `unaccent` is dropped. It was created for Arabic diacritic folding but
--      never used: unaccent() is STABLE and cannot appear in an index
--      expression without a custom IMMUTABLE wrapper. Diacritics are stripped
--      in the service when search_text_ar is built.

ALTER TABLE "knowledge_articles"
  RENAME COLUMN "body" TO "body_translations";

ALTER TABLE "knowledge_articles"
  ADD COLUMN "tags_translations" JSONB NOT NULL DEFAULT '{}';

DROP EXTENSION IF EXISTS unaccent;

COMMIT;
