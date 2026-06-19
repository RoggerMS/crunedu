-- Store functional v1 (additive)
-- New enums
CREATE TYPE "ProductType" AS ENUM ('SALE', 'SERVICE', 'EXCHANGE', 'DONATION', 'RENTAL', 'REQUEST');
CREATE TYPE "ProductPriceType" AS ENUM ('FIXED', 'NEGOTIABLE', 'FREE', 'CONTACT', 'EXCHANGE', 'HOURLY', 'FROM');
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'USED', 'WITH_DETAILS', 'NOT_APPLICABLE');
CREATE TYPE "ProductDeliveryType" AS ENUM ('CAMPUS', 'SAFE_POINT', 'PICKUP', 'COORDINATED', 'SHIPPING', 'DIGITAL');

-- product_categories: new columns
ALTER TABLE "product_categories" ADD COLUMN "icon" TEXT;
ALTER TABLE "product_categories" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "product_categories" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- product_safe_points table
CREATE TABLE "product_safe_points" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "university_id" INTEGER,
    "campus" TEXT,
    "description" TEXT,
    "reference" TEXT,
    "schedule" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_safe_points_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_safe_points_is_active_idx" ON "product_safe_points"("is_active");

-- products: new columns + price nullable + contact_method default
ALTER TABLE "products" ALTER COLUMN "price" DROP NOT NULL;
ALTER TABLE "products" ALTER COLUMN "contact_method" SET DEFAULT 'chat';
ALTER TABLE "products" ADD COLUMN "type" "ProductType" NOT NULL DEFAULT 'SALE';
ALTER TABLE "products" ADD COLUMN "price_type" "ProductPriceType" NOT NULL DEFAULT 'FIXED';
ALTER TABLE "products" ADD COLUMN "is_negotiable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "condition" "ProductCondition";
ALTER TABLE "products" ADD COLUMN "delivery_type" "ProductDeliveryType" NOT NULL DEFAULT 'CAMPUS';
ALTER TABLE "products" ADD COLUMN "campus" TEXT;
ALTER TABLE "products" ADD COLUMN "district" TEXT;
ALTER TABLE "products" ADD COLUMN "safe_point_id" INTEGER;
ALTER TABLE "products" ADD COLUMN "course" TEXT;
ALTER TABLE "products" ADD COLUMN "brand" TEXT;
ALTER TABLE "products" ADD COLUMN "model" TEXT;
ALTER TABLE "products" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "products" ADD COLUMN "favorite_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "published_at" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "deleted_at" TIMESTAMP(3);

ALTER TABLE "products" ADD CONSTRAINT "products_safe_point_id_fkey" FOREIGN KEY ("safe_point_id") REFERENCES "product_safe_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "products_type_idx" ON "products"("type");
CREATE INDEX "products_deliveryType_idx" ON "products"("delivery_type");
CREATE INDEX "products_safePointId_idx" ON "products"("safe_point_id");
CREATE INDEX "products_status_createdAt_desc_id_desc_idx" ON "products"("status", "createdAt"(Desc), "id"(Desc));

-- product_images: new columns
ALTER TABLE "product_images" ADD COLUMN "mime_type" TEXT;
ALTER TABLE "product_images" ADD COLUMN "size_bytes" INTEGER;
ALTER TABLE "product_images" ADD COLUMN "alt_text" TEXT;
ALTER TABLE "product_images" ADD COLUMN "is_cover" BOOLEAN NOT NULL DEFAULT false;

-- product_inquiries: contact fields nullable + new column + default
ALTER TABLE "product_inquiries" ALTER COLUMN "contact_name" DROP NOT NULL;
ALTER TABLE "product_inquiries" ALTER COLUMN "contact_phone" DROP NOT NULL;
ALTER TABLE "product_inquiries" ALTER COLUMN "preferred_contact_method" SET DEFAULT 'chat';
ALTER TABLE "product_inquiries" ADD COLUMN "quick_message_type" TEXT;
