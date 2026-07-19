-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "allowMultipleBookings" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BookingParticipant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BookingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingParticipant_bookingId_idx" ON "BookingParticipant"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingParticipant_bookingId_userId_key" ON "BookingParticipant"("bookingId", "userId");

-- AddForeignKey
ALTER TABLE "BookingParticipant" ADD CONSTRAINT "BookingParticipant_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingParticipant" ADD CONSTRAINT "BookingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
