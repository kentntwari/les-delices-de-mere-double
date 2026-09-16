/*
  Warnings:

  - You are about to drop the `DeliveryAddress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "DeliveryAddress";

-- CreateTable
CREATE TABLE "delivery_addresses" (
    "id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CANADA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_address_full_idx" ON "delivery_addresses"("street", "city", "state", "postal_code", "country");
