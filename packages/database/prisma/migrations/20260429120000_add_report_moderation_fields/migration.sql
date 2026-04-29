ALTER TABLE "reports"
ADD COLUMN "moderated_at" TIMESTAMP(3),
ADD COLUMN "moderated_by_id" INTEGER;

CREATE INDEX "reports_moderated_by_id_idx" ON "reports"("moderated_by_id");

ALTER TABLE "reports"
ADD CONSTRAINT "reports_moderated_by_id_fkey"
FOREIGN KEY ("moderated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
