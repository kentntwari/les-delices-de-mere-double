-- AlterTable
ALTER TABLE "order_comments" ADD COLUMN     "comment_reply_id" TEXT[],
ADD COLUMN     "source_comment_id" TEXT;
