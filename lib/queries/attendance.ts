import "server-only";
import { unstable_rethrow } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MESSAGES } from "@/lib/constants";
import {
  attendanceDayToDate,
  berlinDayString,
  getTodayBerlinRange,
  startOfMonthBerlin,
} from "@/lib/datetime";
import { buildAttendanceByDay } from "./attendance-helpers";

export interface AttendanceDay {
  date: string;
  count: number;
  mePresent: boolean;
}

/**
 * Attendance days from the start of the current Berlin month onward, for the
 * month calendar. `currentUserId` lets the client colour "own" days.
 */
export async function listAttendanceDays(): Promise<{
  success: boolean;
  days: AttendanceDay[];
  currentUserId: string;
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        days: [],
        currentUserId: "",
        message: MESSAGES.COMMON.NOT_AUTHENTICATED,
      };
    }

    const byDay = await buildAttendanceByDay(startOfMonthBerlin());
    const days = [...byDay.entries()]
      .map(([date, userIds]) => ({
        date,
        count: userIds.size,
        mePresent: userIds.has(session.user.id),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, days, currentUserId: session.user.id };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listAttendanceDays", err);
    return {
      success: false,
      days: [],
      currentUserId: "",
      message: MESSAGES.COMMON.GENERIC_ERROR,
    };
  }
}

export interface TodayAttendee {
  id: string;
  name: string;
}

/**
 * The members marked present today (Berlin), merging explicit Attendance rows
 * with members who own or joined a booking today. Powers the attendance
 * popover next to "Anstehende Reservierungen" on the dashboard.
 */
export async function listTodayAttendees(): Promise<{
  success: boolean;
  attendees: TodayAttendee[];
  message?: string;
}> {
  try {
    const today = getTodayBerlinRange().start;
    const byDay = await buildAttendanceByDay(today);
    const userIds = byDay.get(berlinDayString(today));

    if (!userIds || userIds.size === 0) {
      return { success: true, attendees: [] };
    }

    const attendees = await prisma.user.findMany({
      where: { id: { in: [...userIds] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return { success: true, attendees };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listTodayAttendees", err);
    return {
      success: false,
      attendees: [],
      message: MESSAGES.COMMON.GENERIC_ERROR,
    };
  }
}

/**
 * The soonest day from today (Berlin) onward on which anyone is present, and
 * how many. `null` when nobody is marked for any upcoming day. Powers the
 * Anwesenheit card on the Reservieren page.
 */
export async function getNextAttendanceDay(): Promise<{
  success: boolean;
  next: { date: Date; count: number } | null;
  message?: string;
}> {
  try {
    const today = getTodayBerlinRange().start;
    const byDay = await buildAttendanceByDay(today);

    const todayString = berlinDayString(today);
    const upcoming = [...byDay.entries()]
      .filter(([date, userIds]) => userIds.size > 0 && date >= todayString)
      .sort((a, b) => a[0].localeCompare(b[0]));

    const soonest = upcoming[0];
    return {
      success: true,
      next: soonest
        ? { date: attendanceDayToDate(soonest[0]), count: soonest[1].size }
        : null,
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in getNextAttendanceDay", err);
    return { success: false, next: null, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
