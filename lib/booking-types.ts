import type { GuestWithVisits } from "@/lib/guest-types";

export type CalendarBooking = {
  id: string;
  start: Date;
  end: Date;
  game: string | null;
  userId: string;
  userName: string;
  guests: { guestId: string; name: string }[];
  participants: { userId: string; name: string }[];
};

export type GuestSelection = { type: "existing"; guest: GuestWithVisits } | { type: "new"; name: string };

export function isExistingGuestSelection(
  selection: GuestSelection,
): selection is Extract<GuestSelection, { type: "existing" }> {
  return selection.type === "existing";
}

/** The subset of a booking needed to decide edit/cancel permission. */
export type BookingOwnership = {
  userId: string;
};
