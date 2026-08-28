"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { findOverlappingBooking, lockTableForBooking } from "@/lib/booking-availability";
import { playerSearchBookingLabel } from "@/lib/player-search-types";
import { formatEventDateRange } from "@/lib/datetime";
import { notify } from "@/lib/push/notify";
import {
  createPlayerSearchSchema,
  respondPlayerSearchSchema,
  type CreatePlayerSearchInput,
  type RespondPlayerSearchInput,
} from "@/lib/schemas/player-search";
import type { ServiceResult } from "@/lib/service-types";

// Thrown inside acceptPlayerSearchInterest's transaction so it rolls back.
class PlayerSearchGoneError extends Error {}
class NoTableFreeError extends Error {}

export async function createPlayerSearch(
  values: CreatePlayerSearchInput,
): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const parsed = createPlayerSearchSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    await prisma.playerSearch.create({
      data: {
        creatorId: session.user.id,
        start: parsed.data.start,
        end: parsed.data.end,
        system: parsed.data.system,
        matchType: parsed.data.matchType,
      },
    });

    revalidatePath(ROUTES.SPIELERSUCHE);
    return { success: true, message: MESSAGES.PLAYER_SEARCH.CREATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in createPlayerSearch", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function deletePlayerSearch(id: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const search = await prisma.playerSearch.findUnique({ where: { id } });
  if (!search) return { success: false, message: MESSAGES.PLAYER_SEARCH.NOT_FOUND };
  if (search.creatorId !== session.user.id && !isAdmin(session)) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }

  try {
    await prisma.playerSearch.delete({ where: { id } });
    revalidatePath(ROUTES.SPIELERSUCHE);
    return { success: true, message: MESSAGES.PLAYER_SEARCH.DELETED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deletePlayerSearch", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/**
 * Register interest in an open search. Does not book anything: the search
 * creator later accepts (acceptPlayerSearchInterest) or declines one of the
 * incoming requests.
 */
export async function respondToPlayerSearch(
  searchId: string,
  values: RespondPlayerSearchInput,
): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const parsed = respondPlayerSearchSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  const search = await prisma.playerSearch.findUnique({ where: { id: searchId } });
  if (!search) return { success: false, message: MESSAGES.PLAYER_SEARCH.NOT_AVAILABLE };
  if (search.creatorId === session.user.id) {
    return { success: false, message: MESSAGES.PLAYER_SEARCH.CANNOT_RESPOND_OWN };
  }

  const note = parsed.data.note?.trim() || null;

  try {
    await prisma.playerSearchInterest.create({
      data: { searchId, responderId: session.user.id, note },
    });

    notify(
      [search.creatorId],
      MESSAGES.NOTIFICATIONS.playerSearchInterest(
        session.user.name,
        search.system,
        search.matchType,
        formatEventDateRange(search.start, search.end),
      ),
      ROUTES.SPIELERSUCHE,
      `search-${searchId}`,
    );
    revalidatePath(ROUTES.SPIELERSUCHE);
    revalidatePath(ROUTES.DASHBOARD);
    return { success: true, message: MESSAGES.PLAYER_SEARCH.INTEREST_SENT };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { success: false, message: MESSAGES.PLAYER_SEARCH.ALREADY_RESPONDED };
    }
    unstable_rethrow(err);
    console.error("error in respondToPlayerSearch", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/**
 * The search creator accepts one interested member: auto-book the first free
 * table in Table.autoBookingPriority order for the search's window, add both
 * members as participants, and delete the search (cascading away every other
 * pending interest). Booking + participants + deletion happen in one
 * transaction; per-table advisory locks plus a delete-as-claim keep two
 * concurrent accepts from double-booking.
 */
export async function acceptPlayerSearchInterest(interestId: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const interest = await prisma.playerSearchInterest.findUnique({
    where: { id: interestId },
    include: {
      search: { include: { creator: { select: { name: true } } } },
      responder: { select: { name: true } },
    },
  });
  if (!interest) return { success: false, message: MESSAGES.PLAYER_SEARCH.INTEREST_NOT_FOUND };
  if (interest.search.creatorId !== session.user.id) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }

  const { search } = interest;

  const priorityTables = await prisma.table.findMany({
    where: { active: true, allowMultipleBookings: false, autoBookingPriority: { not: null } },
    orderBy: { autoBookingPriority: "asc" },
    select: { id: true, name: true },
  });
  if (priorityTables.length === 0) {
    return { success: false, message: MESSAGES.PLAYER_SEARCH.NO_PRIORITY_TABLES };
  }

  try {
    const booked = await prisma.$transaction(async (tx) => {
      // Claim the search: if it's already gone, someone else accepted first.
      const claim = await tx.playerSearch.deleteMany({ where: { id: search.id } });
      if (claim.count === 0) throw new PlayerSearchGoneError();

      for (const table of priorityTables) {
        await lockTableForBooking(tx, table.id);
        const overlap = await findOverlappingBooking(tx, table.id, search.start, search.end);
        if (overlap) continue;

        const booking = await tx.booking.create({
          data: {
            tableId: table.id,
            userId: search.creatorId,
            start: search.start,
            end: search.end,
            game: playerSearchBookingLabel(search.system, search.matchType),
            note: interest.note,
          },
        });
        await tx.bookingParticipant.createMany({
          data: [
            { bookingId: booking.id, userId: search.creatorId },
            { bookingId: booking.id, userId: interest.responderId },
          ],
        });

        // notification-potential: tell both search.creatorId and
        // interest.responderId that the match is booked at `table.name`.
        return { tableId: table.id, tableName: table.name };
      }

      throw new NoTableFreeError();
    });

    const dateLabel = formatEventDateRange(search.start, search.end);
    notify(
      [search.creatorId],
      MESSAGES.NOTIFICATIONS.playerSearchBooked(
        interest.responder.name,
        booked.tableName,
        search.system,
        dateLabel,
      ),
      ROUTES.tischDetail(booked.tableId),
      `search-booked-${search.id}`,
    );
    notify(
      [interest.responderId],
      MESSAGES.NOTIFICATIONS.playerSearchBooked(
        interest.search.creator.name,
        booked.tableName,
        search.system,
        dateLabel,
      ),
      ROUTES.tischDetail(booked.tableId),
      `search-booked-${search.id}`,
    );

    revalidatePath(ROUTES.SPIELERSUCHE);
    revalidatePath(ROUTES.DASHBOARD);
    revalidatePath(ROUTES.TISCHE);
    revalidatePath(ROUTES.tischDetail(booked.tableId));

    return { success: true, message: MESSAGES.PLAYER_SEARCH.booked(booked.tableName) };
  } catch (err) {
    if (err instanceof PlayerSearchGoneError) {
      return { success: false, message: MESSAGES.PLAYER_SEARCH.NOT_AVAILABLE };
    }
    if (err instanceof NoTableFreeError) {
      return { success: false, message: MESSAGES.PLAYER_SEARCH.NO_TABLE_FREE };
    }
    unstable_rethrow(err);
    console.error("error in acceptPlayerSearchInterest", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/** The search creator declines one interested member. The search stays open. */
export async function declinePlayerSearchInterest(interestId: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const interest = await prisma.playerSearchInterest.findUnique({
    where: { id: interestId },
    include: {
      search: { select: { creatorId: true, system: true, start: true, end: true } },
    },
  });
  if (!interest) return { success: false, message: MESSAGES.PLAYER_SEARCH.INTEREST_NOT_FOUND };
  if (interest.search.creatorId !== session.user.id) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }

  try {
    await prisma.playerSearchInterest.delete({ where: { id: interestId } });

    notify(
      [interest.responderId],
      MESSAGES.NOTIFICATIONS.playerSearchDeclined(
        session.user.name,
        interest.search.system,
        formatEventDateRange(interest.search.start, interest.search.end),
      ),
      ROUTES.SPIELERSUCHE,
      `search-declined-${interestId}`,
    );
    revalidatePath(ROUTES.SPIELERSUCHE);
    revalidatePath(ROUTES.DASHBOARD);
    return { success: true, message: MESSAGES.PLAYER_SEARCH.INTEREST_DECLINED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in declinePlayerSearchInterest", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
