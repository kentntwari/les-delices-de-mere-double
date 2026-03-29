/*
  Warnings:

  - You are about to drop the column `orderId` on the `ordered_items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ordered_items" DROP CONSTRAINT "ordered_items_orderId_fkey";

-- DropIndex
DROP INDEX "ordered_item_id_order_id_idx";

-- AlterTable
ALTER TABLE "ordered_items" DROP COLUMN "orderId",
ADD COLUMN     "order_id" TEXT;

-- CreateIndex
CREATE INDEX "ordered_item_id_order_id_idx" ON "ordered_items"("id", "item_id", "order_id");

-- AddForeignKey
ALTER TABLE "ordered_items" ADD CONSTRAINT "ordered_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
