import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin, isHiddenAccount } from "@/lib/permissions";
import { MESSAGES } from "@/lib/constants";
import { getCurrentBerlinYearMonth, getTodayBerlinRange } from "@/lib/datetime";
import { BookingStatus } from "@/generated/prisma/enums";
import type { DrinkReportRow, DrinkWidgetGuest } from "@/lib/drink-types";

/** Own drink count for the current month, plus today's guests this member can log a drink for. */
export async function getDrinkWidgetData(): Promise<{
  success: boolean;
  ownCount: number;
  guests: DrinkWidgetGuest[];
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, ownCount: 0, guests: [], message: MESSAGES.COMMON.NOT_AUTHENTICATED };
    }

    const { year, month } = getCurrentBerlinYearMonth();
    const { start, end } = getTodayBerlinRange();

    const tally = await prisma.drinkTally.findUnique({
      where: { userId_year_month: { userId: session.user.id, year, month } },
      select: { count: true },
    });

    const bookingGuests = await prisma.bookingGuest.findMany({
      where: {
        booking: {
          userId: session.user.id,
          status: BookingStatus.ACTIVE,
          start: { gte: start, lt: end },
        },
      },
      include: { guest: { select: { id: true, name: true } } },
    });

    const guestsById = new Map<string, DrinkWidgetGuest>();
    for (const bookingGuest of bookingGuests) {
      guestsById.set(bookingGuest.guest.id, bookingGuest.guest);
    }

    return {
      success: true,
      ownCount: tally?.count ?? 0,
      guests: [...guestsById.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in getDrinkWidgetData", err);
    return { success: false, ownCount: 0, guests: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/** Admin-only monthly drink report: initial stock plus per-member counts. */
export async function getDrinkReport(
  year: number,
  month: number,
): Promise<{
  success: boolean;
  initialCount: number;
  totalTaken: number;
  rows: DrinkReportRow[];
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!isAdmin(session)) {
      return {
        success: false,
        initialCount: 0,
        totalTaken: 0,
        rows: [],
        message: MESSAGES.COMMON.UNAUTHORIZED,
      };
    }

    const budget = await prisma.drinkMonthlyBudget.findUnique({
      where: { year_month: { year, month } },
      select: { initialCount: true },
    });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        memberId: true,
        email: true,
        drinkTallies: { where: { year, month }, select: { count: true } },
      },
      orderBy: { name: "asc" },
    });

    const rows: DrinkReportRow[] = users
      .filter((user) => !isHiddenAccount(user.email))
      .map((user) => ({
        userId: user.id,
        name: user.name,
        memberId: user.memberId,
        count: user.drinkTallies[0]?.count ?? 0,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return {
      success: true,
      initialCount: budget?.initialCount ?? 0,
      totalTaken: rows.reduce((sum, row) => sum + row.count, 0),
      rows,
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in getDrinkReport", err);
    return { success: false, initialCount: 0, totalTaken: 0, rows: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
