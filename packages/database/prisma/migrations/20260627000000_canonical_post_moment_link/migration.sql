-- Post: add feed visibility + counters
ALTER TABLE "posts" ADD COLUMN "in_feed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "posts" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "posts" ADD COLUMN "share_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "posts_in_feed_idx" ON "posts"("in_feed");
CREATE INDEX "posts_status_in_feed_created_at_id_idx" ON "posts"("status", "in_feed", "created_at" DESC, "id" DESC);

-- Moment: link to canonical Post + permanence + nullable expiration
ALTER TABLE "moments" ADD COLUMN "post_id" INTEGER;
ALTER TABLE "moments" ADD COLUMN "is_permanent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "moments" ALTER COLUMN "expires_at" DROP NOT NULL;

CREATE INDEX "moments_post_id_idx" ON "moments"("post_id");
CREATE INDEX "moments_is_permanent_idx" ON "moments"("is_permanent");

ALTER TABLE "moments" ADD CONSTRAINT "moments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: for each moment without a linked post, create a canonical post and migrate interactions.
-- Guarded so it is a safe no-op when moment tables are empty.
DO $$
DECLARE
  m RECORD;
  new_post_id INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moments') THEN
    RETURN;
  END IF;

  FOR m IN SELECT id, user_id, title, description, status, share_count, view_count, created_at, updated_at FROM moments WHERE post_id IS NULL LOOP
    INSERT INTO posts (user_id, title, content, status, in_feed, view_count, share_count, created_at, updated_at)
    VALUES (m.user_id, m.title, COALESCE(m.description, m.title), m.status, false, m.view_count, m.share_count, m.created_at, m.updated_at)
    RETURNING id INTO new_post_id;

    UPDATE moments SET post_id = new_post_id WHERE id = m.id;

    -- media -> post_images
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moment_media') THEN
      INSERT INTO post_images (post_id, image_url, storage_key, mime_type, size_bytes, position, created_at)
      SELECT new_post_id, image_url, storage_key, mime_type, size_bytes, position, created_at FROM moment_media WHERE moment_id = m.id
      ON CONFLICT DO NOTHING;
    END IF;

    -- boosts -> reactions (type LIKE)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moment_boosts') THEN
      INSERT INTO reactions (post_id, user_id, type, created_at)
      SELECT new_post_id, user_id, 'LIKE', created_at FROM moment_boosts WHERE moment_id = m.id
      ON CONFLICT DO NOTHING;
    END IF;

    -- comments -> comments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moment_comments') THEN
      INSERT INTO comments (post_id, user_id, content, status, created_at, updated_at)
      SELECT new_post_id, user_id, content, status, created_at, updated_at FROM moment_comments WHERE moment_id = m.id
      ON CONFLICT DO NOTHING;
    END IF;

    -- saved_moments -> saved_posts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_moments') THEN
      INSERT INTO saved_posts (post_id, user_id, created_at)
      SELECT new_post_id, user_id, created_at FROM saved_moments WHERE moment_id = m.id
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
