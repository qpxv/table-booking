import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { formatEventDateRange } from "@/lib/datetime";
import { sendPushToUsers } from "@/lib/push/web-push";

interface TimeWindow {
  start: Date;
  end: Date;
}

/**
 * Does an auto-bookable table (active, exclusive, has an autoBookingPriority)
 * have no booking overlapping [start, end)? This is the exact condition
 * acceptPlayerSearchInterest needs to succeed.
 */
export async function isWindowAutoBookable(start: Date, end: Date): Promise<boolean> {
  const freeTable = await prisma.table.findFirst({
    where: {
      active: true,
      allowMultipleBookings: false,
      autoBookingPriority: { not: null },
      bookings: { none: { start: { lt: end }, end: { gt: start } } },
    },
    select: { id: true },
  });
  return freeTable !== null;
}

/**
 * Recompute PlayerSearch.tableAvailable for every still-open search whose
 * window overlaps one of `windows`, and push the creator when a search flips
 * to unavailable (a flip back to available clears silently). Meant to run
 * from booking mutations inside `after()`, off the response path. Never
 * throws: logs and returns.
 */
export async function syncPlayerSearchAvailability(windows: TimeWindow[]): Promise<void> {
  if (windows.length === 0) return;

  try {
    const now = new Date();
    const maxEnd = new Date(Math.max(...windows.map((w) => w.end.getTime())));

    const candidates = await prisma.playerSearch.findMany({
      // Phase-2 group searches already hold a booked table: `tableAvailable`
      // no longer applies to them.
      where: { bookingId: null, end: { gte: now }, start: { lt: maxEnd } },
      select: {
        id: true,
        start: true,
        end: true,
        system: true,
        tableAvailable: true,
        creatorId: true,
      },
    });

    // Flexible searches (null window) have nothing to check and are excluded
    // by the `where` above; narrow the type for the overlap test.
    const affected = candidates.filter(
      (search): search is typeof search & { start: Date; end: Date } => {
        if (search.start === null || search.end === null) return false;
        const { start, end } = search;
        return windows.some((w) => start < w.end && end > w.start);
      },
    );
    if (affected.length === 0) return;

    let anyChanged = false;

    for (const search of affected) {
      const available = await isWindowAutoBookable(search.start, search.end);
      if (available === search.tableAvailable) continue;

      await prisma.playerSearch.update({
        where: { id: search.id },
        data: { tableAvailable: available },
      });
      anyChanged = true;

      if (!available) {
        await sendPushToUsers([search.creatorId], {
          ...MESSAGES.NOTIFICATIONS.playerSearchTableLost(
            search.system,
            formatEventDateRange(search.start, search.end),
          ),
          url: ROUTES.SPIELERSUCHE,
          tag: `search-table-lost-${search.id}`,
        });
      }
    }

    if (anyChanged) {
      revalidatePath(ROUTES.SPIELERSUCHE);
      revalidatePath(ROUTES.DASHBOARD);
    }
  } catch (err) {
    console.error("error in syncPlayerSearchAvailability", err);
  }
}

/**
 * Resync every open search regardless of window. For changes with no single
 * affected window, e.g. an admin toggling a table's active flag or
 * auto-booking priority.
 */
export async function syncAllOpenPlayerSearchAvailability(): Promise<void> {
  const now = new Date();
  await syncPlayerSearchAvailability([
    { start: now, end: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 366 * 5) },
  ]);
}
