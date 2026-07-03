-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "unlockType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "unlockCode" TEXT NOT NULL DEFAULT '';
