"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { isValidIban } from "@/lib/iban";
import { buildEpcPayload } from "@/lib/sepaQr";
import { formatBerlin } from "@/lib/datetime";
import { BookingStatus } from "@/generated/prisma/enums";
import type { ActionResult } from "@/types/action-result";

export type GuestHistoryRow = {
  id: string;
  memberId: string | null;
  memberName: string;
  memberUserId: string;
  tableName: string;
  start: Date;
  guestName: string;
  price: number;
  paid: boolean;
  hasIban: boolean;
};

/** Admins see every member's guests; everyone else sees only guests they brought. */
export async function listGuestHistory(): Promise<GuestHistoryRow[]> {
  const session = await getSession();
  if (!session) throw new Error("Nicht angemeldet.");

  const admin = isAdmin(session);

  const bookingGuests = await prisma.bookingGuest.findMany({
    where: {
      booking: {
        status: BookingStatus.ACTIVE,
        ...(admin ? {} : { userId: session.user.id }),
      },
    },
    include: {
      guest: { select: { name: true } },
      booking: {
        include: {
          table: { select: { name: true } },
          user: { select: { id: true, name: true, memberId: true, iban: true } },
        },
      },
    },
    // Open (unpaid) entries first, newest booking first within each group.
    orderBy: [{ paid: "asc" }, { booking: { start: "desc" } }],
  });

  return bookingGuests.map((bookingGuest) => ({
    id: bookingGuest.id,
    memberId: bookingGuest.booking.user.memberId,
    memberName: bookingGuest.booking.user.name,
    memberUserId: bookingGuest.booking.user.id,
    tableName: bookingGuest.booking.table.name,
    start: bookingGuest.booking.start,
    guestName: bookingGuest.guest.name,
    price: Number(bookingGuest.price),
    paid: bookingGuest.paid,
    hasIban: !!bookingGuest.booking.user.iban && isValidIban(bookingGuest.booking.user.iban),
  }));
}

export async function setBookingGuestPaid(
  bookingGuestId: string,
  paid: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Nicht angemeldet." };

  const bookingGuest = await prisma.bookingGuest.findUnique({
    where: { id: bookingGuestId },
    include: { booking: { select: { userId: true } } },
  });
  if (!bookingGuest) return { success: false, message: "Eintrag nicht gefunden." };

  if (bookingGuest.booking.userId !== session.user.id && !isAdmin(session)) {
    return { success: false, message: "Nicht berechtigt." };
  }

  try {
    await prisma.bookingGuest.update({ where: { id: bookingGuestId }, data: { paid } });
    revalidatePath("/gasthistorie");
    return { success: true, message: paid ? "Als bezahlt markiert." : "Als offen markiert." };
  } catch (err) {
    console.error("error in setBookingGuestPaid", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

// Not a plain ActionResult: this needs to carry data back (reference text,
// amount, QR image), not just a toast message, so it gets its own small
// discriminated result instead of forcing the mutation-shaped convention.
export type GuestPaymentReferenceResult =
  | {
      success: true;
      referenceText: string;
      amount: number;
      qrDataUrl: string | null;
      paymentDetailsText: string;
    }
  | { success: false; message: string };

/**
 * Builds the Verwendungszweck text for a guest's payment, a full copyable
 * "Bezahlungsdetails" block (IBAN/Empfänger/Betrag/Verwendungszweck) for
 * members who'd rather send a manual transfer request than deal with a QR
 * code, and a SEPA (EPC/GiroCode) QR image if the bringing member has a
 * valid IBAN saved. Deliberately sends the IBAN back this time (unlike the
 * QR path, which never did) — the whole point of "Bezahlungsdetails
 * kopieren" is letting the viewer read/copy it, and the caller is already
 * either the bringing member themselves or an admin trusted with full
 * payment data on this page.
 */
export async function getGuestPaymentReference(
  bookingGuestId: string,
): Promise<GuestPaymentReferenceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Nicht angemeldet." };

  const bookingGuest = await prisma.bookingGuest.findUnique({
    where: { id: bookingGuestId },
    include: {
      guest: { select: { name: true } },
      booking: {
        include: {
          table: { select: { name: true } },
          user: { select: { id: true, name: true, iban: true } },
        },
      },
    },
  });
  if (!bookingGuest) return { success: false, message: "Eintrag nicht gefunden." };

  const { booking } = bookingGuest;
  if (booking.userId !== session.user.id && !isAdmin(session)) {
    return { success: false, message: "Nicht berechtigt." };
  }

  const amount = Number(bookingGuest.price);
  const referenceText = `Gast ${bookingGuest.guest.name}, ${booking.table.name}, ${formatBerlin(booking.start, "dd.MM.yyyy")}`;

  let qrDataUrl: string | null = null;
  const hasValidIban = !!booking.user.iban && isValidIban(booking.user.iban);
  if (hasValidIban) {
    const payload = buildEpcPayload({
      name: booking.user.name,
      iban: booking.user.iban!,
      amount,
      reference: referenceText,
    });
    qrDataUrl = await QRCode.toDataURL(payload);
  }

  const paymentDetailsText = [
    hasValidIban ? `IBAN: ${booking.user.iban}` : null,
    `Empfänger: ${booking.user.name}`,
    `Betrag: ${amount.toFixed(2)} €`,
    `Verwendungszweck: ${referenceText}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return { success: true, referenceText, amount, qrDataUrl, paymentDetailsText };
}
