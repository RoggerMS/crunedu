CREATE TABLE "answer_images" (
    "id" SERIAL NOT NULL,
    "answer_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "answer_votes" (
    "id" SERIAL NOT NULL,
    "answer_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answer_votes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "answer_images_answer_id_idx" ON "answer_images"("answer_id");
CREATE UNIQUE INDEX "answer_votes_answer_id_user_id_key" ON "answer_votes"("answer_id", "user_id");
CREATE INDEX "answer_votes_answer_id_idx" ON "answer_votes"("answer_id");
CREATE INDEX "answer_votes_user_id_idx" ON "answer_votes"("user_id");

ALTER TABLE "answer_images" ADD CONSTRAINT "answer_images_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_value_check" CHECK ("value" IN (-1, 1));
