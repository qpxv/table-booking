import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { isValidIban } from "@/lib/iban";
import { BookingStatus } from "@/generated/prisma/enums";
import type { GuestHistoryRow } from "@/lib/guest-history-types";

/** Admins see every member's guests; everyone else sees only guests they brought. */
export async function listGuestHistory(): Promise<{
  success: boolean;
  rows: GuestHistoryRow[];
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!session) return { success: false, rows: [], message: "Nicht angemeldet." };

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

    return {
      success: true,
      rows: bookingGuests.map((bookingGuest) => ({
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
      })),
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listGuestHistory", err);
    return { success: false, rows: [], message: "Ein Fehler ist aufgetreten." };
  }
}
