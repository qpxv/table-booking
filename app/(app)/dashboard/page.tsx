import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { checkSession } from "@/lib/session";
import { listUpcomingBookingsForUser } from "@/lib/queries/bookings";
import { formatBerlin } from "@/lib/datetime";

export default async function DashboardPage() {
  const session = await checkSession();

  const result = await listUpcomingBookingsForUser();
  if (!result.success) throw new Error(result.message);
  const upcomingBookings = result.bookings;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Deine anstehenden Reservierungen</h1>

      {!upcomingBookings.length && (
        <p className="text-sm text-muted-foreground">
          Du hast aktuell keine anstehenden Reservierungen.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {upcomingBookings.map((booking) => {
          const otherParticipants = booking.participants
            .filter((p) => p.userId !== session.user.id)
            .map((p) => p.user.name);
          return (
            <Card key={booking.id}>
              <CardContent className="flex flex-col gap-1">
                <CardTitle>{booking.table.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatBerlin(booking.start)} – {formatBerlin(booking.end, "HH:mm")}
                </p>
                {!booking.table.allowMultipleBookings && booking.game && (
                  <p className="text-sm">Spiel: {booking.game}</p>
                )}
                {otherParticipants.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Mit: {otherParticipants.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
