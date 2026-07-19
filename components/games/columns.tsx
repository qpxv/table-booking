"use client";

import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Game } from "@/generated/prisma/client";

export function createGameColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
}): ColumnDef<Game>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-2.5"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-1.5" />
        </Button>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aktionen</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal />
              <span className="sr-only">Aktionen</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil />
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
                <Trash2 />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
