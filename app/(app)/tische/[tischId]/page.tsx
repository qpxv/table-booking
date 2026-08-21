import { Suspense, type JSX } from "react";
import { notFound } from "next/navigation";
import { checkSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { getTableById } from "@/lib/queries/tables";
import { listBookingsForTable } from "@/lib/queries/bookings";
import { listGuests } from "@/lib/queries/guests";
import { listGames } from "@/lib/queries/games";
import { listMembers } from "@/lib/queries/users";
import BookingCalendar from "@/components/bookings/BookingCalendar";

export default async function TableCalendarPage({
  params,
}: {
  params: Promise<{ tischId: string }>;
}): Promise<JSX.Element> {
  const { tischId } = await params;

  const session = await checkSession();

  const tableResult = await getTableById(tischId);
  if (!tableResult.success) throw new Error(tableResult.message);
  const table = tableResult.table;
  if (!table) {
    notFound();
  }

  const bookingsResult = await listBookingsForTable(tischId);
  if (!bookingsResult.success) throw new Error(bookingsResult.message);

  const guestsResult = await listGuests();
  if (!guestsResult.success) throw new Error(guestsResult.message);

  const gamesResult = await listGames();
  if (!gamesResult.success) throw new Error(gamesResult.message);

  const membersResult = await listMembers();
  if (!membersResult.success) throw new Error(membersResult.message);

  const bookings = bookingsResult.bookings;
  const knownGuests = guestsResult.guests;
  const knownGames = gamesResult.games;
  const knownMembers = membersResult.members;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">{table.name}</h1>
      <Suspense>
        <BookingCalendar
          tableId={table.id}
          tableName={table.name}
          currentUserId={session.user.id}
          isAdmin={isAdmin(session)}
          tableAllowsMultiple={table.allowMultipleBookings}
          bookings={bookings.map((b) => ({
            id: b.id,
            start: b.start,
            end: b.end,
            game: b.game,
            userId: b.userId,
            userName: b.user.name,
            guests: b.guests.map((g) => ({ guestId: g.guestId, name: g.guest.name })),
            participants: b.participants.map((p) => ({ userId: p.userId, name: p.user.name })),
          }))}
          knownGuests={knownGuests}
          knownGames={knownGames}
          knownMembers={knownMembers}
        />
      </Suspense>
    </div>
  );
}
