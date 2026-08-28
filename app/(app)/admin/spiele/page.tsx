import { Suspense, type JSX } from "react";
import GamesContent from "@/components/games/GamesContent";
import ManagerTableSkeleton from "@/components/shared/ManagerTableSkeleton";

export default function AdminGamesPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Spielverwaltung</h1>
        <p className="text-sm text-muted-foreground">
          Spiele anlegen, bearbeiten und löschen.
        </p>
      </div>
      <Suspense fallback={<ManagerTableSkeleton columns={3} />}>
        <GamesContent />
      </Suspense>
    </div>
  );
}
