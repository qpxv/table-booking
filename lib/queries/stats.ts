import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isHiddenAccount } from "@/lib/permissions";
import { MESSAGES } from "@/lib/constants";
import { BookingStatus } from "@/generated/prisma/enums";

/** Aggregate club stats for the public landing page's Ablauf counters. */
export async function getClubStats(): Promise<{
  success: boolean;
  memberCount: number;
  bookingCount: number;
  message?: string;
}> {
  try {
    const [members, bookingCount] = await Promise.all([
      prisma.user.findMany({ where: { banned: { not: true } }, select: { email: true } }),
      prisma.booking.count({ where: { status: BookingStatus.ACTIVE } }),
    ]);

    return {
      success: true,
      memberCount: members.filter((member) => !isHiddenAccount(member.email)).length,
      bookingCount,
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in getClubStats", err);
    return { success: false, memberCount: 0, bookingCount: 0, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
