/*
  Warnings:

  - You are about to drop the column `city` on the `order_delivery_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `order_delivery_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `postal_code` on the `order_delivery_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `order_delivery_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `order_delivery_addresses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[order_delivery_address_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "delivery_address_street_city_state_postalCode_country_idx";

-- AlterTable
ALTER TABLE "order_delivery_addresses" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "postal_code",
DROP COLUMN "state",
DROP COLUMN "street";

-- CreateTable
CREATE TABLE "DeliveryAddress" (
    "id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CANADA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_delivery_address_id_key" ON "orders"("order_delivery_address_id");
