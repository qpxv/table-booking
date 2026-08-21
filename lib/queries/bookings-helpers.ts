import "server-only";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/enums";

export async function fetchBookingsForTable(tableId: string) {
  return prisma.booking.findMany({
    where: { tableId, status: BookingStatus.ACTIVE },
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
      status: BookingStatus.ACTIVE,
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
