import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { MESSAGES } from "@/lib/constants";
import { BookingStatus } from "@/generated/prisma/enums";
import type { GuestWithVisits, MemberGuestSummary, GuestsByMember } from "@/lib/guest-types";

// Guests are a club-wide directory, not scoped per member: in a small
// club everyone knows each other, and the same person is often brought
// by different members over time. Searching/matching across everyone's
// guests (rather than just the logged-in member's own past guests) is
// what lets a booking reuse an existing guest instead of creating a
// duplicate with a fresh, incorrect "first visit" status.
export async function listGuests(): Promise<{
  success: boolean;
  guests: GuestWithVisits[];
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!session) return { success: false, guests: [], message: MESSAGES.COMMON.NOT_AUTHENTICATED };

    const guests = await prisma.guest.findMany({
      include: { _count: { select: { bookings: true } } },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      guests: guests.map((guest) => ({
        id: guest.id,
        name: guest.name,
        visitCount: guest._count.bookings,
        hasVisitedBefore: guest._count.bookings > 0,
      })),
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listGuests", err);
    return { success: false, guests: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/**
 * Guests grouped by the member who brought them (derived from actual
 * booking history, not Guest's original creator: a guest can be shared
 * across members). Admin-only, for Benutzerverwaltung.
 */
export async function listGuestsGroupedByBringer(): Promise<{
  success: boolean;
  guestsByMember: GuestsByMember;
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!isAdmin(session)) {
      return { success: false, guestsByMember: {}, message: MESSAGES.COMMON.UNAUTHORIZED };
    }

    const bookingGuests = await prisma.bookingGuest.findMany({
      where: { booking: { status: BookingStatus.ACTIVE } },
      include: {
        guest: { include: { _count: { select: { bookings: true } } } },
        booking: { select: { userId: true } },
      },
    });

    const byMember = new Map<string, Map<string, MemberGuestSummary>>();
    for (const bg of bookingGuests) {
      const memberId = bg.booking.userId;
      let guestsForMember = byMember.get(memberId);
      if (!guestsForMember) {
        guestsForMember = new Map();
        byMember.set(memberId, guestsForMember);
      }
      if (!guestsForMember.has(bg.guest.id)) {
        const visitCount = bg.guest._count.bookings;
        guestsForMember.set(bg.guest.id, {
          id: bg.guest.id,
          name: bg.guest.name,
          visitCount,
          isFirstTimer: visitCount === 1,
        });
      }
    }

    const guestsByMember: GuestsByMember = {};
    for (const [memberId, guestsForMember] of byMember) {
      guestsByMember[memberId] = [...guestsForMember.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    }
    return { success: true, guestsByMember };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listGuestsGroupedByBringer", err);
    return { success: false, guestsByMember: {}, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
