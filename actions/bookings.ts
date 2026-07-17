"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canEditBooking } from "@/lib/permissions";
import { calculateGuestPrice } from "@/lib/pricing";
import { BookingStatus } from "@/generated/prisma/enums";

const guestInputSchema = z.union([
  z.object({ guestId: z.string().min(1) }),
  z.object({ newName: z.string().trim().min(1) }),
]);

const createBookingSchema = z
  .object({
    tableId: z.string().min(1),
    start: z.coerce.date(),
    end: z.coerce.date(),
    game: z.string().trim().optional(),
    guests: z.array(guestInputSchema).default([]),
  })
  .refine((data) => data.start < data.end, {
    message: "Start muss vor dem Ende liegen.",
    path: ["end"],
  });

const updateBookingSchema = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    game: z.string().trim().optional(),
  })
  .refine((data) => data.start < data.end, {
    message: "Start muss vor dem Ende liegen.",
    path: ["end"],
  });

export type BookingFormState = { error?: string; ok?: boolean };

function readGuestsField(formData: FormData) {
  const raw = formData.get("guestsJson"); // review: also we dont need thtis here anymore i think when we switch to RHF
  if (!raw) return [];
  return JSON.parse(String(raw));
}

export async function createBooking(
  tableId: string,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  try {
    const session = await getSession();
    if (!session) throw new Error("Nicht angemeldet.");

    const data = createBookingSchema.parse({
      tableId,
      start: formData.get("start"), // review: same here we construct the formdata objects here for no reason since we can use react hook form
      end: formData.get("end"),
      game: formData.get("game") ?? undefined,
      guests: readGuestsField(formData),
    });

    await prisma.$transaction(async (tx) => {
      // Server-side overlap validation: a table must not be double-booked
      // for the same time range.
      const overlap = await tx.booking.findFirst({
        where: {
          tableId: data.tableId,
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
          tableId: data.tableId,
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

    revalidatePath(`/tische/${data.tableId}`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function updateBooking(
  id: string,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  try {
    const session = await getSession();
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new Error("Buchung nicht gefunden.");
    if (!canEditBooking(session, booking)) throw new Error("Nicht berechtigt.");

    const data = updateBookingSchema.parse({
      start: formData.get("start"),
      end: formData.get("end"),
      game: formData.get("game") ?? undefined,
    });

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
    return { error: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten." };
  }
}

export async function cancelBooking(id: string) {
  const session = await getSession();
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new Error("Buchung nicht gefunden.");

  // Admins can cancel any booking; members only their own
  // (canEditBooking already covers "owner OR admin").
  if (!canEditBooking(session, booking)) {
    throw new Error("Nicht berechtigt.");
  }

  // Soft delete via status — no hard delete, for traceability.
  const updated = await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.CANCELLED },
  });

  revalidatePath(`/tische/${booking.tableId}`);
  revalidatePath("/dashboard");

  return updated;
}

export async function listBookingsForTable(tableId: string) {
  return prisma.booking.findMany({
    where: { tableId, status: BookingStatus.ACTIVE },
    include: { guests: true },
    orderBy: { start: "asc" },
  });
}
