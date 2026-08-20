"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import type { ServiceResult } from "@/lib/service-types";

// Guests are club-wide, so removing one removes it everywhere at once:
// there's no per-member copy to detach, just the one shared Guest row.
export async function deleteGuest(guestId: string): Promise<ServiceResult> {
  const session = await getSession();
  if (!isAdmin(session)) {
    return { success: false, message: "Nicht berechtigt." };
  }

  try {
    await prisma.$transaction([
      prisma.bookingGuest.deleteMany({ where: { guestId } }),
      prisma.guest.delete({ where: { id: guestId } }),
    ]);

    revalidatePath("/admin/users");
    return { success: true, message: "Gast entfernt." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deleteGuest", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}
