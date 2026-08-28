"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import type { ServiceResult } from "@/lib/service-types";

export async function setBookingGuestPaid(bookingGuestId: string, paid: boolean): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const bookingGuest = await prisma.bookingGuest.findUnique({
    where: { id: bookingGuestId },
    include: { booking: { select: { userId: true } } },
  });
  if (!bookingGuest) return { success: false, message: MESSAGES.GUEST.NOT_FOUND };

  if (bookingGuest.booking.userId !== session.user.id && !isAdmin(session)) {
    return { success: false, message: MESSAGES.COMMON.UNAUTHORIZED };
  }

  try {
    // notification-potential: when an admin (not the member themselves)
    // toggles this, notify bookingGuest.booking.userId that their guest's
    // payment was marked paid/unpaid.
    await prisma.bookingGuest.update({ where: { id: bookingGuestId }, data: { paid } });
    revalidatePath(ROUTES.GASTHISTORIE);
    return { success: true, message: paid ? MESSAGES.PAYMENT.MARKED_PAID : MESSAGES.PAYMENT.MARKED_UNPAID };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in setBookingGuestPaid", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
