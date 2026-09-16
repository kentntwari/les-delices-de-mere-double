-- AlterTable
ALTER TABLE "order_delivery_addresses" ADD COLUMN     "delivery_address_id" TEXT,
ADD COLUMN     "order_id" TEXT;

-- AddForeignKey
ALTER TABLE "order_delivery_addresses" ADD CONSTRAINT "order_delivery_addresses_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "delivery_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
