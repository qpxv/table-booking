"use client";

import { useState, type JSX } from "react";
import { Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { CONFIRM_MODE } from "@/lib/constants";
import { deletePlayerSearch } from "@/service/player-search-service/player-search";
import type { OpenPlayerSearch } from "@/lib/queries/player-search";
import PlayerSearchCard from "./PlayerSearchCard";
import PlayerSearchCreateDialog from "./PlayerSearchCreateDialog";
import PlayerSearchRespondDialog from "./PlayerSearchRespondDialog";

export default function PlayerSearchList({
  searches,
  hasPriorityTable,
  currentUserId,
  games,
}: {
  searches: OpenPlayerSearch[];
  hasPriorityTable: boolean;
  currentUserId: string;
  games: { id: string; name: string }[];
}): JSX.Element {
  const [createOpen, setCreateOpen] = useState(false);
  const [respondTarget, setRespondTarget] = useState<OpenPlayerSearch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OpenPlayerSearch | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Neue Spielersuche
        </Button>
      </div>

      {!hasPriorityTable && (
        <Alert>
          <Info />
          <AlertDescription>
            Für die automatische Buchung ist noch kein Tisch freigegeben. Ein Admin kann in der
            Tischverwaltung je Tisch eine Spielersuche-Priorität setzen.
          </AlertDescription>
        </Alert>
      )}

      {searches.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aktuell gibt es keine offenen Spielersuchen.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {searches.map((search) => (
            <PlayerSearchCard
              key={search.id}
              search={search}
              isOwn={search.creatorId === currentUserId}
              onRespond={() => setRespondTarget(search)}
              onDelete={() => setDeleteTarget(search)}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <PlayerSearchCreateDialog games={games} onClose={() => setCreateOpen(false)} />
      )}
      {respondTarget && (
        <PlayerSearchRespondDialog
          search={respondTarget}
          onClose={() => setRespondTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteDialog
          mode={CONFIRM_MODE.PLAYER_SEARCH}
          onConfirm={() => deletePlayerSearch(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
