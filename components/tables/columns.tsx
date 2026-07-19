"use client";

import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
  pending,
  onToggleActive,
  onToggleMultiple,
  onEdit,
  onDelete,
}: {
  pending: boolean;
  onToggleActive: (table: TableRecord) => void;
  onToggleMultiple: (table: TableRecord) => void;
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
      header: () => <div className="text-right">Aktiv</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Switch
            checked={row.original.active}
            onCheckedChange={() => onToggleActive(row.original)}
            disabled={pending}
          />
        </div>
      ),
    },
    {
      accessorKey: "allowMultipleBookings",
      header: () => <div className="text-right">Mehrfachbuchung</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Switch
            checked={row.original.allowMultipleBookings}
            onCheckedChange={() => onToggleMultiple(row.original)}
            disabled={pending}
          />
        </div>
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
