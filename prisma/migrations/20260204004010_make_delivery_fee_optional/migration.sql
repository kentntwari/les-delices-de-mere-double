-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "delivery_fee" DROP NOT NULL,
ALTER COLUMN "delivery_fee" SET DEFAULT 10.0;
