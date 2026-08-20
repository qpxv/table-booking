"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { gameSchema, type GameInput } from "@/lib/schemas/game";
import type { ServiceResult } from "@/lib/service-types";

/** Returns a ServiceResult failure if the session isn't an admin, otherwise null. */
async function requireAdmin(): Promise<ServiceResult | null> {
  const session = await getSession();
  if (!isAdmin(session)) {
    return { success: false, message: "Nicht berechtigt." };
  }
  return null;
}

export async function createGame(values: GameInput): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = gameSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  try {
    await prisma.game.create({ data: parsed.data });
    revalidatePath("/admin/spiele");
    return { success: true, message: "Spiel erstellt." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in createGame", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function updateGame(id: string, values: GameInput): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = gameSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  try {
    await prisma.game.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin/spiele");
    return { success: true, message: "Spiel aktualisiert." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in updateGame", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function deleteGame(id: string): Promise<ServiceResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.game.delete({ where: { id } });
    revalidatePath("/admin/spiele");
    return { success: true, message: "Spiel gelöscht." };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in deleteGame", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}
