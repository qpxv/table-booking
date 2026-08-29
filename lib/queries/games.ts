import "server-only";
import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/constants";
import type { Game } from "@/generated/prisma/client";

// The games list only changes through the admin Spielverwaltung actions,
// which bust CACHE_TAGS.GAMES. It's read on every booking dialog and
// Spielersuche load, so caching it removes that query from the hot path.
const getCachedGames = unstable_cache(
  async (): Promise<Game[]> => prisma.game.findMany({ orderBy: { name: "asc" } }),
  ["games-list"],
  { tags: [CACHE_TAGS.GAMES] },
);

export async function listGames(): Promise<{
  success: boolean;
  games: Game[];
  message?: string;
}> {
  try {
    const games = await getCachedGames();
    return { success: true, games };
  } catch (err) {
    unstable_rethrow(err);
    console.error("error in listGames", err);
    return { success: false, games: [], message: "Ein Fehler ist aufgetreten." };
  }
}
