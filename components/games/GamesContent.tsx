import type { JSX } from "react";
import { listGames } from "@/lib/queries/games";
import GamesManager from "@/components/games/GamesManager";

export default async function GamesContent(): Promise<JSX.Element> {
  const result = await listGames();
  if (!result.success) throw new Error(result.message);

  return <GamesManager games={result.games} />;
}
