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

export type BookingFormState = { error?: string; ok?: boolean };

export async function createBooking(
  tableId: string,
  values: CreateBookingInput,
): Promise<BookingFormState> {
  try {
    const session = await getSession();
    if (!session) throw new Error("Nicht angemeldet.");

    const data = createBookingSchema.parse(values);

    await prisma.$transaction(async (tx) => {
      // Server-side overlap validation: a table must not be double-booked
      // for the same time range.
      const overlap = await tx.booking.findFirst({
        where: {
          tableId,
          status: BookingStatus.ACTIVE,
          start: { lt: data.end },
          end: { gt: data.start },
        },
      });
      if (overlap) {
        throw new Error("Der Tisch ist im gewählten Zeitraum bereits belegt.");
      }

      const newBooking = await tx.booking.create({
        data: {
          tableId,
          userId: session.user.id,
          start: data.start,
          end: data.end,
          game: data.game || null,
        },
      });

      for (const guestInput of data.guests) {
        let guestId: string;

        if ("guestId" in guestInput) {
          const guest = await tx.guest.findUnique({ where: { id: guestInput.guestId } });
          if (!guest || guest.userId !== session.user.id) {
            throw new Error("Ungültiger Gast.");
          }
          guestId = guest.id;
        } else {
          const newGuest = await tx.guest.create({
            data: { name: guestInput.newName, userId: session.user.id },
          });
          guestId = newGuest.id;
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

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function updateBooking(
  id: string,
  values: UpdateBookingInput,
): Promise<BookingFormState> {
  try {
    const session = await getSession();
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new Error("Buchung nicht gefunden.");
    if (!canEditBooking(session, booking)) throw new Error("Nicht berechtigt.");

    const data = updateBookingSchema.parse(values);

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
      throw new Error("Der Tisch ist im gewählten Zeitraum bereits belegt.");
    }

    await prisma.booking.update({
      where: { id },
      data: { start: data.start, end: data.end, game: data.game || null },
    });

    revalidatePath(`/tische/${booking.tableId}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function cancelBooking(id: string): Promise<BookingFormState> {
  try {
    const session = await getSession();
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new Error("Buchung nicht gefunden.");

    // Admins can cancel any booking; members only their own
    // (canEditBooking already covers "owner OR admin").
    if (!canEditBooking(session, booking)) {
      throw new Error("Nicht berechtigt.");
    }

    // Soft delete via status — no hard delete, for traceability.
    await prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });

    revalidatePath(`/tische/${booking.tableId}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function listBookingsForTable(tableId: string) {
  return prisma.booking.findMany({
    where: { tableId, status: BookingStatus.ACTIVE },
    include: {
      user: { select: { name: true } },
      guests: { include: { guest: { select: { name: true } } } },
    },
    orderBy: { start: "asc" },
  });
}
