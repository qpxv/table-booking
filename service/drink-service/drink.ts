"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { requireAdmin } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { getCurrentBerlinYearMonth } from "@/lib/datetime";
import { drinkBudgetSchema } from "@/lib/schemas/drink";
import type { ServiceResult } from "@/lib/service-types";

export async function adjustDrinkCount(delta: 1 | -1): Promise<ServiceResult> {
  const session = await getSession();
  if (!session) return { success: false, message: MESSAGES.COMMON.NOT_AUTHENTICATED };

  const { year, month } = getCurrentBerlinYearMonth();

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.drinkTally.findUnique({
        where: { userId_year_month: { userId: session.user.id, year, month } },
        select: { count: true },
      });
      const newCount = Math.max(0, (existing?.count ?? 0) + delta);
      await tx.drinkTally.upsert({
        where: { userId_year_month: { userId: session.user.id, year, month } },
        create: { userId: session.user.id, year, month, count: newCount },
        update: { count: newCount },
      });
    });

    // Revalidates (app)/layout.tsx (shared by every route), which is where
    // the widget's ownCount/guests prop is fetched: without this, the prop
    // stays stale at its last full-load value, so remounting the widget
    // (e.g. closing and reopening the mobile sidebar's Sheet, which
    // unmounts its subtree) resets the optimistic local count back to it.
    revalidatePath(ROUTES.DASHBOARD, "layout");

    return { success: true, message: delta > 0 ? MESSAGES.DRINKS.ADDED : MESSAGES.DRINKS.REMOVED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in adjustDrinkCount", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function setDrinkBudget(year: number, month: number, initialCount: unknown): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = drinkBudgetSchema.safeParse({ initialCount });
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    await prisma.drinkMonthlyBudget.upsert({
      where: { year_month: { year, month } },
      create: { year, month, initialCount: parsed.data.initialCount },
      update: { initialCount: parsed.data.initialCount },
    });
    revalidatePath(ROUTES.ADMIN_GETRAENKE);
    return { success: true, message: MESSAGES.DRINKS.BUDGET_UPDATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in setDrinkBudget", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
