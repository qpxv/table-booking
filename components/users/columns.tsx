"use client";

import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppUser } from "./UserFormDialog";

export function createUserColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
}): ColumnDef<AppUser>[] {
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
      accessorKey: "email",
      header: "E-Mail",
    },
    {
      accessorKey: "role",
      header: "Rolle",
      cell: ({ row }) => {
        const isAdmin = row.original.role === "admin";
        return (
          <Badge variant={isAdmin ? "secondary" : "outline"}>
            {isAdmin ? "Admin" : "Mitglied"}
          </Badge>
        );
      },
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
