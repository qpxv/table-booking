import { Suspense, type JSX } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
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

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const table = await prisma.table.findUnique({ where: { id: tischId } });
  if (!table) {
    notFound();
  }

  const [bookingsResult, guestsResult, gamesResult, membersResult] = await Promise.all([
    listBookingsForTable(tischId),
    listGuests(),
    listGames(),
    listMembers(),
  ]);
  if (!bookingsResult.success) throw new Error(bookingsResult.message);
  if (!guestsResult.success) throw new Error(guestsResult.message);
  if (!gamesResult.success) throw new Error(gamesResult.message);
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
