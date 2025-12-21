-- CreateEnum
CREATE TYPE "WhitelistStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "WhitelistStatus" NOT NULL DEFAULT 'PENDING';
