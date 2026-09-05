import type { Session } from "@/lib/auth";
import { ROLES, MESSAGES } from "@/lib/constants";
import type { BookingOwnership } from "@/lib/booking-types";
import type { ServiceResult } from "@/lib/service-types";
import { type Actor, resolveActor, actorIsAdmin } from "@/lib/actor";

export function isAdmin(session: Session | null): boolean {
  return session?.user.role === ROLES.ADMIN;
}

/** True for the designated dev/test account, kept out of admin listings. */
export function isHiddenAccount(email: string): boolean {
  const hiddenEmail = process.env.DEV_ACCOUNT_EMAIL;
  return !!hiddenEmail && email.toLowerCase() === hiddenEmail.toLowerCase();
}

export function canEditBooking(actor: Actor | null, booking: BookingOwnership): boolean {
  if (!actor) return false;
  return actor.id === booking.userId || actorIsAdmin(actor);
}

/** Returns a ServiceResult failure if the actor isn't an admin, otherwise null. */
export async function requireAdmin(explicitActor?: Actor): Promise<ServiceResult | null> {
  const actor = await resolveActor(explicitActor);
  if (!actor || !actorIsAdmin(actor)) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }
  return null;
}
