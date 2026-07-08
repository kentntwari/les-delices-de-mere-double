/*
  Warnings:

  - The `tagged_user_id` column on the `order_comments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "order_comments" DROP COLUMN "tagged_user_id",
ADD COLUMN     "tagged_user_id" TEXT[];
