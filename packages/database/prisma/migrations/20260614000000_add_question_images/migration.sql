CREATE TABLE "question_images" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "question_images_question_id_idx" ON "question_images"("question_id");

ALTER TABLE "question_images" ADD CONSTRAINT "question_images_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
