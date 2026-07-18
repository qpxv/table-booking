import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { listBookingsForTable } from "@/actions/bookings";
import { listGuests } from "@/actions/guests";
import BookingCalendar from "@/components/bookings/BookingCalendar";

export default async function TableCalendarPage({
  params,
}: {
  params: Promise<{ tischId: string }>;
}) {
  const { tischId } = await params;

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const table = await prisma.table.findUnique({ where: { id: tischId } });
  if (!table) {
    notFound();
  }

  const [bookings, knownGuests] = await Promise.all([
    listBookingsForTable(tischId),
    listGuests(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">{table.name}</h1>
      <Suspense>
        <BookingCalendar
          tableId={table.id}
          tableName={table.name}
          currentUserId={session.user.id}
          isAdmin={isAdmin(session)}
          bookings={bookings.map((b) => ({
            id: b.id,
            start: b.start,
            end: b.end,
            game: b.game,
            userId: b.userId,
            userName: b.user.name,
            guests: b.guests.map((g) => ({ guestId: g.guestId, name: g.guest.name })),
          }))}
          knownGuests={knownGuests}
        />
      </Suspense>
    </div>
  );
}
