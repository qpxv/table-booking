import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MESSAGES } from "@/lib/constants";

export type OpenPlayerSearch = {
  id: string;
  start: Date;
  end: Date;
  system: string;
  matchType: string;
  creatorId: string;
  creatorName: string;
};

/** Still-open searches whose window hasn't fully passed, soonest first. */
export async function listOpenPlayerSearches(): Promise<{
  success: boolean;
  searches: OpenPlayerSearch[];
  hasPriorityTable: boolean;
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        searches: [],
        hasPriorityTable: false,
        message: MESSAGES.COMMON.NOT_AUTHENTICATED,
      };
    }

    const [rows, priorityTableCount] = await Promise.all([
      prisma.playerSearch.findMany({
        where: { end: { gte: new Date() } },
        orderBy: { start: "asc" },
        include: { creator: { select: { name: true } } },
      }),
      prisma.table.count({
        where: { active: true, allowMultipleBookings: false, autoBookingPriority: { not: null } },
      }),
    ]);

    return {
      success: true,
      hasPriorityTable: priorityTableCount > 0,
      searches: rows.map((row) => ({
        id: row.id,
        start: row.start,
        end: row.end,
        system: row.system,
        matchType: row.matchType,
        creatorId: row.creatorId,
        creatorName: row.creator.name,
      })),
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listOpenPlayerSearches", err);
    return {
      success: false,
      searches: [],
      hasPriorityTable: false,
      message: MESSAGES.COMMON.GENERIC_ERROR,
    };
  }
}
