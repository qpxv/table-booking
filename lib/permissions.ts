import type { Session } from "@/lib/auth";
import type { Booking } from "@/generated/prisma/client";

export function isAdmin(session: Session | null): boolean {
  return session?.user.role === "admin";
}

export function canEditBooking(
  session: Session | null,
  booking: Pick<Booking, "userId">,
): boolean {
  if (!session) return false;
  return session.user.id === booking.userId || isAdmin(session);
}
