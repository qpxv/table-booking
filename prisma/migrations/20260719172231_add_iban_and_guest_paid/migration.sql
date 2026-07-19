-- AlterTable
ALTER TABLE "BookingGuest" ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "iban" TEXT;
