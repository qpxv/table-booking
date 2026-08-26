import "server-only";
import { prisma } from "@/lib/prisma";

export async function fetchBookingsForTable(tableId: string) {
  return prisma.booking.findMany({
    where: { tableId },
    include: {
      user: { select: { name: true } },
      guests: { include: { guest: { select: { name: true } } } },
      participants: { include: { user: { select: { name: true } } } },
    },
    orderBy: { start: "asc" },
  });
}

export async function fetchUpcomingBookingsForUser(userId: string) {
  return prisma.booking.findMany({
    where: {
      start: { gte: new Date() },
      // Own bookings, or any event created by someone else that this user
      // has joined (or was added to) as a participant.
      OR: [{ userId }, { participants: { some: { userId } } }],
    },
    include: {
      table: true,
      participants: { include: { user: { select: { name: true } } } },
    },
    orderBy: { start: "asc" },
    take: 10,
  });
}
