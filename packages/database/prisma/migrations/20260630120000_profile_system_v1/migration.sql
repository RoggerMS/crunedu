-- Extended profile system: avatar/cover, username, personal info, post visibility, profile info tables

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'FRIENDS', 'ONLY_ME');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'FRIENDS', 'ONLY_ME');

-- CreateEnum
CREATE TYPE "BirthDateDisplay" AS ENUM ('FULL', 'DAY_MONTH', 'YEAR', 'HIDDEN');

-- CreateEnum
CREATE TYPE "FeaturedEntityType" AS ENUM ('POST', 'MOMENT', 'QUESTION', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ProfileSectionKey" AS ENUM ('FEATURED', 'FRIENDS', 'COMMUNITIES', 'PHOTOS', 'EDUCATION', 'EMPLOYMENT', 'INTERESTS');

-- AddColumnsToProfile
ALTER TABLE "profiles" ADD COLUMN "username" TEXT;
ALTER TABLE "profiles" ADD COLUMN "headline" TEXT;
ALTER TABLE "profiles" ADD COLUMN "cover_url" TEXT;
ALTER TABLE "profiles" ADD COLUMN "cover_storage_key" TEXT;
ALTER TABLE "profiles" ADD COLUMN "cover_position_y" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "profiles" ADD COLUMN "current_city" TEXT;
ALTER TABLE "profiles" ADD COLUMN "hometown" TEXT;
ALTER TABLE "profiles" ADD COLUMN "birth_date" TIMESTAMP(3);
ALTER TABLE "profiles" ADD COLUMN "birth_date_display" "BirthDateDisplay" NOT NULL DEFAULT 'HIDDEN';
ALTER TABLE "profiles" ADD COLUMN "gender" TEXT;
ALTER TABLE "profiles" ADD COLUMN "pronouns" TEXT;
ALTER TABLE "profiles" ADD COLUMN "relationship_status" TEXT;
ALTER TABLE "profiles" ADD COLUMN "other_names" TEXT;
ALTER TABLE "profiles" ADD COLUMN "favorite_quote" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");
CREATE INDEX "profiles_username_idx" ON "profiles"("username");

-- AddColumnToPost
ALTER TABLE "posts" ADD COLUMN "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC';

-- Backfill existing posts as PUBLIC (already default, but explicit for safety)
UPDATE "posts" SET "visibility" = 'PUBLIC' WHERE "visibility" IS NULL;

-- CreateIndex on posts visibility
CREATE INDEX "posts_visibility_idx" ON "posts"("visibility");
CREATE INDEX "posts_userId_status_createdAt_desc_id_desc_idx" ON "posts"("user_id", "status", "created_at" DESC, "id" DESC);

-- CreateTable: profile_education
CREATE TABLE "profile_education" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "institution" TEXT NOT NULL,
    "program" TEXT,
    "degree" TEXT,
    "field" TEXT,
    "start_year" INTEGER,
    "end_year" INTEGER,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "location" TEXT,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_education_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_education_profile_id_idx" ON "profile_education"("profile_id");
ALTER TABLE "profile_education" ADD CONSTRAINT "profile_education_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: profile_employment
CREATE TABLE "profile_employment" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "modality" TEXT,
    "location" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_employment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_employment_profile_id_idx" ON "profile_employment"("profile_id");
ALTER TABLE "profile_employment" ADD CONSTRAINT "profile_employment_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: profile_interests
CREATE TABLE "profile_interests" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_interests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_interests_profile_id_category_value_key" ON "profile_interests"("profile_id", "category", "value");
CREATE INDEX "profile_interests_profile_id_idx" ON "profile_interests"("profile_id");
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: profile_languages
CREATE TABLE "profile_languages" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_languages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_languages_profile_id_name_key" ON "profile_languages"("profile_id", "name");
CREATE INDEX "profile_languages_profile_id_idx" ON "profile_languages"("profile_id");
ALTER TABLE "profile_languages" ADD CONSTRAINT "profile_languages_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: profile_links
CREATE TABLE "profile_links" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'ONLY_ME',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_links_profile_id_idx" ON "profile_links"("profile_id");
ALTER TABLE "profile_links" ADD CONSTRAINT "profile_links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: profile_places
CREATE TABLE "profile_places" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "district" TEXT,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'FOLLOWERS',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_places_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_places_profile_id_idx" ON "profile_places"("profile_id");
ALTER TABLE "profile_places" ADD CONSTRAINT "profile_places_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: profile_custom_details
CREATE TABLE "profile_custom_details" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'ONLY_ME',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_custom_details_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_custom_details_profile_id_idx" ON "profile_custom_details"("profile_id");
ALTER TABLE "profile_custom_details" ADD CONSTRAINT "profile_custom_details_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: profile_featured_items
CREATE TABLE "profile_featured_items" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "entity_type" "FeaturedEntityType" NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_featured_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_featured_items_profile_id_entity_type_entity_id_key" ON "profile_featured_items"("profile_id", "entity_type", "entity_id");
CREATE INDEX "profile_featured_items_profile_id_idx" ON "profile_featured_items"("profile_id");
ALTER TABLE "profile_featured_items" ADD CONSTRAINT "profile_featured_items_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile_featured_items" ADD CONSTRAINT "profile_featured_items_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: profile_section_settings
CREATE TABLE "profile_section_settings" (
    "profile_id" INTEGER NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "friends" BOOLEAN NOT NULL DEFAULT true,
    "communities" BOOLEAN NOT NULL DEFAULT true,
    "photos" BOOLEAN NOT NULL DEFAULT true,
    "education" BOOLEAN NOT NULL DEFAULT true,
    "employment" BOOLEAN NOT NULL DEFAULT true,
    "interests" BOOLEAN NOT NULL DEFAULT true,
    "featured_order" INTEGER NOT NULL DEFAULT 0,
    "friends_order" INTEGER NOT NULL DEFAULT 1,
    "communities_order" INTEGER NOT NULL DEFAULT 2,
    "photos_order" INTEGER NOT NULL DEFAULT 3,
    "education_order" INTEGER NOT NULL DEFAULT 4,
    "employment_order" INTEGER NOT NULL DEFAULT 5,
    "interests_order" INTEGER NOT NULL DEFAULT 6,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_section_settings_pkey" PRIMARY KEY ("profile_id")
);

ALTER TABLE "profile_section_settings" ADD CONSTRAINT "profile_section_settings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: profile_privacy_settings
CREATE TABLE "profile_privacy_settings" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "bio" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "academic_info" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "current_city" "ProfileVisibility" NOT NULL DEFAULT 'FOLLOWERS',
    "birth_date" "ProfileVisibility" NOT NULL DEFAULT 'ONLY_ME',
    "contact" "ProfileVisibility" NOT NULL DEFAULT 'ONLY_ME',
    "relationship" "ProfileVisibility" NOT NULL DEFAULT 'ONLY_ME',
    "friends" "ProfileVisibility" NOT NULL DEFAULT 'FRIENDS',
    "communities" "ProfileVisibility" NOT NULL DEFAULT 'FOLLOWERS',
    "followers_list" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "following_list" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_privacy_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "profile_privacy_settings" ADD CONSTRAINT "profile_privacy_settings_profile_id_key" UNIQUE ("profile_id");
ALTER TABLE "profile_privacy_settings" ADD CONSTRAINT "profile_privacy_settings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
