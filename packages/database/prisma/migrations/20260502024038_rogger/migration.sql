/*
  Warnings:

  - The values [NEW,CLOSED] on the enum `InquiryStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InquiryStatus_new" AS ENUM ('PENDING', 'CONTACTED', 'RESOLVED', 'CANCELLED');
ALTER TABLE "product_inquiries" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "product_inquiries" ALTER COLUMN "status" TYPE "InquiryStatus_new" USING ("status"::text::"InquiryStatus_new");
ALTER TYPE "InquiryStatus" RENAME TO "InquiryStatus_old";
ALTER TYPE "InquiryStatus_new" RENAME TO "InquiryStatus";
DROP TYPE "InquiryStatus_old";
ALTER TABLE "product_inquiries" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "rules" TEXT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "course" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "cycle" TEXT;

-- AlterTable
ALTER TABLE "product_inquiries" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "contact_click_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_sanctions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_images" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_sanctions_user_id_is_active_idx" ON "user_sanctions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_sanctions_type_idx" ON "user_sanctions"("type");

-- CreateIndex
CREATE INDEX "post_images_post_id_idx" ON "post_images"("post_id");

-- CreateIndex
CREATE INDEX "communities_status_created_at_idx" ON "communities"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "documents_status_created_at_id_idx" ON "documents"("status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "documents_community_id_status_created_at_id_idx" ON "documents"("community_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "posts_status_created_at_id_idx" ON "posts"("status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "posts_community_id_status_created_at_id_idx" ON "posts"("community_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "questions_status_created_at_id_idx" ON "questions"("status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "questions_community_id_status_created_at_id_idx" ON "questions"("community_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at" ASC);

-- AddForeignKey
ALTER TABLE "user_sanctions" ADD CONSTRAINT "user_sanctions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_images" ADD CONSTRAINT "post_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
