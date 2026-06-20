-- Create calendar enums for Universidad hub
CREATE TYPE "UniversityItemType" AS ENUM ('PROCEDURE', 'CALL', 'EVENT', 'SERVICE', 'GUIDE', 'NOTICE', 'ACADEMIC', 'PAYMENT', 'SCHOLARSHIP', 'CULTURE', 'SPORTS', 'WELLBEING');
CREATE TYPE "UniversityItemStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED', 'REJECTED');
CREATE TYPE "UniversityItemModality" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID', 'NOT_APPLICABLE');
CREATE TYPE "UniversityItemPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT', 'CRITICAL');

-- Extend existing Universidad content without dropping current data
ALTER TABLE "university_contents" ADD COLUMN "category_id" INTEGER;
ALTER TABLE "university_contents" ADD COLUMN "area_id" INTEGER;
ALTER TABLE "university_contents" ADD COLUMN "priority" TEXT DEFAULT 'normal';
ALTER TABLE "university_contents" ADD COLUMN "source_url" TEXT;
ALTER TABLE "university_contents" ADD COLUMN "official_url" TEXT;
ALTER TABLE "university_contents" ADD COLUMN "contact_email" TEXT;
ALTER TABLE "university_contents" ADD COLUMN "contact_phone" TEXT;
ALTER TABLE "university_contents" ADD COLUMN "modality" TEXT DEFAULT 'presencial';
ALTER TABLE "university_contents" ADD COLUMN "capacity" INTEGER;
ALTER TABLE "university_contents" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Lima';
ALTER TABLE "university_contents" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Normalized categories and areas
CREATE TABLE "university_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "university_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "university_areas" (
    "id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "website" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "university_areas_pkey" PRIMARY KEY ("id")
);

-- Calendar items, occurrences, saves and reminders
CREATE TABLE "university_calendar_items" (
    "id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "area_id" INTEGER,
    "created_by_id" INTEGER NOT NULL,
    "type" "UniversityItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT NOT NULL,
    "modality" "UniversityItemModality" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "status" "UniversityItemStatus" NOT NULL DEFAULT 'PUBLISHED',
    "priority" "UniversityItemPriority" NOT NULL DEFAULT 'NORMAL',
    "source_url" TEXT,
    "official_url" TEXT,
    "location_name" TEXT,
    "online_url" TEXT,
    "price" DECIMAL(10,2),
    "capacity" INTEGER,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/Lima',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "save_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "university_calendar_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "university_calendar_occurrences" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "status" "UniversityItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "location_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "university_calendar_occurrences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "university_saved_items" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "university_saved_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "university_reminders" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "university_reminders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "university_content_saved" (
    "id" SERIAL NOT NULL,
    "content_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "university_content_saved_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "university_audit_logs" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "university_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes and unique constraints
CREATE UNIQUE INDEX "university_categories_slug_key" ON "university_categories"("slug");
CREATE UNIQUE INDEX "university_areas_university_id_slug_key" ON "university_areas"("university_id", "slug");
CREATE UNIQUE INDEX "university_calendar_items_slug_key" ON "university_calendar_items"("slug");
CREATE UNIQUE INDEX "university_saved_items_item_id_user_id_key" ON "university_saved_items"("item_id", "user_id");
CREATE UNIQUE INDEX "university_content_saved_content_id_user_id_key" ON "university_content_saved"("content_id", "user_id");

CREATE INDEX "university_contents_category_id_idx" ON "university_contents"("category_id");
CREATE INDEX "university_contents_area_id_idx" ON "university_contents"("area_id");
CREATE INDEX "university_contents_priority_idx" ON "university_contents"("priority");
CREATE INDEX "university_contents_status_deleted_at_idx" ON "university_contents"("status", "deleted_at");
CREATE INDEX "university_areas_university_id_idx" ON "university_areas"("university_id");
CREATE INDEX "university_calendar_items_university_id_idx" ON "university_calendar_items"("university_id");
CREATE INDEX "university_calendar_items_starts_at_idx" ON "university_calendar_items"("starts_at");
CREATE INDEX "university_calendar_items_status_type_idx" ON "university_calendar_items"("status", "type");
CREATE INDEX "university_calendar_occurrences_item_id_idx" ON "university_calendar_occurrences"("item_id");
CREATE INDEX "university_calendar_occurrences_starts_at_ends_at_idx" ON "university_calendar_occurrences"("starts_at", "ends_at");
CREATE INDEX "university_saved_items_user_id_idx" ON "university_saved_items"("user_id");
CREATE INDEX "university_reminders_user_id_idx" ON "university_reminders"("user_id");
CREATE INDEX "university_reminders_remind_at_is_sent_idx" ON "university_reminders"("remind_at", "is_sent");
CREATE INDEX "university_content_saved_user_id_idx" ON "university_content_saved"("user_id");
CREATE INDEX "university_audit_logs_entity_type_entity_id_idx" ON "university_audit_logs"("entity_type", "entity_id");
CREATE INDEX "university_audit_logs_user_id_idx" ON "university_audit_logs"("user_id");
CREATE INDEX "university_audit_logs_created_at_idx" ON "university_audit_logs"("created_at");

-- Foreign keys
ALTER TABLE "university_contents" ADD CONSTRAINT "university_contents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "university_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "university_contents" ADD CONSTRAINT "university_contents_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "university_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "university_areas" ADD CONSTRAINT "university_areas_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_calendar_items" ADD CONSTRAINT "university_calendar_items_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "university_calendar_items" ADD CONSTRAINT "university_calendar_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "university_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "university_calendar_items" ADD CONSTRAINT "university_calendar_items_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "university_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "university_calendar_items" ADD CONSTRAINT "university_calendar_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "university_calendar_occurrences" ADD CONSTRAINT "university_calendar_occurrences_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "university_calendar_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_saved_items" ADD CONSTRAINT "university_saved_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "university_calendar_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_saved_items" ADD CONSTRAINT "university_saved_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_reminders" ADD CONSTRAINT "university_reminders_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "university_calendar_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_reminders" ADD CONSTRAINT "university_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_content_saved" ADD CONSTRAINT "university_content_saved_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "university_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_content_saved" ADD CONSTRAINT "university_content_saved_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_audit_logs" ADD CONSTRAINT "university_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
