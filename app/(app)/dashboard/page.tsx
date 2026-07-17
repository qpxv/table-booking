import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
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
    <Box className="flex flex-col gap-4">
      <Typography variant="h5" component="h1">
        Deine anstehenden Reservierungen
      </Typography>

      {upcomingBookings.length === 0 && (
        <Typography color="text.secondary">
          Du hast aktuell keine anstehenden Reservierungen.
        </Typography>
      )}

      <Box className="flex flex-col gap-3">
        {upcomingBookings.map((booking) => (
          <Card key={booking.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {booking.table.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatBerlin(booking.start)} – {formatBerlin(booking.end, "HH:mm")}
              </Typography>
              {booking.game && (
                <Typography variant="body2">Spiel: {booking.game}</Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
