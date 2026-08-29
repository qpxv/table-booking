import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";
import { listOpenPlayerSearches } from "@/lib/queries/player-search";
import { listGames } from "@/lib/queries/games";
import PlayerSearchList from "./PlayerSearchList";

export default async function PlayerSearchListContent(): Promise<JSX.Element> {
  const session = await checkSession();

  const [searchesResult, gamesResult] = await Promise.all([
    listOpenPlayerSearches(),
    listGames(),
  ]);
  if (!searchesResult.success) throw new Error(searchesResult.message);
  if (!gamesResult.success) throw new Error(gamesResult.message);

  return (
    <PlayerSearchList
      searches={searchesResult.searches}
      hasPriorityTable={searchesResult.hasPriorityTable}
      currentUserId={session.user.id}
      isAdmin={isAdmin(session)}
      games={gamesResult.games.map((game) => ({ id: game.id, name: game.name }))}
    />
  );
}
