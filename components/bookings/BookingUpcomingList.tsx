"use client";

import { useMemo, type JSX } from "react";
import { Plus } from "lucide-react";
import { de } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { APP_TIMEZONE, berlinDayString, formatBerlin, getTodayBerlinRange } from "@/lib/datetime";
import type { CalendarBooking } from "@/lib/booking-types";

// A booking that has already ended before today is history; the desktop grid
// still exposes it through week navigation, but on mobile the list only
// looks forward.
function toUpcomingByDay(bookings: CalendarBooking[]): { day: string; label: string; items: CalendarBooking[] }[] {
  const cutoff = getTodayBerlinRange().start;
  const todayDay = berlinDayString(new Date());

  const upcoming = bookings
    .filter((booking) => booking.end >= cutoff)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const groups = new Map<string, CalendarBooking[]>();
  for (const booking of upcoming) {
    const day = berlinDayString(booking.start);
    const existing = groups.get(day);
    if (existing) existing.push(booking);
    else groups.set(day, [booking]);
  }

  return [...groups.entries()].map(([day, items]) => ({
    day,
    label:
      day === todayDay
        ? "Heute"
        : formatInTimeZone(items[0].start, APP_TIMEZONE, "EEEE, d. MMMM", { locale: de }),
    items,
  }));
}

function defaultBookingWindow(): { start: string; end: string } {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function BookingUpcomingList({
  bookings,
  currentUserId,
  onOpenBooking,
  onCreate,
}: {
  bookings: CalendarBooking[];
  currentUserId: string;
  onOpenBooking: (bookingId: string) => void;
  onCreate: (start: string, end: string) => void;
}): JSX.Element {
  const days = useMemo(() => toUpcomingByDay(bookings), [bookings]);

  function handleCreate(): void {
    const { start, end } = defaultBookingWindow();
    onCreate(start, end);
  }

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" className="w-full" onClick={handleCreate}>
        <Plus />
        Neue Buchung
      </Button>

      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine anstehenden Buchungen.</p>
      ) : (
        days.map((group) => (
          <div key={group.day} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium capitalize text-muted-foreground">{group.label}</h2>
            {group.items.map((booking) => {
              const attendees = [
                ...booking.participants.map((p) => p.name),
                ...booking.guests.map((g) => g.name),
              ].join(", ");
              const isParticipant = booking.participants.some((p) => p.userId === currentUserId);
              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => onOpenBooking(booking.id)}
                  className="rounded-xl text-left outline-none transition-[box-shadow,background-color] hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card>
                    <CardContent className="flex flex-col gap-1">
                      <CardTitle>
                        {formatBerlin(booking.start, "HH:mm")} – {formatBerlin(booking.end, "HH:mm")}{" "}
                        Uhr
                      </CardTitle>
                      {attendees && <p className="text-sm text-muted-foreground">{attendees}</p>}
                      {booking.game && <p className="text-sm">Spiel: {booking.game}</p>}
                      {isParticipant && <p className="text-sm text-secondary">Du bist dabei</p>}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
