-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "template_variables" JSONB NOT NULL DEFAULT '{}';
