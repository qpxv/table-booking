import "server-only";
import { prisma } from "@/lib/prisma";
import { berlinDayString } from "@/lib/datetime";

/**
 * Merged attendance per Berlin calendar day from `from` onward: the set of
 * member ids present on each day, combining explicit Attendance rows with
 * members who own or joined a booking that day.
 *
 * Keyed by `yyyy-MM-dd`. A booking counts for the Berlin day of its start.
 */
export async function buildAttendanceByDay(from: Date): Promise<Map<string, Set<string>>> {
  const [rows, bookings] = await Promise.all([
    prisma.attendance.findMany({
      where: { date: { gte: from } },
      select: { date: true, userId: true },
    }),
    prisma.booking.findMany({
      where: { start: { gte: from } },
      select: { start: true, userId: true, participants: { select: { userId: true } } },
    }),
  ]);

  const byDay = new Map<string, Set<string>>();
  const add = (day: string, userId: string): void => {
    const set = byDay.get(day) ?? new Set<string>();
    set.add(userId);
    byDay.set(day, set);
  };

  for (const row of rows) add(berlinDayString(row.date), row.userId);
  for (const booking of bookings) {
    const day = berlinDayString(booking.start);
    add(day, booking.userId);
    for (const participant of booking.participants) add(day, participant.userId);
  }

  return byDay;
}
