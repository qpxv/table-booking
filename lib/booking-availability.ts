import "server-only";
import type { Prisma } from "@/generated/prisma/client";

// Thrown inside a booking transaction when the target table turns out to be
// taken (checked under the advisory lock). Callers catch it and translate to
// a ServiceResult; throwing is what rolls the transaction back.
export class BookingOverlapError extends Error {
  constructor() {
    super("BOOKING_OVERLAP");
    this.name = "BookingOverlapError";
  }
}

// Transaction-scoped Postgres advisory lock, keyed per table. Held until the
// surrounding transaction commits or rolls back. Serializes every code path
// that checks "is this table free?" and then inserts a booking, so the
// check and the insert can't be interleaved by a concurrent booking for the
// same table (manual booking vs. Spielersuche auto-booking, or two
// auto-bookings racing for the same slot).
export async function lockTableForBooking(
  tx: Prisma.TransactionClient,
  tableId: string,
): Promise<void> {
  const key = `booking-table:${tableId}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

/**
 * The first booking on `tableId` that overlaps [start, end), or null.
 * `excludeBookingId` skips the booking being rescheduled.
 *
 * Only meaningful for exclusive tables: "Mehrfachbuchung" tables are allowed
 * to have concurrent events, so callers skip this check for them.
 */
export async function findOverlappingBooking(
  tx: Prisma.TransactionClient,
  tableId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string,
): Promise<{ id: string } | null> {
  return tx.booking.findFirst({
    where: {
      tableId,
      start: { lt: end },
      end: { gt: start },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { id: true },
  });
}
