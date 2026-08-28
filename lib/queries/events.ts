import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MESSAGES } from "@/lib/constants";
import type { ClubEvent } from "@/lib/event-types";

// Upcoming = the event hasn't ended yet. An event with no end time counts as
// upcoming while its start is still in the future.
function upcomingFilter(now: Date) {
  return {
    OR: [{ end: { gte: now } }, { AND: [{ end: null }, { start: { gte: now } }] }],
  };
}

const eventInclude = {
  createdBy: { select: { name: true } },
  participants: { include: { user: { select: { name: true } } } },
} as const;

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: Date;
  end: Date | null;
  createdById: string;
  createdBy: { name: string };
  participants: { userId: string; user: { name: string } }[];
};

function toClubEvent(row: EventRow): ClubEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    start: row.start,
    end: row.end,
    createdById: row.createdById,
    createdByName: row.createdBy.name,
    participants: row.participants.map((p) => ({ userId: p.userId, name: p.user.name })),
  };
}

export async function listUpcomingEvents(): Promise<{
  success: boolean;
  events: ClubEvent[];
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!session) return { success: false, events: [], message: MESSAGES.COMMON.NOT_AUTHENTICATED };

    const rows = await prisma.event.findMany({
      where: upcomingFilter(new Date()),
      orderBy: { start: "asc" },
      include: eventInclude,
    });

    return { success: true, events: rows.map(toClubEvent) };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listUpcomingEvents", err);
    return { success: false, events: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/** Upcoming events the given member has signed up for (for the dashboard). */
export async function listUpcomingEventsForUser(userId: string): Promise<{
  success: boolean;
  events: ClubEvent[];
  message?: string;
}> {
  try {
    const rows = await prisma.event.findMany({
      where: {
        ...upcomingFilter(new Date()),
        participants: { some: { userId } },
      },
      orderBy: { start: "asc" },
      take: 10,
      include: eventInclude,
    });

    return { success: true, events: rows.map(toClubEvent) };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listUpcomingEventsForUser", err);
    return { success: false, events: [], message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
