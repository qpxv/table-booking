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
