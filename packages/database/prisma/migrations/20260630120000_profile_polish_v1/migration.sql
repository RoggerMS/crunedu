CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'FRIENDS', 'ONLY_ME');

ALTER TABLE "profiles"
  ADD COLUMN "username" TEXT,
  ADD COLUMN "headline" TEXT,
  ADD COLUMN "cover_url" TEXT,
  ADD COLUMN "cover_storage_key" TEXT,
  ADD COLUMN "cover_position_y" INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN "current_city" TEXT,
  ADD COLUMN "hometown" TEXT;

ALTER TABLE "posts"
  ADD COLUMN "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC';

CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");
CREATE INDEX "posts_visibility_idx" ON "posts"("visibility");
