-- CreateTable
CREATE TABLE "knowledge_article_feedback" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "comment" VARCHAR(2000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "knowledge_article_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_article_feedback_article_helpful_idx" ON "knowledge_article_feedback"("article_id", "helpful");

-- CreateIndex
CREATE INDEX "knowledge_article_feedback_created_idx" ON "knowledge_article_feedback"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_article_feedback_article_user_key" ON "knowledge_article_feedback"("article_id", "user_id");

-- AddForeignKey
ALTER TABLE "knowledge_article_feedback" ADD CONSTRAINT "knowledge_article_feedback_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article_feedback" ADD CONSTRAINT "knowledge_article_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
