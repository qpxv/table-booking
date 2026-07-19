import { listGames } from "@/actions/games";
import GamesManager from "@/components/games/GamesManager";

export default async function AdminGamesPage() {
  const games = await listGames();

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
