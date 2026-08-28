"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { formatEventDateRange } from "@/lib/datetime";
import { notify } from "@/lib/push/notify";
import type { ServiceResult } from "@/lib/service-types";

export async function setBookingGuestPaid(bookingGuestId: string, paid: boolean): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const bookingGuest = await prisma.bookingGuest.findUnique({
    where: { id: bookingGuestId },
    include: {
      booking: { select: { userId: true, start: true, end: true } },
      guest: { select: { name: true } },
    },
  });
  if (!bookingGuest) return { success: false, message: MESSAGES.GUEST.NOT_FOUND };

  const ownerId = bookingGuest.booking.userId;
  if (ownerId !== session.user.id && !isAdmin(session)) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }

  try {
    await prisma.bookingGuest.update({ where: { id: bookingGuestId }, data: { paid } });

    // Only when an admin toggles someone else's entry.
    if (ownerId !== session.user.id) {
      notify(
        [ownerId],
        MESSAGES.NOTIFICATIONS.guestPaymentToggled(
          paid,
          bookingGuest.guest.name,
          formatEventDateRange(bookingGuest.booking.start, bookingGuest.booking.end),
        ),
        ROUTES.GASTHISTORIE,
        `guest-paid-${bookingGuestId}`,
      );
    }
    revalidatePath(ROUTES.GASTHISTORIE);
    return { success: true, message: paid ? MESSAGES.PAYMENT.MARKED_PAID : MESSAGES.PAYMENT.MARKED_UNPAID };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in setBookingGuestPaid", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
