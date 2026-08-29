import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MESSAGES } from "@/lib/constants";

/** Aggregate club stats for the public landing page's Ablauf counters. */
export async function getClubStats(): Promise<{
  success: boolean;
  memberCount: number;
  bookingCount: number;
  message?: string;
}> {
  try {
    const hiddenEmail = process.env.DEV_ACCOUNT_EMAIL;

    const [memberCount, bookingCount] = await Promise.all([
      prisma.user.count({
        where: {
          banned: { not: true },
          ...(hiddenEmail
            ? { NOT: { email: { equals: hiddenEmail, mode: "insensitive" } } }
            : {}),
        },
      }),
      prisma.booking.count(),
    ]);

    return { success: true, memberCount, bookingCount };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in getClubStats", err);
    return { success: false, memberCount: 0, bookingCount: 0, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
