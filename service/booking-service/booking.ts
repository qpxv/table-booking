"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canEditBooking } from "@/lib/permissions";
import { calculateGuestPrice, GUEST_PRICE_FIRST_VISIT } from "@/lib/pricing";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { Prisma } from "@/generated/prisma/client";
import {
  createBookingSchema,
  updateBookingSchema,
  type CreateBookingInput,
  type UpdateBookingInput,
} from "@/lib/schemas/booking";
import type { ServiceResult } from "@/lib/service-types";

export async function createBooking(
  tableId: string,
  values: CreateBookingInput,
): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) return { success: false, message: MESSAGES.TABLE.NOT_FOUND };

  const parsed = createBookingSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };
  const data = parsed.data;

  // Server-side overlap validation: a table must not be double-booked for
  // the same time range, except "Mehrfachbuchung" tables, which are
  // specifically meant to allow multiple concurrent events.
  if (!table.allowMultipleBookings) {
    const overlap = await prisma.booking.findFirst({
      where: {
        tableId,
        start: { lt: data.end },
        end: { gt: data.start },
      },
    });
    if (overlap) {
      return { success: false, message: MESSAGES.TABLE.OVERLAP };
    }
  }

  // Shared ("Mehrfachbuchung") tables are members-only signup: never
  // attach guests, regardless of what the client sent.
  const guestInputs = table.allowMultipleBookings ? [] : data.guests;

  for (const guestInput of guestInputs) {
    if ("guestId" in guestInput) {
      const guest = await prisma.guest.findUnique({ where: { id: guestInput.guestId } });
      if (!guest) {
        return { success: false, message: MESSAGES.GUEST.INVALID_GUEST };
      }
    }
  }

  const participantUserIds = new Set(data.participantUserIds);
  participantUserIds.delete(session.user.id);
  for (const userId of participantUserIds) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: MESSAGES.GUEST.INVALID_MEMBER };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          tableId,
          userId: session.user.id,
          start: data.start,
          end: data.end,
          // Shared ("Mehrfachbuchung") tables are a community event slot,
          // not a per-booking game: never store a game for them.
          game: table.allowMultipleBookings ? null : data.game || null,
        },
      });

      // Every booking counts its creator as the first participant, so
      // participant counts/join-leave are uniform everywhere instead of
      // special-casing "+1 for the creator".
      await tx.bookingParticipant.create({
        data: { bookingId: newBooking.id, userId: session.user.id },
      });
      for (const userId of participantUserIds) {
        await tx.bookingParticipant.create({ data: { bookingId: newBooking.id, userId } });
      }

      for (const guestInput of guestInputs) {
        let guestId: string;
        if ("guestId" in guestInput) {
          guestId = guestInput.guestId;
        } else {
          // Guests are club-wide: reuse an existing one (case-insensitive)
          // instead of creating a duplicate for the same real person.
          const existingGuest = await tx.guest.findFirst({
            where: { name: { equals: guestInput.newName, mode: "insensitive" } },
          });
          guestId =
            existingGuest?.id ??
            (
              await tx.guest.create({
                data: { name: guestInput.newName, userId: session.user.id },
              })
            ).id;
        }

        // Price is frozen at creation time (snapshot), not computed live.
        const previousVisitCount = await tx.bookingGuest.count({ where: { guestId } });
        const price = calculateGuestPrice(previousVisitCount);

        await tx.bookingGuest.create({
          data: { bookingId: newBooking.id, guestId, price },
        });
      }
    });

    revalidatePath(`${ROUTES.TISCHE}/${tableId}`);
    revalidatePath(ROUTES.DASHBOARD);

    return { success: true, message: MESSAGES.BOOKING.CREATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in createBooking", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function updateBooking(
  id: string,
  values: UpdateBookingInput,
): Promise<ServiceResult> {
  const session = await getSession();
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { guests: true, table: true },
  });
  if (!booking) return { success: false, message: MESSAGES.BOOKING.NOT_FOUND };
  if (!canEditBooking(session, booking)) return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };

  const parsed = updateBookingSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };
  const data = parsed.data;

  // Shared ("Mehrfachbuchung") tables are members-only signup: treat any
  // submitted guests as not-submitted (same as a drag/resize reschedule),
  // so they're never created/removed here regardless of what the client sent.
  const guestsInput = booking.table.allowMultipleBookings ? undefined : data.guests;
  const participantsInput = data.participantUserIds;

  // Overlap check is skipped for "Mehrfachbuchung" tables: they're
  // specifically meant to allow multiple concurrent events.
  if (!booking.table.allowMultipleBookings) {
    const overlap = await prisma.booking.findFirst({
      where: {
        tableId: booking.tableId,
        id: { not: id },
        start: { lt: data.end },
        end: { gt: data.start },
      },
    });
    if (overlap) {
      return { success: false, message: MESSAGES.TABLE.OVERLAP };
    }
  }

  // Guests/participants are only reconciled when the caller actually
  // submitted a list (the edit dialog does; drag/resize reschedules omit
  // both entirely so existing assignments are left untouched).
  if (guestsInput !== undefined) {
    for (const guestInput of guestsInput) {
      if ("guestId" in guestInput) {
        const guest = await prisma.guest.findUnique({ where: { id: guestInput.guestId } });
        if (!guest) {
          return { success: false, message: MESSAGES.GUEST.INVALID_GUEST };
        }
      }
    }
  }
  if (participantsInput !== undefined) {
    for (const userId of participantsInput) {
      if (userId === booking.userId) continue;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, message: MESSAGES.GUEST.INVALID_MEMBER };
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: {
          start: data.start,
          end: data.end,
          game: booking.table.allowMultipleBookings ? null : data.game || null,
        },
      });

      if (guestsInput !== undefined) {
        const keepGuestIds = new Set<string>();

        for (const guestInput of guestsInput) {
          if ("guestId" in guestInput) {
            keepGuestIds.add(guestInput.guestId);

            const alreadyAttached = booking.guests.some(
              (bg) => bg.guestId === guestInput.guestId,
            );
            if (!alreadyAttached) {
              const previousVisitCount = await tx.bookingGuest.count({
                where: { guestId: guestInput.guestId },
              });
              const price = calculateGuestPrice(previousVisitCount);
              await tx.bookingGuest.create({
                data: { bookingId: id, guestId: guestInput.guestId, price },
              });
            }
          } else {
            // Guests are club-wide: reuse an existing one (case-insensitive)
            // instead of creating a duplicate for the same real person.
            const existingGuest = await tx.guest.findFirst({
              where: { name: { equals: guestInput.newName, mode: "insensitive" } },
            });
            const guestId =
              existingGuest?.id ??
              (
                await tx.guest.create({
                  data: { name: guestInput.newName, userId: booking.userId },
                })
              ).id;
            const previousVisitCount = await tx.bookingGuest.count({ where: { guestId } });
            const price = calculateGuestPrice(previousVisitCount);
            await tx.bookingGuest.create({ data: { bookingId: id, guestId, price } });
            keepGuestIds.add(guestId);
          }
        }

        const toRemove = booking.guests.filter((bg) => !keepGuestIds.has(bg.guestId));
        if (toRemove.length > 0) {
          await tx.bookingGuest.deleteMany({ where: { id: { in: toRemove.map((bg) => bg.id) } } });

          // Removing a guest can leave a later booking's frozen price
          // stale: it was priced as a "returning guest" only because this
          // now-removed visit existed at the time. Recheck each affected
          // guest's remaining entries.
          const removedGuestIds = new Set(toRemove.map((bg) => bg.guestId));
          for (const guestId of removedGuestIds) {
            await recalculateGuestPricing(tx, guestId);
          }
        }
      }

      if (participantsInput !== undefined) {
        const keepUserIds = new Set(participantsInput);
        // The creator always stays a participant regardless of what was submitted.
        keepUserIds.add(booking.userId);

        for (const userId of keepUserIds) {
          await tx.bookingParticipant.upsert({
            where: { bookingId_userId: { bookingId: id, userId } },
            create: { bookingId: id, userId },
            update: {},
          });
        }

        await tx.bookingParticipant.deleteMany({
          where: { bookingId: id, userId: { notIn: [...keepUserIds] } },
        });
      }
    });

    revalidatePath(`${ROUTES.TISCHE}/${booking.tableId}`);
    revalidatePath(ROUTES.DASHBOARD);

    return { success: true, message: MESSAGES.BOOKING.UPDATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in updateBooking", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function cancelBooking(id: string): Promise<ServiceResult> {
  const session = await getSession();
  const booking = await prisma.booking.findUnique({ where: { id }, include: { guests: true } });
  if (!booking) return { success: false, message: MESSAGES.BOOKING.NOT_FOUND };

  // Admins can cancel any booking; members only their own
  // (canEditBooking already covers "owner OR admin").
  if (!canEditBooking(session, booking)) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Hard delete: no history is kept for cancelled bookings. Cascades
      // to this booking's BookingGuest/BookingParticipant rows.
      await tx.booking.delete({ where: { id } });

      // A removed guest's later booking may have been priced as
      // "returning guest" only because this now-deleted visit existed.
      // Recheck each affected guest's remaining entries.
      const affectedGuestIds = new Set(booking.guests.map((bg) => bg.guestId));
      for (const guestId of affectedGuestIds) {
        await recalculateGuestPricing(tx, guestId);
      }
    });

    revalidatePath(`${ROUTES.TISCHE}/${booking.tableId}`);
    revalidatePath(ROUTES.DASHBOARD);

    return { success: true, message: MESSAGES.BOOKING.CANCELLED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in cancelBooking", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/**
 * A guest's BookingGuest.price is frozen at creation time based on their
 * visit count then. Deleting an earlier visit (cancel, or removing the
 * guest from a booking) can leave a later, still-unpaid entry stale: it
 * was priced as a "returning guest" only because the now-gone visit
 * existed. If the guest no longer has any entry marked as their free first
 * visit, promote their earliest remaining entry to free.
 */
async function recalculateGuestPricing(
  tx: Prisma.TransactionClient,
  guestId: string,
): Promise<void> {
  const hasFreeVisit = await tx.bookingGuest.findFirst({
    where: { guestId, price: GUEST_PRICE_FIRST_VISIT },
  });
  if (hasFreeVisit) return;

  const earliestRemaining = await tx.bookingGuest.findFirst({
    where: { guestId },
    orderBy: { booking: { start: "asc" } },
  });
  if (!earliestRemaining) return;

  await tx.bookingGuest.update({
    where: { id: earliestRemaining.id },
    data: { price: GUEST_PRICE_FIRST_VISIT },
  });
}

/** Join any active booking as an additional participant. */
export async function joinBooking(bookingId: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, message: MESSAGES.BOOKING.EVENT_NOT_FOUND };
  }

  try {
    await prisma.bookingParticipant.upsert({
      where: { bookingId_userId: { bookingId, userId: session.user.id } },
      create: { bookingId, userId: session.user.id },
      update: {},
    });

    revalidatePath(`${ROUTES.TISCHE}/${booking.tableId}`);
    revalidatePath(ROUTES.TISCHE);
    revalidatePath(ROUTES.DASHBOARD);

    return { success: true, message: MESSAGES.BOOKING.JOINED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in joinBooking", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

/** Leave a booking. The creator can never leave their own event. */
export async function leaveBooking(bookingId: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { success: false, message: MESSAGES.BOOKING.EVENT_NOT_FOUND };
  if (booking.userId === session.user.id) {
    return { success: false, message: MESSAGES.BOOKING.CREATOR_CANNOT_LEAVE };
  }

  try {
    await prisma.bookingParticipant.deleteMany({
      where: { bookingId, userId: session.user.id },
    });

    revalidatePath(`${ROUTES.TISCHE}/${booking.tableId}`);
    revalidatePath(ROUTES.TISCHE);
    revalidatePath(ROUTES.DASHBOARD);

    return { success: true, message: MESSAGES.BOOKING.LEFT };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in leaveBooking", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
