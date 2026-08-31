"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
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
  isWindowAutoBookable,
  syncPlayerSearchAvailability,
} from "@/lib/queries/player-search-availability";
import {
  createPlayerSearchSchema,
  respondPlayerSearchSchema,
  counterPlayerSearchSchema,
  type CreatePlayerSearchInput,
  type RespondPlayerSearchInput,
  type CounterPlayerSearchInput,
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

  const { fixedTime, system, matchType } = parsed.data;
  const start = fixedTime ? (parsed.data.start ?? null) : null;
  const end = fixedTime ? (parsed.data.end ?? null) : null;

  try {
    // Stamp availability now so the "kein Tisch frei" warning shows straight
    // away if a fixed slot is already full; flexible searches have no window
    // to check and stay `true`.
    const tableAvailable = start && end ? await isWindowAutoBookable(start, end) : true;

    await prisma.playerSearch.create({
      data: { creatorId: session.user.id, start, end, system, matchType, tableAvailable },
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
    revalidatePath(ROUTES.DASHBOARD);
    return { success: true, message: MESSAGES.PLAYER_SEARCH.DELETED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deletePlayerSearch", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/** The creator confirms an open search is still current, resetting the 14-day clock. */
export async function confirmPlayerSearchActive(searchId: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const search = await prisma.playerSearch.findUnique({
    where: { id: searchId },
    select: { creatorId: true },
  });
  if (!search) return { success: false, message: MESSAGES.PLAYER_SEARCH.NOT_FOUND };
  if (search.creatorId !== session.user.id) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }

  try {
    await prisma.playerSearch.update({
      where: { id: searchId },
      data: { confirmedActiveAt: new Date(), staleNotifiedAt: null },
    });
    revalidatePath(ROUTES.SPIELERSUCHE);
    revalidatePath(ROUTES.DASHBOARD);
    return { success: true, message: MESSAGES.PLAYER_SEARCH.CONFIRMED_ACTIVE };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in confirmPlayerSearchActive", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/**
 * Register interest in an open search. Does not book anything. A flexible
 * search requires the responder to propose a time; for a fixed-time search a
 * proposed time is an optional counter-offer, otherwise the creator's window
 * stands and it is the creator's move.
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

  // The window the responder is putting on the table: their own suggestion,
  // or (for a fixed-time search) the creator's window unchanged. Either way
  // the responder made the move, so the creator is now on the clock.
  const proposed =
    parsed.data.proposedStart && parsed.data.proposedEnd
      ? { start: parsed.data.proposedStart, end: parsed.data.proposedEnd }
      : search.start && search.end
        ? { start: search.start, end: search.end }
        : null;

  if (!proposed) return { success: false, message: MESSAGES.PLAYER_SEARCH.TIME_REQUIRED };

  const note = parsed.data.note?.trim() || null;

  try {
    await prisma.playerSearchInterest.create({
      data: {
        searchId,
        responderId: session.user.id,
        note,
        proposedStart: proposed.start,
        proposedEnd: proposed.end,
        proposedById: session.user.id,
      },
    });

    notify(
      [search.creatorId],
      MESSAGES.NOTIFICATIONS.playerSearchInterest(
        session.user.name,
        search.system,
        search.matchType,
        formatEventDateRange(proposed.start, proposed.end),
      ),
      ROUTES.DASHBOARD,
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
 * The party on the clock proposes a different time. Sets the new window and
 * hands the move to the other party. Either side can do this repeatedly until
 * someone accepts or declines.
 */
export async function counterPlayerSearchInterest(
  interestId: string,
  values: CounterPlayerSearchInput,
): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const parsed = counterPlayerSearchSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  const interest = await prisma.playerSearchInterest.findUnique({
    where: { id: interestId },
    include: { search: { select: { creatorId: true } } },
  });
  if (!interest) return { success: false, message: MESSAGES.PLAYER_SEARCH.INTEREST_NOT_FOUND };

  const { creatorId } = interest.search;
  const isParty = session.user.id === creatorId || session.user.id === interest.responderId;
  if (!isParty) return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  if (session.user.id === interest.proposedById) {
    return { success: false, message: MESSAGES.PLAYER_SEARCH.NOT_YOUR_TURN };
  }

  const note = parsed.data.note?.trim();
  const otherPartyId = session.user.id === creatorId ? interest.responderId : creatorId;

  try {
    await prisma.playerSearchInterest.update({
      where: { id: interestId },
      data: {
        proposedStart: parsed.data.start,
        proposedEnd: parsed.data.end,
        proposedById: session.user.id,
        ...(note ? { note } : {}),
      },
    });

    notify(
      [otherPartyId],
      MESSAGES.NOTIFICATIONS.playerSearchCounter(
        session.user.name,
        formatEventDateRange(parsed.data.start, parsed.data.end),
      ),
      ROUTES.DASHBOARD,
      `search-counter-${interestId}`,
    );
    revalidatePath(ROUTES.DASHBOARD);
    return { success: true, message: MESSAGES.PLAYER_SEARCH.COUNTER_SENT };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { success: false, message: MESSAGES.PLAYER_SEARCH.NOT_AVAILABLE };
    }
    unstable_rethrow(err);
    console.error("error in counterPlayerSearchInterest", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/**
 * Accept the standing proposal on an interest: auto-book the first free table
 * in Table.autoBookingPriority order for `interest.proposedStart/End`, add
 * both members as participants, and delete the search (cascading away every
 * other pending interest). Callable by whichever party is on the clock (i.e.
 * did not make the last proposal).
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

  const { search } = interest;
  const isParty = session.user.id === search.creatorId || session.user.id === interest.responderId;
  if (!isParty) return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  if (session.user.id === interest.proposedById) {
    return { success: false, message: MESSAGES.PLAYER_SEARCH.NOT_YOUR_TURN };
  }

  const start = interest.proposedStart;
  const end = interest.proposedEnd;

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
        const overlap = await findOverlappingBooking(tx, table.id, start, end);
        if (overlap) continue;

        const booking = await tx.booking.create({
          data: {
            tableId: table.id,
            userId: search.creatorId,
            start,
            end,
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

        return { tableId: table.id, tableName: table.name };
      }

      throw new NoTableFreeError();
    });

    const dateLabel = formatEventDateRange(start, end);
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
        search.creator.name,
        booked.tableName,
        search.system,
        dateLabel,
      ),
      ROUTES.tischDetail(booked.tableId),
      `search-booked-${search.id}`,
    );

    // The auto-booking just consumed a table: other open Spielersuchen
    // overlapping this window may no longer be bookable.
    after(() => syncPlayerSearchAvailability([{ start, end }]));

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
      // The search survived the rollback but this window is full: refresh the
      // flag so the warning shows without waiting for the next booking event.
      after(() => syncPlayerSearchAvailability([{ start, end }]));
      return { success: false, message: MESSAGES.PLAYER_SEARCH.NO_TABLE_FREE };
    }
    unstable_rethrow(err);
    console.error("error in acceptPlayerSearchInterest", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/**
 * Decline / remove an interest. The search creator may do this to any interest
 * on their search; the responder may do it only when it is their move (i.e.
 * rejecting the creator's counter-proposal). The search stays open.
 */
export async function declinePlayerSearchInterest(interestId: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const interest = await prisma.playerSearchInterest.findUnique({
    where: { id: interestId },
    include: {
      search: { select: { creatorId: true, system: true } },
      responder: { select: { name: true } },
    },
  });
  if (!interest) return { success: false, message: MESSAGES.PLAYER_SEARCH.INTEREST_NOT_FOUND };

  const isCreator = interest.search.creatorId === session.user.id;
  const isResponderTurn =
    interest.responderId === session.user.id && session.user.id !== interest.proposedById;
  if (!isCreator && !isResponderTurn) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }

  const dateLabel = formatEventDateRange(interest.proposedStart, interest.proposedEnd);

  try {
    await prisma.playerSearchInterest.delete({ where: { id: interestId } });

    if (isCreator) {
      notify(
        [interest.responderId],
        MESSAGES.NOTIFICATIONS.playerSearchDeclined(
          session.user.name,
          interest.search.system,
          dateLabel,
        ),
        ROUTES.SPIELERSUCHE,
        `search-declined-${interestId}`,
      );
    } else {
      notify(
        [interest.search.creatorId],
        MESSAGES.NOTIFICATIONS.playerSearchRejected(
          interest.responder.name,
          interest.search.system,
          dateLabel,
        ),
        ROUTES.DASHBOARD,
        `search-rejected-${interestId}`,
      );
    }
    revalidatePath(ROUTES.SPIELERSUCHE);
    revalidatePath(ROUTES.DASHBOARD);
    return { success: true, message: MESSAGES.PLAYER_SEARCH.INTEREST_DECLINED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in declinePlayerSearchInterest", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
