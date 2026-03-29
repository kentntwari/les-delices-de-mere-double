-- CreateTable
CREATE TABLE "order_comments" (
    "id" TEXT NOT NULL,
    "comment" VARCHAR(500) NOT NULL,
    "order_id" TEXT NOT NULL,
    "from_user_id" TEXT,
    "tagged_user_id" TEXT,
    "liked_by" TEXT[],
    "liked_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_comments_order_id_key" ON "order_comments"("order_id");

-- CreateIndex
CREATE INDEX "order_comments_id_order_id_idx" ON "order_comments"("id", "order_id");

-- AddForeignKey
ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
