"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ROUTES, MESSAGES } from "@/lib/constants";
import {
  attendanceDayToDate,
  berlinDayRange,
  berlinDayString,
  getTodayBerlinRange,
} from "@/lib/datetime";
import type { ServiceResult } from "@/lib/service-types";

const dayStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Toggles the current member's Anwesenheit for a Berlin calendar day. No-ops
 * (with an explanatory message) when a booking already covers that
 * member/day, since bookings count as present on their own.
 */
export async function toggleAttendance(dayString: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const parsed = dayStringSchema.safeParse(dayString);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };
  const day = parsed.data;

  if (day < berlinDayString(getTodayBerlinRange().start)) {
    return { success: false, message: MESSAGES.ATTENDANCE.PAST_DAY };
  }

  try {
    const { start, end } = berlinDayRange(day);
    const bookedThatDay = await prisma.booking.findFirst({
      where: {
        start: { gte: start, lt: end },
        OR: [{ userId: session.user.id }, { participants: { some: { userId: session.user.id } } }],
      },
      select: { id: true },
    });
    if (bookedThatDay) return { success: false, message: MESSAGES.ATTENDANCE.BOOKED };

    const date = attendanceDayToDate(day);
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: session.user.id, date } },
      select: { id: true },
    });

    if (existing) {
      await prisma.attendance.delete({ where: { id: existing.id } });
    } else {
      await prisma.attendance.create({ data: { userId: session.user.id, date } });
    }

    revalidatePath(ROUTES.ANWESENHEIT);
    revalidatePath(ROUTES.TISCHE);
    return {
      success: true,
      message: existing ? MESSAGES.ATTENDANCE.UNMARKED : MESSAGES.ATTENDANCE.MARKED,
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in toggleAttendance", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
