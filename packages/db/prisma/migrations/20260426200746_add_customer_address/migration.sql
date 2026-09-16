/*
  Warnings:

  - You are about to drop the column `address_city` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `address_postal_code` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `address_state` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `address_street` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "address_city",
DROP COLUMN "address_postal_code",
DROP COLUMN "address_state",
DROP COLUMN "address_street",
ADD COLUMN     "home_address_id" TEXT;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "home_address_id" FOREIGN KEY ("home_address_id") REFERENCES "delivery_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
