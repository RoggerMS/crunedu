-- CreateEnum
CREATE TYPE "MomentType" AS ENUM ('NOW', 'ALERT', 'FOOD', 'HUMOR', 'EVENT', 'CAMPUS', 'COMMUNITY', 'LOST_FOUND');

-- CreateTable
CREATE TABLE "moments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MomentType" NOT NULL DEFAULT 'NOW',
    "location" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_media" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moment_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "moment_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_tag_assignments" (
    "moment_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "moment_tag_assignments_pkey" PRIMARY KEY ("moment_id","tag_id")
);

-- CreateTable
CREATE TABLE "moment_boosts" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moment_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_confirmations" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moment_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_moments" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_comments" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "moment_tags_name_key" ON "moment_tags"("name");
CREATE UNIQUE INDEX "moment_tags_slug_key" ON "moment_tags"("slug");
CREATE UNIQUE INDEX "moment_boosts_moment_id_user_id_key" ON "moment_boosts"("moment_id", "user_id");
CREATE UNIQUE INDEX "moment_confirmations_moment_id_user_id_key" ON "moment_confirmations"("moment_id", "user_id");
CREATE UNIQUE INDEX "saved_moments_moment_id_user_id_key" ON "saved_moments"("moment_id", "user_id");

-- CreateIndex
CREATE INDEX "moments_user_id_idx" ON "moments"("user_id");
CREATE INDEX "moments_status_idx" ON "moments"("status");
CREATE INDEX "moments_created_at_idx" ON "moments"("created_at");
CREATE INDEX "moments_expires_at_idx" ON "moments"("expires_at");
CREATE INDEX "moments_type_idx" ON "moments"("type");
CREATE INDEX "moments_location_idx" ON "moments"("location");
CREATE INDEX "moments_status_created_at_id_idx" ON "moments"("status", "created_at"(DESC), "id"(DESC));
CREATE INDEX "moments_status_expires_at_idx" ON "moments"("status", "expires_at");

CREATE INDEX "moment_media_moment_id_idx" ON "moment_media"("moment_id");
CREATE INDEX "moment_tag_assignments_tag_id_idx" ON "moment_tag_assignments"("tag_id");
CREATE INDEX "moment_boosts_user_id_idx" ON "moment_boosts"("user_id");
CREATE INDEX "moment_confirmations_user_id_idx" ON "moment_confirmations"("user_id");
CREATE INDEX "saved_moments_user_id_idx" ON "saved_moments"("user_id");

CREATE INDEX "moment_comments_moment_id_idx" ON "moment_comments"("moment_id");
CREATE INDEX "moment_comments_user_id_idx" ON "moment_comments"("user_id");
CREATE INDEX "moment_comments_status_idx" ON "moment_comments"("status");
CREATE INDEX "moment_comments_moment_id_status_created_at_idx" ON "moment_comments"("moment_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "moment_media" ADD CONSTRAINT "moment_media_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "moment_tag_assignments" ADD CONSTRAINT "moment_tag_assignments_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moment_tag_assignments" ADD CONSTRAINT "moment_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "moment_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "moment_boosts" ADD CONSTRAINT "moment_boosts_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moment_boosts" ADD CONSTRAINT "moment_boosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "moment_confirmations" ADD CONSTRAINT "moment_confirmations_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moment_confirmations" ADD CONSTRAINT "moment_confirmations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_moments" ADD CONSTRAINT "saved_moments_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_moments" ADD CONSTRAINT "saved_moments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddColumn to reports
ALTER TABLE "reports" ADD COLUMN "moment_id" INTEGER;

-- CreateIndex
CREATE INDEX "reports_moment_id_idx" ON "reports"("moment_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
