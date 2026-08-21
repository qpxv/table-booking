import type { Session } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { ROLES, MESSAGES } from "@/lib/constants";
import type { BookingOwnership } from "@/lib/booking-types";
import type { ServiceResult } from "@/lib/service-types";

export function isAdmin(session: Session | null): boolean {
  return session?.user.role === ROLES.ADMIN;
}

/** True for the designated dev/test account, kept out of admin listings. */
export function isHiddenAccount(email: string): boolean {
  const hiddenEmail = process.env.DEV_ACCOUNT_EMAIL;
  return !!hiddenEmail && email.toLowerCase() === hiddenEmail.toLowerCase();
}

export function canEditBooking(session: Session | null, booking: BookingOwnership): boolean {
  if (!session) return false;
  return session.user.id === booking.userId || isAdmin(session);
}

/** Returns a ServiceResult failure if the session isn't an admin, otherwise null. */
export async function requireAdmin(): Promise<ServiceResult | null> {
  const session = await getSession();
  if (!isAdmin(session)) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }
  return null;
}
