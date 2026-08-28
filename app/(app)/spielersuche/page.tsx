import { Suspense, type JSX } from "react";
import PlayerSearchListContent from "@/components/player-search/PlayerSearchListContent";
import PlayerSearchListSkeleton from "@/components/player-search/PlayerSearchListSkeleton";

export default function PlayerSearchPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Spielersuche</h1>
        <p className="text-sm text-muted-foreground">
          Suche einen Gegner für eine Partie. Wer zusagt, bekommt automatisch einen freien Tisch
          gebucht.
        </p>
      </div>

      <Suspense fallback={<PlayerSearchListSkeleton />}>
        <PlayerSearchListContent />
      </Suspense>
    </div>
  );
}
