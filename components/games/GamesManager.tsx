"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { Game } from "@/generated/prisma/client";
import { deleteGame } from "@/actions/games";
import { createGameColumns } from "./columns";
import GameFormDialog from "./GameFormDialog";

export default function GamesManager({ games }: { games: Game[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null);

  function openCreateDialog() {
    setEditingGame(null);
    setDialogOpen(true);
  }

  function openEditDialog(game: Game) {
    setEditingGame(game);
    setDialogOpen(true);
  }

  const columns = useMemo(
    () => createGameColumns({ onEdit: openEditDialog, onDelete: setDeleteTarget }),
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus />
          Neues Spiel
        </Button>
      </div>
      <DataTable columns={columns} data={games} />
      {dialogOpen && <GameFormDialog game={editingGame} onClose={() => setDialogOpen(false)} />}
      {deleteTarget && (
        <ConfirmDeleteDialog
          mode="game"
          name={deleteTarget.name}
          onConfirm={() => deleteGame(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
