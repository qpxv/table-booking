-- Cancelling a booking is now a hard delete (no more status/soft-delete),
-- so existing CANCELLED rows must be purged before the column is dropped
-- -- otherwise they'd silently become indistinguishable from active
-- bookings. BookingGuest/BookingParticipant already have ON DELETE CASCADE
-- foreign keys to Booking, so their rows go with it.
DELETE FROM "Booking" WHERE "status" = 'CANCELLED';

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "status";

-- DropEnum
DROP TYPE "BookingStatus";
