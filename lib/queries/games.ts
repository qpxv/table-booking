import "server-only";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Game } from "@/generated/prisma/client";

export async function listGames(): Promise<{
  success: boolean;
  games: Game[];
  message?: string;
}> {
  try {
    const games = await prisma.game.findMany({ orderBy: { name: "asc" } });
    return { success: true, games };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listGames", err);
    return { success: false, games: [], message: "Ein Fehler ist aufgetreten." };
  }
}
