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
  respondedByMe: boolean;
  interestCount: number;
};

export type IncomingPlayerSearchInterest = {
  id: string;
  note: string | null;
  responderName: string;
  createdAt: Date;
  search: {
    id: string;
    start: Date;
    end: Date;
    system: string;
    matchType: string;
  };
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
        include: {
          creator: { select: { name: true } },
          interests: { select: { responderId: true } },
        },
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
        respondedByMe: row.interests.some((i) => i.responderId === session.user.id),
        interestCount: row.interests.length,
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

/** Pending interest requests on searches created by the given member. */
export async function listIncomingPlayerSearchInterests(userId: string): Promise<{
  success: boolean;
  interests: IncomingPlayerSearchInterest[];
  message?: string;
}> {
  try {
    const rows = await prisma.playerSearchInterest.findMany({
      where: { search: { creatorId: userId, end: { gte: new Date() } } },
      orderBy: { createdAt: "asc" },
      include: {
        responder: { select: { name: true } },
        search: { select: { id: true, start: true, end: true, system: true, matchType: true } },
      },
    });

    return {
      success: true,
      interests: rows.map((row) => ({
        id: row.id,
        note: row.note,
        responderName: row.responder.name,
        createdAt: row.createdAt,
        search: row.search,
      })),
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listIncomingPlayerSearchInterests", err);
    return { success: false, interests: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
