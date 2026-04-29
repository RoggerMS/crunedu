-- Add composite indexes for hot read paths:
-- 1) Comments listing by post in chronological order
-- 2) Followers/following lists ordered by recent activity

CREATE INDEX "comments_post_id_status_created_at_idx"
  ON "comments"("post_id", "status", "created_at");

CREATE INDEX "follows_following_id_created_at_follower_id_idx"
  ON "follows"("following_id", "created_at" DESC, "follower_id");

CREATE INDEX "follows_follower_id_created_at_following_id_idx"
  ON "follows"("follower_id", "created_at" DESC, "following_id");
