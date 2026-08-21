"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { gameSchema, type GameInput } from "@/lib/schemas/game";
import type { ServiceResult } from "@/lib/service-types";

export async function createGame(values: GameInput): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = gameSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    await prisma.game.create({ data: parsed.data });
    revalidatePath(ROUTES.ADMIN_SPIELE);
    return { success: true, message: MESSAGES.GAME.CREATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in createGame", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function updateGame(id: string, values: GameInput): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = gameSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: MESSAGES.COMMON.INVALID_INPUT };

  try {
    await prisma.game.update({ where: { id }, data: parsed.data });
    revalidatePath(ROUTES.ADMIN_SPIELE);
    return { success: true, message: MESSAGES.GAME.UPDATED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in updateGame", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}

export async function deleteGame(id: string): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.game.delete({ where: { id } });
    revalidatePath(ROUTES.ADMIN_SPIELE);
    return { success: true, message: MESSAGES.GAME.DELETED };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deleteGame", err);
    return { success: false, message: MESSAGES.COMMON.GENERIC_ERROR };
  }
}
