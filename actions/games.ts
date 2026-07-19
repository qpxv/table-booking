"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { gameSchema, type GameInput } from "@/lib/schemas/game";
import type { ActionResult } from "@/types/action-result";

/** Returns an ActionResult failure if the session isn't an admin, otherwise null. */
async function requireAdmin(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!isAdmin(session)) {
    return { success: false, message: "Nicht berechtigt." };
  }
  return null;
}

export async function createGame(values: GameInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = gameSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  try {
    await prisma.game.create({ data: parsed.data });
    revalidatePath("/admin/spiele");
    return { success: true, message: "Spiel erstellt." };
  } catch (err) {
    console.error("error in createGame", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function updateGame(id: string, values: GameInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = gameSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "Ungültige Eingabe." };

  try {
    await prisma.game.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin/spiele");
    return { success: true, message: "Spiel aktualisiert." };
  } catch (err) {
    console.error("error in updateGame", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function deleteGame(id: string): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.game.delete({ where: { id } });
    revalidatePath("/admin/spiele");
    return { success: true, message: "Spiel gelöscht." };
  } catch (err) {
    console.error("error in deleteGame", err);
    return { success: false, message: "Ein Fehler ist aufgetreten." };
  }
}

export async function listGames() {
  return prisma.game.findMany({ orderBy: { name: "asc" } });
}
