-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('OPEN', 'STUDY', 'QUESTION', 'DEBATE');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('DRAFT', 'WAITING', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConversationVisibility" AS ENUM ('PUBLIC', 'UNIVERSITY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ConversationParticipantRole" AS ENUM ('HOST', 'MODERATOR', 'SPEAKER', 'LISTENER');

-- CreateEnum
CREATE TYPE "ConversationSpeakerRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConversationRecordingStatus" AS ENUM ('REQUESTED', 'RECORDING', 'PROCESSING', 'AVAILABLE', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "ConversationMaterialType" AS ENUM ('PDF', 'DOCX', 'PPTX', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ConversationSharedLinkType" AS ENUM ('MEET', 'ZOOM', 'TEAMS', 'DISCORD', 'DOCUMENT', 'VIDEO', 'OTHER');

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'OPEN',
    "status" "ConversationStatus" NOT NULL DEFAULT 'WAITING',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "course" TEXT,
    "rules" TEXT,
    "visibility" "ConversationVisibility" NOT NULL DEFAULT 'PUBLIC',
    "max_participants" INTEGER NOT NULL DEFAULT 50,
    "max_speakers" INTEGER NOT NULL DEFAULT 5,
    "allow_listeners" BOOLEAN NOT NULL DEFAULT true,
    "allow_raise_hand" BOOLEAN NOT NULL DEFAULT true,
    "recording_enabled" BOOLEAN NOT NULL DEFAULT false,
    "allow_new_stances" BOOLEAN NOT NULL DEFAULT true,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "livekit_room_name" TEXT NOT NULL,
    "conclusion" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "university_id" INTEGER,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "ConversationParticipantRole" NOT NULL DEFAULT 'LISTENER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "total_speaking_seconds" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_speaker_requests" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" "ConversationSpeakerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" INTEGER,

    CONSTRAINT "conversation_speaker_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_invites" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_bans" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "banned_by_id" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "conversation_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_materials" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ConversationMaterialType" NOT NULL DEFAULT 'OTHER',
    "object_key" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_shared_links" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" "ConversationSharedLinkType" NOT NULL DEFAULT 'OTHER',
    "shared_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_shared_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_recordings" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "status" "ConversationRecordingStatus" NOT NULL DEFAULT 'REQUESTED',
    "object_key" TEXT,
    "file_url" TEXT,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "size_bytes" INTEGER NOT NULL DEFAULT 0,
    "mime_type" TEXT NOT NULL DEFAULT 'audio/mpeg',
    "plays" INTEGER NOT NULL DEFAULT 0,
    "egress_id" TEXT,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversation_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_debate_stances" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_debate_stances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_debate_memberships" (
    "id" SERIAL NOT NULL,
    "stance_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_debate_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_debate_arguments" (
    "id" SERIAL NOT NULL,
    "stance_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversation_debate_arguments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_companion_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "courses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availability_text" TEXT,
    "available_for_voice" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_companion_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_start_subscriptions" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_at" TIMESTAMP(3),

    CONSTRAINT "conversation_start_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_slug_key" ON "conversations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_livekit_room_name_key" ON "conversations"("livekit_room_name");

-- CreateIndex
CREATE INDEX "conversations_created_by_id_idx" ON "conversations"("created_by_id");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_type_idx" ON "conversations"("type");

-- CreateIndex
CREATE INDEX "conversations_visibility_idx" ON "conversations"("visibility");

-- CreateIndex
CREATE INDEX "conversations_category_idx" ON "conversations"("category");

-- CreateIndex
CREATE INDEX "conversations_university_id_idx" ON "conversations"("university_id");

-- CreateIndex
CREATE INDEX "conversations_created_at_idx" ON "conversations"("created_at");

-- CreateIndex
CREATE INDEX "conversations_status_created_at_id_idx" ON "conversations"("status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "conversations_type_status_created_at_idx" ON "conversations"("type", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "conversation_participants_user_id_idx" ON "conversation_participants"("user_id");

-- CreateIndex
CREATE INDEX "conversation_participants_conversation_id_role_idx" ON "conversation_participants"("conversation_id", "role");

-- CreateIndex
CREATE INDEX "conversation_participants_left_at_idx" ON "conversation_participants"("left_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "conversation_speaker_requests_conversation_id_status_idx" ON "conversation_speaker_requests"("conversation_id", "status");

-- CreateIndex
CREATE INDEX "conversation_speaker_requests_user_id_idx" ON "conversation_speaker_requests"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_speaker_requests_conversation_id_user_id_key" ON "conversation_speaker_requests"("conversation_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_invites_token_hash_key" ON "conversation_invites"("token_hash");

-- CreateIndex
CREATE INDEX "conversation_invites_conversation_id_idx" ON "conversation_invites"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_invites_expires_at_idx" ON "conversation_invites"("expires_at");

-- CreateIndex
CREATE INDEX "conversation_bans_user_id_idx" ON "conversation_bans"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_bans_conversation_id_user_id_key" ON "conversation_bans"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "conversation_materials_conversation_id_idx" ON "conversation_materials"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_shared_links_conversation_id_idx" ON "conversation_shared_links"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_recordings_conversation_id_idx" ON "conversation_recordings"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_recordings_status_idx" ON "conversation_recordings"("status");

-- CreateIndex
CREATE INDEX "conversation_recordings_created_at_idx" ON "conversation_recordings"("created_at");

-- CreateIndex
CREATE INDEX "conversation_debate_stances_conversation_id_idx" ON "conversation_debate_stances"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_debate_memberships_user_id_idx" ON "conversation_debate_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_debate_memberships_stance_id_user_id_key" ON "conversation_debate_memberships"("stance_id", "user_id");

-- CreateIndex
CREATE INDEX "conversation_debate_arguments_stance_id_idx" ON "conversation_debate_arguments"("stance_id");

-- CreateIndex
CREATE INDEX "conversation_debate_arguments_author_id_idx" ON "conversation_debate_arguments"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_companion_profiles_user_id_key" ON "conversation_companion_profiles"("user_id");

-- CreateIndex
CREATE INDEX "conversation_companion_profiles_is_active_idx" ON "conversation_companion_profiles"("is_active");

-- CreateIndex
CREATE INDEX "conversation_companion_profiles_available_for_voice_idx" ON "conversation_companion_profiles"("available_for_voice");

-- CreateIndex
CREATE INDEX "conversation_start_subscriptions_user_id_idx" ON "conversation_start_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "conversation_start_subscriptions_notified_at_idx" ON "conversation_start_subscriptions"("notified_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_start_subscriptions_conversation_id_user_id_key" ON "conversation_start_subscriptions"("conversation_id", "user_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_speaker_requests" ADD CONSTRAINT "conversation_speaker_requests_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_speaker_requests" ADD CONSTRAINT "conversation_speaker_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_speaker_requests" ADD CONSTRAINT "conversation_speaker_requests_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_invites" ADD CONSTRAINT "conversation_invites_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_invites" ADD CONSTRAINT "conversation_invites_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_bans" ADD CONSTRAINT "conversation_bans_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_bans" ADD CONSTRAINT "conversation_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_bans" ADD CONSTRAINT "conversation_bans_banned_by_id_fkey" FOREIGN KEY ("banned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_materials" ADD CONSTRAINT "conversation_materials_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_materials" ADD CONSTRAINT "conversation_materials_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_shared_links" ADD CONSTRAINT "conversation_shared_links_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_shared_links" ADD CONSTRAINT "conversation_shared_links_shared_by_id_fkey" FOREIGN KEY ("shared_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_recordings" ADD CONSTRAINT "conversation_recordings_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_debate_stances" ADD CONSTRAINT "conversation_debate_stances_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_debate_stances" ADD CONSTRAINT "conversation_debate_stances_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_debate_memberships" ADD CONSTRAINT "conversation_debate_memberships_stance_id_fkey" FOREIGN KEY ("stance_id") REFERENCES "conversation_debate_stances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_debate_memberships" ADD CONSTRAINT "conversation_debate_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_debate_arguments" ADD CONSTRAINT "conversation_debate_arguments_stance_id_fkey" FOREIGN KEY ("stance_id") REFERENCES "conversation_debate_stances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_debate_arguments" ADD CONSTRAINT "conversation_debate_arguments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_companion_profiles" ADD CONSTRAINT "conversation_companion_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_start_subscriptions" ADD CONSTRAINT "conversation_start_subscriptions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_start_subscriptions" ADD CONSTRAINT "conversation_start_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

