"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import type { ServiceResult } from "@/lib/service-types";

export async function setBookingGuestPaid(bookingGuestId: string, paid: boolean): Promise<ServiceResult> {
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
    unstable_rethrow(err);
    console.error("error in setBookingGuestPaid", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}
