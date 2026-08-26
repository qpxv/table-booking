import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { endOfWeekBerlin } from "@/lib/datetime";
import { MESSAGES } from "@/lib/constants";
import type { Table } from "@/generated/prisma/client";
import type { TableWithUpcomingWeekCount } from "@/lib/table-types";

export async function listTables(): Promise<{
  success: boolean;
  tables: Table[];
  message?: string;
}> {
  try {
    const tables = await prisma.table.findMany({ orderBy: { name: "asc" } });
    return { success: true, tables };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listTables", err);
    return { success: false, tables: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function getTableById(id: string): Promise<{
  success: boolean;
  table: Table | null;
  message?: string;
}> {
  try {
    const table = await prisma.table.findUnique({ where: { id } });
    return { success: true, table };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in getTableById", err);
    return { success: false, table: null, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/**
 * Active tables with a count of their still-upcoming bookings through the
 * end of this week. "Mehrfachbuchung" (shared) tables additionally get
 * `nextEvent` (their soonest upcoming event and how many members joined it),
 * since a single weekly count doesn't mean much for a shared event slot.
 */
export async function listTablesWithUpcomingWeekCounts(): Promise<{
  success: boolean;
  tables: TableWithUpcomingWeekCount[];
  message?: string;
}> {
  try {
    const now = new Date();
    const weekEnd = endOfWeekBerlin(now);

    const tables = await prisma.table.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            bookings: {
              where: {
                start: { gte: now, lte: weekEnd },
              },
            },
          },
        },
      },
    });

    const sharedTableIds = tables.filter((t) => t.allowMultipleBookings).map((t) => t.id);

    const upcomingSharedBookings = sharedTableIds.length
      ? await prisma.booking.findMany({
          where: {
            tableId: { in: sharedTableIds },
            start: { gte: now },
          },
          orderBy: { start: "asc" },
          include: { _count: { select: { participants: true } } },
        })
      : [];

    // Bookings are ordered by start asc, so the first one seen per table is its
    // soonest upcoming event.
    const nextEventByTable = new Map<string, (typeof upcomingSharedBookings)[number]>();
    for (const booking of upcomingSharedBookings) {
      if (!nextEventByTable.has(booking.tableId)) {
        nextEventByTable.set(booking.tableId, booking);
      }
    }

    const tablesWithCounts = tables.map((table) => {
      const nextEvent = nextEventByTable.get(table.id);
      return {
        ...table,
        upcomingWeekBookingCount: table._count.bookings,
        nextEvent: nextEvent
          ? {
              start: nextEvent.start,
              end: nextEvent.end,
              participantCount: nextEvent._count.participants,
            }
          : null,
      };
    });

    return { success: true, tables: tablesWithCounts };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listTablesWithUpcomingWeekCounts", err);
    return { success: false, tables: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
