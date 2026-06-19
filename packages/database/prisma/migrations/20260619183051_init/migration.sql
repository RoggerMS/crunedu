-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PUBLIC', 'COMMUNITY', 'PRIVATE');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "downloads_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "material_type" TEXT,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "original_name" TEXT,
ADD COLUMN     "views_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visibility" "DocumentVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "document_id" INTEGER;

-- CreateTable
CREATE TABLE "saved_documents" (
    "document_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_documents_pkey" PRIMARY KEY ("document_id","user_id")
);

-- CreateTable
CREATE TABLE "document_ratings" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_documents_user_id_idx" ON "saved_documents"("user_id");

-- CreateIndex
CREATE INDEX "document_ratings_document_id_idx" ON "document_ratings"("document_id");

-- CreateIndex
CREATE INDEX "document_ratings_user_id_idx" ON "document_ratings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_ratings_document_id_user_id_key" ON "document_ratings"("document_id", "user_id");

-- CreateIndex
CREATE INDEX "documents_visibility_idx" ON "documents"("visibility");

-- CreateIndex
CREATE INDEX "documents_course_idx" ON "documents"("course");

-- CreateIndex
CREATE INDEX "posts_document_id_idx" ON "posts"("document_id");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_documents" ADD CONSTRAINT "saved_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_documents" ADD CONSTRAINT "saved_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_ratings" ADD CONSTRAINT "document_ratings_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_ratings" ADD CONSTRAINT "document_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
