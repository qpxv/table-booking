"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canEditBooking } from "@/lib/permissions";
import { calculateGuestPrice } from "@/lib/pricing";
import { BookingStatus } from "@/generated/prisma/enums";
import {
  createBookingSchema,
  updateBookingSchema,
  type CreateBookingInput,
  type UpdateBookingInput,
} from "@/lib/schemas/booking";
import type { ActionResult } from "@/types/action-result";

export async function createBooking(
  tableId: string,
  values: CreateBookingInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Nicht angemeldet." };

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) return { success: false, message: "Tisch nicht gefunden." };

  const parsed = createBookingSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };
  const data = parsed.data;

  // Server-side overlap validation: a table must not be double-booked for
  // the same time range — except "Mehrfachbuchung" tables, which are
  // specifically meant to allow multiple concurrent events.
  if (!table.allowMultipleBookings) {
    const overlap = await prisma.booking.findFirst({
      where: {
        tableId,
        status: BookingStatus.ACTIVE,
        start: { lt: data.end },
        end: { gt: data.start },
      },
    });
    if (overlap) {
      return { success: false, message: "Der Tisch ist im gewählten Zeitraum bereits belegt." };
    }
  }

  // Shared ("Mehrfachbuchung") tables are members-only signup — never
  // attach guests, regardless of what the client sent.
  const guestInputs = table.allowMultipleBookings ? [] : data.guests;

  for (const guestInput of guestInputs) {
    if ("guestId" in guestInput) {
      const guest = await prisma.guest.findUnique({ where: { id: guestInput.guestId } });
      if (!guest) {
        return { success: false, message: "Ungültiger Gast." };
      }
    }
  }

  const participantUserIds = new Set(data.participantUserIds);
  participantUserIds.delete(session.user.id);
  for (const userId of participantUserIds) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "Ungültiges Mitglied." };
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
          // not a per-booking game — never store a game for them.
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
          // Guests are club-wide — reuse an existing one (case-insensitive)
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

    revalidatePath(`/tische/${tableId}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Buchung erstellt." };
  } catch (err) {
    console.error("error in createBooking", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function updateBooking(
  id: string,
  values: UpdateBookingInput,
): Promise<ActionResult> {
  const session = await getSession();
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { guests: true, table: true },
  });
  if (!booking) return { success: false, message: "Buchung nicht gefunden." };
  if (!canEditBooking(session, booking)) return { success: false, message: "Nicht berechtigt." };

  const parsed = updateBookingSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };
  const data = parsed.data;

  // Shared ("Mehrfachbuchung") tables are members-only signup — treat any
  // submitted guests as not-submitted (same as a drag/resize reschedule),
  // so they're never created/removed here regardless of what the client sent.
  const guestsInput = booking.table.allowMultipleBookings ? undefined : data.guests;
  const participantsInput = data.participantUserIds;

  // Overlap check is skipped for "Mehrfachbuchung" tables — they're
  // specifically meant to allow multiple concurrent events.
  if (!booking.table.allowMultipleBookings) {
    const overlap = await prisma.booking.findFirst({
      where: {
        tableId: booking.tableId,
        status: BookingStatus.ACTIVE,
        id: { not: id },
        start: { lt: data.end },
        end: { gt: data.start },
      },
    });
    if (overlap) {
      return { success: false, message: "Der Tisch ist im gewählten Zeitraum bereits belegt." };
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
          return { success: false, message: "Ungültiger Gast." };
        }
      }
    }
  }
  if (participantsInput !== undefined) {
    for (const userId of participantsInput) {
      if (userId === booking.userId) continue;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, message: "Ungültiges Mitglied." };
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
            // Guests are club-wide — reuse an existing one (case-insensitive)
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

    revalidatePath(`/tische/${booking.tableId}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Buchung aktualisiert." };
  } catch (err) {
    console.error("error in updateBooking", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function cancelBooking(id: string): Promise<ActionResult> {
  const session = await getSession();
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return { success: false, message: "Buchung nicht gefunden." };

  // Admins can cancel any booking; members only their own
  // (canEditBooking already covers "owner OR admin").
  if (!canEditBooking(session, booking)) {
    return { success: false, message: "Nicht berechtigt." };
  }

  try {
    // Soft delete via status — no hard delete, for traceability.
    await prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });

    revalidatePath(`/tische/${booking.tableId}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Buchung storniert." };
  } catch (err) {
    console.error("error in cancelBooking", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function listBookingsForTable(tableId: string) {
  return prisma.booking.findMany({
    where: { tableId, status: BookingStatus.ACTIVE },
    include: {
      user: { select: { name: true } },
      guests: { include: { guest: { select: { name: true } } } },
      participants: { include: { user: { select: { name: true } } } },
    },
    orderBy: { start: "asc" },
  });
}

/** Join any active booking as an additional participant. */
export async function joinBooking(bookingId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Nicht angemeldet." };

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.status !== BookingStatus.ACTIVE) {
    return { success: false, message: "Termin nicht gefunden." };
  }

  try {
    await prisma.bookingParticipant.upsert({
      where: { bookingId_userId: { bookingId, userId: session.user.id } },
      create: { bookingId, userId: session.user.id },
      update: {},
    });

    revalidatePath(`/tische/${booking.tableId}`);
    revalidatePath("/tische");
    revalidatePath("/dashboard");

    return { success: true, message: "Du bist jetzt angemeldet." };
  } catch (err) {
    console.error("error in joinBooking", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

/** Leave a booking. The creator can never leave their own event. */
export async function leaveBooking(bookingId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Nicht angemeldet." };

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { success: false, message: "Termin nicht gefunden." };
  if (booking.userId === session.user.id) {
    return { success: false, message: "Der Ersteller kann den Termin nicht verlassen." };
  }

  try {
    await prisma.bookingParticipant.deleteMany({
      where: { bookingId, userId: session.user.id },
    });

    revalidatePath(`/tische/${booking.tableId}`);
    revalidatePath("/tische");
    revalidatePath("/dashboard");

    return { success: true, message: "Du bist abgemeldet." };
  } catch (err) {
    console.error("error in leaveBooking", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}
