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
  // the same time range.
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

  try {
    await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          tableId,
          userId: session.user.id,
          start: data.start,
          end: data.end,
          game: data.game || null,
        },
      });

      // Shared ("Mehrfachbuchung") tables count the creator as the first
      // participant, so participant counts are uniform everywhere instead
      // of special-casing "+1 for the creator".
      if (table.allowMultipleBookings) {
        await tx.bookingParticipant.create({
          data: { bookingId: newBooking.id, userId: session.user.id },
        });
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

  // Guests are only reconciled when the caller actually submitted a list
  // (the edit dialog does; drag/resize reschedules omit it entirely so
  // existing guest assignments are left untouched).
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

  try {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: { start: data.start, end: data.end, game: data.game || null },
      });

      if (guestsInput === undefined) return;

      const keepGuestIds = new Set<string>();

      for (const guestInput of guestsInput) {
        if ("guestId" in guestInput) {
          keepGuestIds.add(guestInput.guestId);

          const alreadyAttached = booking.guests.some((bg) => bg.guestId === guestInput.guestId);
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

/** Join a "Mehrfachbuchung" (shared) table's event as an additional participant. */
export async function joinBooking(bookingId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Nicht angemeldet." };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { table: true },
  });
  if (!booking || booking.status !== BookingStatus.ACTIVE) {
    return { success: false, message: "Termin nicht gefunden." };
  }
  if (!booking.table.allowMultipleBookings) {
    return { success: false, message: "Dieser Tisch erlaubt keine Mehrfachbuchung." };
  }

  try {
    await prisma.bookingParticipant.upsert({
      where: { bookingId_userId: { bookingId, userId: session.user.id } },
      create: { bookingId, userId: session.user.id },
      update: {},
    });

    revalidatePath(`/tische/${booking.tableId}`);
    revalidatePath("/tische");

    return { success: true, message: "Du bist jetzt angemeldet." };
  } catch (err) {
    console.error("error in joinBooking", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

/** Leave a "Mehrfachbuchung" event. Does not affect the booking itself. */
export async function leaveBooking(bookingId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Nicht angemeldet." };

  try {
    await prisma.bookingParticipant.deleteMany({
      where: { bookingId, userId: session.user.id },
    });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (booking) {
      revalidatePath(`/tische/${booking.tableId}`);
      revalidatePath("/tische");
    }

    return { success: true, message: "Du bist abgemeldet." };
  } catch (err) {
    console.error("error in leaveBooking", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}
