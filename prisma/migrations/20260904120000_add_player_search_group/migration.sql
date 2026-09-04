-- AlterTable
ALTER TABLE "PlayerSearch" ADD COLUMN     "bookingId" TEXT,
ADD COLUMN     "playerCount" INTEGER NOT NULL DEFAULT 2;

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSearch_bookingId_key" ON "PlayerSearch"("bookingId");

-- AddForeignKey
ALTER TABLE "PlayerSearch" ADD CONSTRAINT "PlayerSearch_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
