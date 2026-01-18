/*
  Warnings:

  - You are about to drop the column `quantity` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the `_MenuItemToOrder` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `unit_price` to the `menu_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_MenuItemToOrder" DROP CONSTRAINT "_MenuItemToOrder_A_fkey";

-- DropForeignKey
ALTER TABLE "_MenuItemToOrder" DROP CONSTRAINT "_MenuItemToOrder_B_fkey";

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "quantity",
DROP COLUMN "unitPrice",
ADD COLUMN     "unit_price" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "_MenuItemToOrder";

-- CreateTable
CREATE TABLE "ordered_items" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "orderId" TEXT,

    CONSTRAINT "ordered_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ordered_item_id_order_id_idx" ON "ordered_items"("id", "item_id", "orderId");

-- AddForeignKey
ALTER TABLE "ordered_items" ADD CONSTRAINT "ordered_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordered_items" ADD CONSTRAINT "ordered_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
