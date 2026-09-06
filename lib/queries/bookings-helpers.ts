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

// notification-potential: a scheduled job could reuse a query like this one
// (filtered to bookings starting in roughly one hour, across all users) to
// send each participant a "dein Termin startet gleich" reminder. Other
// time-based reminders could hook in here too (e.g. members with an unpaid
// guest visit in Gasthistorie).
// All bookings overlapping a Berlin calendar day, with booker + table name.
// Backs the Discord `/tische <datum>` overview.
export async function fetchBookingsForBerlinDay(dayStart: Date, dayEnd: Date) {
  return prisma.booking.findMany({
    where: { start: { lt: dayEnd }, end: { gt: dayStart } },
    include: {
      table: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: [{ table: { name: "asc" } }, { start: "asc" }],
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
