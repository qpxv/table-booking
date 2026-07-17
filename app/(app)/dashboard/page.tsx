import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatBerlin } from "@/lib/datetime";
import { redirect } from "next/navigation";
import { BookingStatus } from "@/generated/prisma/enums";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const upcomingBookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      status: BookingStatus.ACTIVE,
      start: { gte: new Date() },
    },
    include: { table: true },
    orderBy: { start: "asc" },
    take: 10,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Deine anstehenden Reservierungen</h1>

      {upcomingBookings.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Du hast aktuell keine anstehenden Reservierungen.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {upcomingBookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="flex flex-col gap-1">
              <CardTitle>{booking.table.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatBerlin(booking.start)} – {formatBerlin(booking.end, "HH:mm")}
              </p>
              {booking.game && <p className="text-sm">Spiel: {booking.game}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
