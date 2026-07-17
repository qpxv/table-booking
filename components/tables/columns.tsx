"use client";

import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Table as TableRecord } from "@/generated/prisma/client";

export function createTableColumns({
  onToggleActive,
  onEdit,
  onDelete,
}: {
  onToggleActive: (table: TableRecord) => void;
  onEdit: (table: TableRecord) => void;
  onDelete: (table: TableRecord) => void;
}): ColumnDef<TableRecord>[] {
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
      accessorKey: "active",
      header: "Aktiv",
      cell: ({ row }) => (
        <Switch
          checked={row.original.active}
          onCheckedChange={() => onToggleActive(row.original)}
        />
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal />
            <span className="sr-only">Aktionen</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Bearbeiten</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
