import type { Session } from "@/lib/auth";
import type { Booking } from "@/generated/prisma/client";

export function isAdmin(session: Session | null): boolean {
  return session?.user.role === "admin";
}

/** True for the designated dev/test account, kept out of admin listings. */
export function isHiddenAccount(email: string): boolean {
  const hiddenEmail = process.env.DEV_ACCOUNT_EMAIL;
  return !!hiddenEmail && email.toLowerCase() === hiddenEmail.toLowerCase();
}

export function canEditBooking(
  session: Session | null,
  booking: Pick<Booking, "userId">,
): boolean {
  if (!session) return false;
  return session.user.id === booking.userId || isAdmin(session);
}
