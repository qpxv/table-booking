import type { JSX } from "react";
import { listGames } from "@/lib/queries/games";
import GamesManager from "@/components/games/GamesManager";

export default async function AdminGamesPage(): Promise<JSX.Element> {
  const result = await listGames();
  if (!result.success) throw new Error(result.message);
  const games = result.games;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Spielverwaltung</h1>
        <p className="text-sm text-muted-foreground">
          Spiele anlegen, bearbeiten und löschen.
        </p>
      </div>
      <GamesManager games={games} />
    </div>
  );
}
