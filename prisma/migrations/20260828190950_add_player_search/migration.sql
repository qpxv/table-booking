-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "autoBookingPriority" INTEGER;

-- CreateTable
CREATE TABLE "PlayerSearch" (
    "id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "system" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "PlayerSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerSearch_start_idx" ON "PlayerSearch"("start");

-- AddForeignKey
ALTER TABLE "PlayerSearch" ADD CONSTRAINT "PlayerSearch_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
