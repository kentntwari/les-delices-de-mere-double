-- DropForeignKey
ALTER TABLE "ordered_items" DROP CONSTRAINT "ordered_items_orderId_fkey";

-- AddForeignKey
ALTER TABLE "ordered_items" ADD CONSTRAINT "ordered_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
