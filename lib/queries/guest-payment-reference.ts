"use server";

// Read-only (no DB writes), but PaymentDialog.tsx (a Client Component) calls
// this directly from a useEffect, so it needs "use server" instead of the
// usual "import server-only" query guard: the rare exception called out in
// the read/write split rule, not a mutation.
import { unstable_rethrow } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { isValidIban } from "@/lib/iban";
import { buildEpcPayload } from "@/lib/sepaQr";
import { formatBerlin } from "@/lib/datetime";
import type { PaymentReferenceResult } from "@/lib/guest-history-types";

/**
 * Builds the Verwendungszweck text for a guest's payment, a full copyable
 * "Bezahlungsdetails" block (IBAN/Empfänger/Betrag/Verwendungszweck) for
 * members who'd rather send a manual transfer request than deal with a QR
 * code, and a SEPA (EPC/GiroCode) QR image if the bringing member has a
 * valid IBAN saved. Deliberately sends the IBAN back this time (unlike the
 * QR path, which never did): the whole point of "Bezahlungsdetails
 * kopieren" is letting the viewer read/copy it, and the caller is already
 * either the bringing member themselves or an admin trusted with full
 * payment data on this page.
 */
export async function getGuestPaymentReference(bookingGuestId: string): Promise<PaymentReferenceResult> {
  const empty = { referenceText: "", amount: 0, qrDataUrl: null, paymentDetailsText: "" };

  try {
    const session = await getSession();
    if (!session) return { success: false, ...empty, message: "Nicht angemeldet." };

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
    if (!bookingGuest) return { success: false, ...empty, message: "Eintrag nicht gefunden." };

    const { booking } = bookingGuest;
    if (booking.userId !== session.user.id && !isAdmin(session)) {
      return { success: false, ...empty, message: "Nicht berechtigt." };
    }

    const amount = Number(bookingGuest.price);
    const referenceText = `Gast ${bookingGuest.guest.name}, ${booking.table.name}, ${formatBerlin(booking.start, "dd.MM.yyyy")}`;

    let qrDataUrl: string | null = null;
    const { iban } = booking.user;
    const hasValidIban = !!iban && isValidIban(iban);
    if (hasValidIban && iban) {
      const payload = buildEpcPayload({
        name: booking.user.name,
        iban,
        amount,
        reference: referenceText,
      });
      qrDataUrl = await QRCode.toDataURL(payload);
    }

    const paymentDetailsText = [
      hasValidIban ? `IBAN: ${iban}` : null,
      `Empfänger: ${booking.user.name}`,
      `Betrag: ${amount.toFixed(2)} €`,
      `Verwendungszweck: ${referenceText}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    return { success: true, referenceText, amount, qrDataUrl, paymentDetailsText };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in getGuestPaymentReference", err);
    return { success: false, ...empty, message: "Ein Fehler ist aufgetreten." };
  }
}
