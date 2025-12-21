-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'SUPERUSER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Permissions" AS ENUM ('READ_ORDERS', 'READ_CUSTOMERS', 'READ_USERS', 'READ_MENU', 'UPDATE_ORDERS', 'UPDATE_CUSTOMERS', 'UPDATE_USERS', 'UPDATE_MENU', 'DELETE_ORDERS', 'DELETE_CUSTOMERS', 'DELETE_USERS', 'DELETE_MENU');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'VOIDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "permissions" "Permissions"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address_street" TEXT,
    "address_city" TEXT,
    "address_state" TEXT,
    "address_postal_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_logs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MenuItemToOrder" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MenuItemToOrder_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_id_email_idx" ON "users"("id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customer_id_email_phone_idx" ON "customers"("id", "email", "phone");

-- CreateIndex
CREATE INDEX "order_id_idx" ON "orders"("id");

-- CreateIndex
CREATE UNIQUE INDEX "order_logs_order_id_key" ON "order_logs"("order_id");

-- CreateIndex
CREATE INDEX "order_logs_id_order_id_idx" ON "order_logs"("id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_slug_key" ON "menu_items"("slug");

-- CreateIndex
CREATE INDEX "menu_item_id_slug_idx" ON "menu_items"("id", "slug");

-- CreateIndex
CREATE INDEX "_MenuItemToOrder_B_index" ON "_MenuItemToOrder"("B");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_logs" ADD CONSTRAINT "order_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuItemToOrder" ADD CONSTRAINT "_MenuItemToOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuItemToOrder" ADD CONSTRAINT "_MenuItemToOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
