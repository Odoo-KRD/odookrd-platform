-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "company_service_id" UUID;

-- CreateIndex
CREATE INDEX "tickets_company_service_idx" ON "tickets"("company_service_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_company_service_id_fkey" FOREIGN KEY ("company_service_id") REFERENCES "company_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
