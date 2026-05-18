-- CreateIndex
CREATE INDEX "order_delivery_address_id_order_id_delivery_address_id_idx" ON "order_delivery_addresses"("id", "order_id", "delivery_address_id");
