"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import type { ServiceResult } from "@/lib/service-types";

// Guests are club-wide, so removing one removes it everywhere at once:
// there's no per-member copy to detach, just the one shared Guest row.
export async function deleteGuest(guestId: string): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.$transaction([
      prisma.bookingGuest.deleteMany({ where: { guestId } }),
      prisma.guest.delete({ where: { id: guestId } }),
    ]);

    revalidatePath(ROUTES.ADMIN_USERS);
    return { success: true, message: MESSAGES.GUEST.REMOVED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deleteGuest", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
