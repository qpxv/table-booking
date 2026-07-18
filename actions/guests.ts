"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { BookingStatus } from "@/generated/prisma/enums";

export type GuestWithVisits = {
  id: string;
  name: string;
  visitCount: number;
  hasVisitedBefore: boolean;
};

// Guests are a club-wide directory, not scoped per member — in a small
// club everyone knows each other, and the same person is often brought
// by different members over time. Searching/matching across everyone's
// guests (rather than just the logged-in member's own past guests) is
// what lets a booking reuse an existing guest instead of creating a
// duplicate with a fresh, incorrect "first visit" status.
export async function listGuests(): Promise<GuestWithVisits[]> {
  const session = await getSession();
  if (!session) throw new Error("Nicht angemeldet.");

  const guests = await prisma.guest.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: { name: "asc" },
  });

  return guests.map((guest) => ({
    id: guest.id,
    name: guest.name,
    visitCount: guest._count.bookings,
    hasVisitedBefore: guest._count.bookings > 0,
  }));
}

export type MemberGuestSummary = {
  id: string;
  name: string;
  visitCount: number;
  isFirstTimer: boolean;
};

/**
 * Guests grouped by the member who brought them (derived from actual
 * booking history, not Guest's original creator — a guest can be shared
 * across members). Admin-only, for Benutzerverwaltung.
 */
export async function listGuestsGroupedByBringer(): Promise<Record<string, MemberGuestSummary[]>> {
  const session = await getSession();
  if (!isAdmin(session)) {
    throw new Error("Nicht berechtigt.");
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

  const result: Record<string, MemberGuestSummary[]> = {};
  for (const [memberId, guestsForMember] of byMember) {
    result[memberId] = [...guestsForMember.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
  return result;
}
