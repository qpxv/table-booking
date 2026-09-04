import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MESSAGES } from "@/lib/constants";

// The creator is nagged to confirm a search is still current once it has been
// open (unconfirmed) this long. Mirrored by the stale-check cron.
export const PLAYER_SEARCH_STALE_AFTER_DAYS = 14;

/** Phase 2 of a group search: the table is booked and it is filling up. */
export type PlayerSearchBooking = {
  tableId: string;
  tableName: string;
  start: Date;
  end: Date;
  participantCount: number;
};

export type OpenPlayerSearch = {
  id: string;
  start: Date | null;
  end: Date | null;
  system: string;
  matchType: string;
  playerCount: number;
  creatorId: string;
  creatorName: string;
  respondedByMe: boolean;
  interestCount: number;
  tableAvailable: boolean;
  needsActiveConfirmation: boolean;
  // Null while still negotiating a first opponent (phase 1). Set once the
  // table is booked and members join via "Mitmachen" (phase 2).
  booking: PlayerSearchBooking | null;
  // Whether the current user is already a participant of `booking`.
  joinedByMe: boolean;
};

export type StalePlayerSearch = {
  id: string;
  system: string;
  matchType: string;
  start: Date | null;
  end: Date | null;
  createdAt: Date;
};

export type PlayerSearchNegotiation = {
  id: string;
  role: "creator" | "responder";
  counterpartName: string;
  proposerName: string;
  proposedStart: Date;
  proposedEnd: Date;
  proposedByMe: boolean;
  awaitingMe: boolean;
  note: string | null;
  system: string;
  matchType: string;
  // null when the underlying search has a flexible time (no window to check).
  tableAvailable: boolean | null;
};

function staleCutoff(now: Date): Date {
  return new Date(now.getTime() - PLAYER_SEARCH_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
}

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

    const now = new Date();
    const cutoff = staleCutoff(now);

    const [rows, priorityTableCount] = await Promise.all([
      prisma.playerSearch.findMany({
        // Fixed-time searches drop off once their window has passed; flexible
        // ones (no end) stay until accepted or deleted. Phase-2 group searches
        // always carry a concrete window (the booked one), so `end` covers them.
        where: { OR: [{ end: { gte: now } }, { end: null }] },
        orderBy: { start: "asc" },
        include: {
          creator: { select: { name: true } },
          _count: { select: { interests: true } },
          interests: { where: { responderId: session.user.id }, select: { id: true } },
          booking: {
            select: {
              tableId: true,
              start: true,
              end: true,
              table: { select: { name: true } },
              _count: { select: { participants: true } },
              participants: {
                where: { userId: session.user.id },
                select: { id: true },
              },
            },
          },
        },
      }),
      prisma.table.count({
        where: { active: true, allowMultipleBookings: false, autoBookingPriority: { not: null } },
      }),
    ]);

    return {
      success: true,
      hasPriorityTable: priorityTableCount > 0,
      searches: rows.map((row) => {
        const isOwn = row.creatorId === session.user.id;
        return {
          id: row.id,
          start: row.start,
          end: row.end,
          system: row.system,
          matchType: row.matchType,
          playerCount: row.playerCount,
          creatorId: row.creatorId,
          creatorName: row.creator.name,
          respondedByMe: row.interests.length > 0,
          interestCount: row._count.interests,
          tableAvailable: row.tableAvailable,
          // A booked (phase-2) search is inherently active: never nag it.
          needsActiveConfirmation:
            isOwn && row.bookingId === null && row.confirmedActiveAt < cutoff,
          booking: row.booking
            ? {
                tableId: row.booking.tableId,
                tableName: row.booking.table.name,
                start: row.booking.start,
                end: row.booking.end,
                participantCount: row.booking._count.participants,
              }
            : null,
          joinedByMe: (row.booking?.participants.length ?? 0) > 0,
        };
      }),
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

/** The member's own still-open searches that have gone 14 days unconfirmed. */
export async function listStalePlayerSearchesForUser(userId: string): Promise<{
  success: boolean;
  searches: StalePlayerSearch[];
  message?: string;
}> {
  try {
    const now = new Date();
    const searches = await prisma.playerSearch.findMany({
      where: {
        creatorId: userId,
        // Phase-2 searches are booked and active: exclude from the stale nag.
        bookingId: null,
        confirmedActiveAt: { lt: staleCutoff(now) },
        OR: [{ end: { gte: now } }, { end: null }],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, system: true, matchType: true, start: true, end: true, createdAt: true },
    });
    return { success: true, searches };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listStalePlayerSearchesForUser", err);
    return { success: false, searches: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/**
 * Every still-live time negotiation the given member is part of, whether as
 * the search creator or as an interested responder. Newest activity first.
 */
export async function listPlayerSearchNegotiations(userId: string): Promise<{
  success: boolean;
  negotiations: PlayerSearchNegotiation[];
  message?: string;
}> {
  try {
    const rows = await prisma.playerSearchInterest.findMany({
      where: {
        proposedEnd: { gte: new Date() },
        OR: [{ search: { creatorId: userId } }, { responderId: userId }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        responder: { select: { name: true } },
        search: {
          select: {
            creatorId: true,
            system: true,
            matchType: true,
            start: true,
            tableAvailable: true,
            creator: { select: { name: true } },
          },
        },
      },
    });

    return {
      success: true,
      negotiations: rows.map((row) => {
        const role: "creator" | "responder" =
          row.search.creatorId === userId ? "creator" : "responder";
        const creatorName = row.search.creator.name;
        const proposerName =
          row.proposedById === row.search.creatorId ? creatorName : row.responder.name;
        return {
          id: row.id,
          role,
          counterpartName: role === "creator" ? row.responder.name : creatorName,
          proposerName,
          proposedStart: row.proposedStart,
          proposedEnd: row.proposedEnd,
          proposedByMe: row.proposedById === userId,
          awaitingMe: row.proposedById !== userId,
          note: row.note,
          system: row.search.system,
          matchType: row.search.matchType,
          tableAvailable: row.search.start === null ? null : row.search.tableAvailable,
        };
      }),
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listPlayerSearchNegotiations", err);
    return { success: false, negotiations: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
