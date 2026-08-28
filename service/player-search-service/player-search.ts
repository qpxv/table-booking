"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { findOverlappingBooking, lockTableForBooking } from "@/lib/booking-availability";
import { playerSearchBookingLabel } from "@/lib/player-search-types";
import {
  createPlayerSearchSchema,
  respondPlayerSearchSchema,
  type CreatePlayerSearchInput,
  type RespondPlayerSearchInput,
} from "@/lib/schemas/player-search";
import type { ServiceResult } from "@/lib/service-types";

// Thrown inside respondToPlayerSearch's transaction so it rolls back.
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
 * Respond to an open search: auto-book the first free table in
 * Table.autoBookingPriority order for the search's time window, add both
 * members as participants, and delete the search. Booking + participants +
 * deletion all happen in one transaction; per-table advisory locks plus a
 * delete-as-claim keep two concurrent responses from double-booking.
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

  const priorityTables = await prisma.table.findMany({
    where: { active: true, allowMultipleBookings: false, autoBookingPriority: { not: null } },
    orderBy: { autoBookingPriority: "asc" },
    select: { id: true, name: true },
  });
  if (priorityTables.length === 0) {
    return { success: false, message: MESSAGES.PLAYER_SEARCH.NO_PRIORITY_TABLES };
  }

  const note = parsed.data.note?.trim() || null;

  try {
    const booked = await prisma.$transaction(async (tx) => {
      // Claim the search: if it's already gone, someone else responded first.
      const claim = await tx.playerSearch.deleteMany({ where: { id: searchId } });
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
            note,
          },
        });
        await tx.bookingParticipant.createMany({
          data: [
            { bookingId: booking.id, userId: search.creatorId },
            { bookingId: booking.id, userId: session.user.id },
          ],
        });

        // notification-potential: tell both search.creatorId and
        // session.user.id that the match is booked at `table.name`.
        return { tableId: table.id, tableName: table.name };
      }

      throw new NoTableFreeError();
    });

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
    console.error("error in respondToPlayerSearch", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
