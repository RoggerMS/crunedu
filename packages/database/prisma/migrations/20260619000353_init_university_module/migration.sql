-- CreateEnum
CREATE TYPE "UniversityContentType" AS ENUM ('EVENTO', 'CONVOCATORIA', 'TRAMITE', 'SERVICIO', 'GUIA', 'AVISO');

-- CreateEnum
CREATE TYPE "UniversityContentVisibility" AS ENUM ('PUBLICO', 'OFICIAL', 'SUGERIDO');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "university_contents" (
    "id" SERIAL NOT NULL,
    "type" "UniversityContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "visibility" "UniversityContentVisibility" NOT NULL DEFAULT 'PUBLICO',
    "statusTags" JSONB NOT NULL DEFAULT '[]',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "time" TEXT,
    "location" TEXT,
    "cost" TEXT,
    "icon" TEXT,
    "steps" JSONB,
    "documents" JSONB,
    "schedule" TEXT,
    "warning" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_type" TEXT,
    "file_size" INTEGER,
    "external_url" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "saves_count" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_suggestions" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT '',
    "date" TIMESTAMP(3),
    "location" TEXT,
    "external_url" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "university_contents_type_idx" ON "university_contents"("type");

-- CreateIndex
CREATE INDEX "university_contents_status_idx" ON "university_contents"("status");

-- CreateIndex
CREATE INDEX "university_contents_visibility_idx" ON "university_contents"("visibility");

-- CreateIndex
CREATE INDEX "university_contents_created_at_idx" ON "university_contents"("created_at");

-- CreateIndex
CREATE INDEX "university_contents_type_status_created_at_idx" ON "university_contents"("type", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "university_suggestions_status_idx" ON "university_suggestions"("status");

-- CreateIndex
CREATE INDEX "university_suggestions_user_id_idx" ON "university_suggestions"("user_id");

-- CreateIndex
CREATE INDEX "university_suggestions_status_created_at_idx" ON "university_suggestions"("status", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "university_contents" ADD CONSTRAINT "university_contents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_suggestions" ADD CONSTRAINT "university_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
